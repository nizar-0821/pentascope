from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from functools import wraps
from scanner.recon import run_recon
from scanner.vuln_scan import run_vuln_scan
from datetime import datetime, timezone
from urllib.parse import urlparse
import sys, os, json, threading, uuid, asyncio, ipaddress, socket

# Add project root to path for reports package
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from reports.generator import generate_report

app = Flask(__name__)

# ── Configuration (env-controlled) ──────────────────────────────────────────
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001"   # 3001 = React dev fallback when 3000 is taken
).split(",")
API_KEY         = os.environ.get("PENTASCOPE_API_KEY", "")   # Empty = disabled (dev mode)

CORS(app, origins=ALLOWED_ORIGINS)

# check_same_thread=False is required when SQLite is accessed from background
# threads.  Flask-SQLAlchemy uses a scoped session per thread, so this is safe.
app.config["SQLALCHEMY_DATABASE_URI"]        = "sqlite:///pentascope.db?check_same_thread=False"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"]      = {
    "connect_args": {"check_same_thread": False},
    "pool_pre_ping": True,
}
db = SQLAlchemy(app)

# ── Rate Limiting ────────────────────────────────────────────────────────────
try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    limiter = Limiter(get_remote_address, app=app, default_limits=["60 per minute"])
    LIMITER_AVAILABLE = True
except ImportError:
    LIMITER_AVAILABLE = False
    print("[!] flask-limiter not installed — rate limiting disabled")

# ── Thread State ─────────────────────────────────────────────────────────────
scan_progress: dict = {}
scan_lock = threading.Lock()


# ── Helpers ──────────────────────────────────────────────────────────────────
def validate_target(target: str) -> bool:
    """Validate that target is a proper HTTP/HTTPS URL with a hostname."""
    try:
        parsed = urlparse(target.strip())
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


def _is_private_ip(hostname: str) -> tuple[bool, str]:
    """Return (True, ip_str) if the hostname resolves to a private/loopback IP."""
    try:
        ip_str = socket.gethostbyname(hostname.split(":")[0])
        if ipaddress.ip_address(ip_str).is_private:
            return True, ip_str
    except Exception:
        pass
    return False, ""


async def async_check_scope(target: str) -> tuple[bool, str]:
    """
    Non-blocking scope check.
    Runs the robots.txt fetch and IP resolution in the default executor
    so it never blocks the Flask/threading model.
    """
    import aiohttp

    parsed = urlparse(target)
    hostname = parsed.netloc.split(":")[0]

    # Private IP check (fast, synchronous, use executor)
    loop = asyncio.get_event_loop()
    is_private, ip_str = await loop.run_in_executor(None, _is_private_ip, hostname)
    if is_private:
        return False, f"Target resolves to a private IP ({ip_str}). Please confirm authorization."

    # robots.txt check (async HTTP)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    try:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.get(
                robots_url,
                timeout=aiohttp.ClientTimeout(total=5),
                allow_redirects=True,
            ) as r:
                if r.status == 200:
                    text = await r.text(errors="replace")
                    if "User-agent: *" in text and "Disallow: /" in text:
                        return False, "Target robots.txt globally disallows crawling (Disallow: /)."
    except Exception:
        pass  # Can't reach robots.txt — treat as allowed

    return True, "Target is in scope."


def check_scope(target: str) -> tuple[bool, str]:
    """Synchronous wrapper for use inside Flask route handlers."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(async_check_scope(target))
    finally:
        loop.close()


def count_severities(vulns: list) -> dict:
    """Count findings by severity level. Returns lowercase keys for DB model."""
    return {
        "critical": sum(1 for v in vulns if v.get("severity") == "CRITICAL"),
        "high":     sum(1 for v in vulns if v.get("severity") == "HIGH"),
        "medium":   sum(1 for v in vulns if v.get("severity") == "MEDIUM"),
        "low":      sum(1 for v in vulns if v.get("severity") == "LOW"),
    }


def require_api_key(f):
    """Optional API key middleware. Only enforced when PENTASCOPE_API_KEY env var is set."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if API_KEY and request.headers.get("X-API-Key") != API_KEY:
            return jsonify({"error": "Unauthorized — set X-API-Key header"}), 401
        return f(*args, **kwargs)
    return decorated


def schedule_cleanup(scan_id: str, delay: int = 300):
    """Remove scan entry from memory after `delay` seconds (prevents memory leak)."""
    import time
    time.sleep(delay)
    with scan_lock:
        scan_progress.pop(scan_id, None)


# ── Database Model ───────────────────────────────────────────────────────────
class ScanResult(db.Model):
    id         = db.Column(db.Integer, primary_key=True, index=True)
    target     = db.Column(db.String(255))
    scan_type  = db.Column(db.String(50))
    findings   = db.Column(db.Text)
    critical   = db.Column(db.Integer, default=0)
    high       = db.Column(db.Integer, default=0)
    medium     = db.Column(db.Integer, default=0)
    low        = db.Column(db.Integer, default=0)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

with app.app_context():
    db.create_all()


# ── Routes ───────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return jsonify({"message": "PentaScope API", "version": "1.1"})


@app.route("/api/recon", methods=["POST"])
@require_api_key
def recon():
    data   = request.get_json() or {}
    target = data.get("target", "").strip()
    if not target or not validate_target(target):
        return jsonify({"error": "A valid http/https target URL is required"}), 400

    is_allowed, scope_msg = check_scope(target)
    if not is_allowed and not data.get("force", False):
        return jsonify({
            "error": "Scope/Authorization Check Failed",
            "details": scope_msg,
            "requires_force": True,
        }), 403

    result = run_recon(target)
    scan   = ScanResult(target=target, scan_type="recon", findings=json.dumps(result))
    db.session.add(scan)
    db.session.commit()
    return jsonify(result)


@app.route("/api/scan", methods=["POST"])
@require_api_key
def scan():
    data   = request.get_json() or {}
    target = data.get("target", "").strip()
    if not target or not validate_target(target):
        return jsonify({"error": "A valid http/https target URL is required"}), 400

    result    = run_vuln_scan(target)
    all_vulns = result.get("vulnerabilities", []) + result.get("missing_headers", [])
    counts    = count_severities(all_vulns)

    scan = ScanResult(target=target, scan_type="vuln", findings=json.dumps(result), **counts)
    db.session.add(scan)
    db.session.commit()
    return jsonify(result)


@app.route("/api/history", methods=["GET"])
@require_api_key
def history():
    # Pagination support
    page  = request.args.get("page", 1, type=int)
    limit = min(request.args.get("limit", 20, type=int), 100)

    stmt  = db.select(ScanResult).order_by(ScanResult.id.desc()).limit(limit).offset((page - 1) * limit)
    scans = db.session.execute(stmt).scalars().all()
    total = db.session.execute(db.select(db.func.count(ScanResult.id))).scalar()

    return jsonify({
        "page":    page,
        "limit":   limit,
        "total":   total,
        "results": [{
            "id":        s.id,
            "target":    s.target,
            "scan_type": s.scan_type,
            "critical":  s.critical,
            "high":      s.high,
            "medium":    s.medium,
            "low":       s.low,
            "created_at": s.created_at.strftime("%Y-%m-%d %H:%M") if s.created_at else "",
        } for s in scans],
    })


@app.route("/api/history/<int:scan_id>", methods=["GET"])
@require_api_key
def history_detail(scan_id):
    s = db.get_or_404(ScanResult, scan_id)
    return jsonify(json.loads(s.findings))


@app.route("/api/report", methods=["POST"])
@require_api_key
def report():
    data       = request.get_json() or {}
    target     = data.get("target", "").strip()
    recon_data = data.get("recon", {})
    vuln_data  = data.get("vulns", {})

    if not target or not validate_target(target):
        return jsonify({"error": "A valid http/https target URL is required"}), 400
    try:
        rel_path = generate_report(target, recon_data, vuln_data)
        abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", rel_path))
        return send_file(
            abs_path,
            as_attachment=True,
            download_name="pentest_report.pdf",
            mimetype="application/pdf",
        )
    except Exception as e:
        return jsonify({"error": f"Report generation failed: {str(e)}"}), 500


@app.route("/api/export/json", methods=["POST"])
@require_api_key
def export_json():
    data = request.get_json() or {}
    return jsonify(data)


@app.route("/api/export/csv", methods=["POST"])
@require_api_key
def export_csv():
    data  = request.get_json() or {}
    vulns = data.get("vulnerabilities", []) + data.get("missing_headers", [])
    csv_rows = ["Type,Severity,CVSS,CWE,OWASP,Description,Remediation"]
    for v in vulns:
        row = [
            str(v.get("type",        "")).replace(",", ";"),
            str(v.get("severity",    "")),
            str(v.get("cvss",        "")),
            str(v.get("cwe",         "N/A")),
            str(v.get("owasp",       "N/A")).replace(",", ";"),
            str(v.get("description", "")).replace(",", ";"),
            str(v.get("remediation", "")).replace(",", ";"),
        ]
        csv_rows.append(",".join(row))
    return "\n".join(csv_rows), 200, {"Content-Type": "text/csv"}


@app.route("/api/scan/progress", methods=["POST"])
@require_api_key
def scan_with_progress():
    data   = request.get_json() or {}
    target = data.get("target", "").strip()
    if not target or not validate_target(target):
        return jsonify({"error": "A valid http/https target URL is required"}), 400

    is_allowed, scope_msg = check_scope(target)
    if not is_allowed and not data.get("force", False):
        return jsonify({
            "error": "Scope/Authorization Check Failed",
            "details": scope_msg,
            "requires_force": True,
        }), 403

    scan_id = str(uuid.uuid4())
    with scan_lock:
        scan_progress[scan_id] = {
            "step": 0, "total": 10,
            "message": "Starting...",
            "done": False, "result": None,
        }

    def run():
        with scan_lock:
            scan_progress[scan_id]["step"]    = 1
            scan_progress[scan_id]["message"] = "Running Reconnaissance..."

        run_recon(target)

        def update_progress(step: int, msg: str):
            with scan_lock:
                scan_progress[scan_id]["step"]    = step
                scan_progress[scan_id]["message"] = msg

        vuln_result = run_vuln_scan(target, progress_callback=update_progress)
        all_vulns   = vuln_result.get("vulnerabilities", []) + vuln_result.get("missing_headers", [])
        counts      = count_severities(all_vulns)

        # Each background thread must use its own app context AND its own
        # DB session — Flask-SQLAlchemy's scoped_session handles per-thread
        # isolation automatically when check_same_thread=False is set.
        with app.app_context():
            scan_obj = ScanResult(
                target=target, scan_type="vuln",
                findings=json.dumps(vuln_result), **counts,
            )
            db.session.add(scan_obj)
            db.session.commit()
            db.session.remove()   # explicitly return session to pool

        with scan_lock:
            scan_progress[scan_id]["done"]    = True
            scan_progress[scan_id]["result"]  = vuln_result
            scan_progress[scan_id]["message"] = "Scan Complete!"
            scan_progress[scan_id]["step"]    = 10

        # Auto-cleanup after 5 minutes to prevent memory leak
        threading.Thread(target=schedule_cleanup, args=(scan_id,), daemon=True).start()

    threading.Thread(target=run, daemon=True).start()
    return jsonify({"scan_id": scan_id})


@app.route("/api/scan/status/<scan_id>", methods=["GET"])
def scan_status(scan_id):
    with scan_lock:
        progress = dict(scan_progress.get(scan_id, {}))
    if not progress:
        return jsonify({"error": "Scan not found or expired"}), 404
    return jsonify(progress)


if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    host       = os.environ.get("FLASK_HOST", "127.0.0.1")
    port       = int(os.environ.get("FLASK_PORT", "5000"))
    print(f"[*] PentaScope API v1.1 starting — debug={debug_mode}, host={host}, port={port}")
    print(f"[*] API Key auth: {'ENABLED' if API_KEY else 'DISABLED (set PENTASCOPE_API_KEY to enable)'}")
    app.run(debug=debug_mode, host=host, port=port)
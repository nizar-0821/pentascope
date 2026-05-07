from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from scanner.recon import run_recon
from scanner.vuln_scan import run_vuln_scan
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from reports.generator import generate_report
from datetime import datetime

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pentascope.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ── Model ──────────────────────────────────────────
class ScanResult(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    target      = db.Column(db.String(255))
    scan_type   = db.Column(db.String(50))
    findings    = db.Column(db.Text)
    critical    = db.Column(db.Integer, default=0)
    high        = db.Column(db.Integer, default=0)
    medium      = db.Column(db.Integer, default=0)
    low         = db.Column(db.Integer, default=0)
    created_at  = db.Column(db.String(50))

with app.app_context():
    db.create_all()

# ── Routes ─────────────────────────────────────────
@app.route('/')
def index():
    return jsonify({"message": "PentaScope API", "version": "1.0"})

@app.route('/api/recon', methods=['POST'])
def recon():
    data   = request.get_json()
    target = data.get('target')
    if not target:
        return jsonify({"error": "target required"}), 400
    result = run_recon(target)

    # Save to DB
    scan = ScanResult(
        target=target, scan_type="recon",
        findings=json.dumps(result),
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M")
    )
    db.session.add(scan)
    db.session.commit()
    return jsonify(result)

@app.route('/api/scan', methods=['POST'])
def scan():
    data   = request.get_json()
    target = data.get('target')
    if not target:
        return jsonify({"error": "target required"}), 400
    result = run_vuln_scan(target)

    all_vulns = result.get("vulnerabilities",[]) + result.get("missing_headers",[])
    scan = ScanResult(
        target=target, scan_type="vuln",
        findings=json.dumps(result),
        critical=sum(1 for v in all_vulns if v.get("severity")=="CRITICAL"),
        high    =sum(1 for v in all_vulns if v.get("severity")=="HIGH"),
        medium  =sum(1 for v in all_vulns if v.get("severity")=="MEDIUM"),
        low     =sum(1 for v in all_vulns if v.get("severity")=="LOW"),
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M")
    )
    db.session.add(scan)
    db.session.commit()
    return jsonify(result)

@app.route('/api/history', methods=['GET'])
def history():
    scans = ScanResult.query.order_by(ScanResult.id.desc()).limit(20).all()
    return jsonify([{
        "id":         s.id,
        "target":     s.target,
        "scan_type":  s.scan_type,
        "critical":   s.critical,
        "high":       s.high,
        "medium":     s.medium,
        "low":        s.low,
        "created_at": s.created_at
    } for s in scans])

@app.route('/api/history/<int:scan_id>', methods=['GET'])
def history_detail(scan_id):
    s = ScanResult.query.get_or_404(scan_id)
    return jsonify(json.loads(s.findings))

@app.route('/api/report', methods=['POST'])
def report():
    import os
    from flask import send_file
    data   = request.get_json()
    target = data.get('target')
    recon  = data.get('recon', {})
    vulns  = data.get('vulns', {})
    if not target:
        return jsonify({"error": "target required"}), 400
    rel_path = generate_report(target, recon, vulns)
    abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", rel_path))
    return send_file(abs_path, as_attachment=True, download_name="pentest_report.pdf", mimetype='application/pdf')

@app.route('/api/export/json', methods=['POST'])
def export_json():
    data = request.get_json()
    return jsonify(data)

@app.route('/api/export/csv', methods=['POST'])
def export_csv():
    data     = request.get_json()
    vulns    = data.get("vulnerabilities",[]) + data.get("missing_headers",[])
    csv_rows = ["Type,Severity,CVSS,Description,Remediation"]
    for v in vulns:
        csv_rows.append(f"{v.get('type','')},{v.get('severity','')},{v.get('cvss','')},{v.get('description','')},{v.get('remediation','')}")
    return "\n".join(csv_rows), 200, {"Content-Type": "text/csv"}

import threading
scan_progress = {}

@app.route('/api/scan/progress', methods=['POST'])
def scan_with_progress():
    data   = request.get_json()
    target = data.get('target')
    if not target:
        return jsonify({"error": "target required"}), 400

    scan_id = str(datetime.now().timestamp())
    scan_progress[scan_id] = {"step": 0, "total": 10, "message": "Starting...", "done": False, "result": None}

    def run():
        scan_progress[scan_id]["step"] = 1
        scan_progress[scan_id]["message"] = "Running Reconnaissance..."
        recon_result = run_recon(target)

        def update_progress(step, msg):
            scan_progress[scan_id]["step"] = step
            scan_progress[scan_id]["message"] = msg

        vuln_result = run_vuln_scan(target, progress_callback=update_progress)
        all_vulns   = vuln_result.get("vulnerabilities",[]) + vuln_result.get("missing_headers",[])

        scan = ScanResult(
            target=target, scan_type="vuln",
            findings=json.dumps(vuln_result),
            critical=sum(1 for v in all_vulns if v.get("severity")=="CRITICAL"),
            high    =sum(1 for v in all_vulns if v.get("severity")=="HIGH"),
            medium  =sum(1 for v in all_vulns if v.get("severity")=="MEDIUM"),
            low     =sum(1 for v in all_vulns if v.get("severity")=="LOW"),
            created_at=datetime.now().strftime("%Y-%m-%d %H:%M")
        )
        with app.app_context():
            db.session.add(scan)
            db.session.commit()

        scan_progress[scan_id]["done"]    = True
        scan_progress[scan_id]["result"]  = vuln_result
        scan_progress[scan_id]["message"] = "Scan Complete!"

    threading.Thread(target=run).start()
    return jsonify({"scan_id": scan_id})

@app.route('/api/scan/status/<scan_id>', methods=['GET'])
def scan_status(scan_id):
    progress = scan_progress.get(scan_id)
    if not progress:
        return jsonify({"error": "scan not found"}), 404
    return jsonify(progress)
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
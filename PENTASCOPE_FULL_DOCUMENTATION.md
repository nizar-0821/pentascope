# PentaScope — Complete Project Documentation

> **Purpose:** This document is a fully exhaustive technical reference for the PentaScope penetration testing framework. It is intended to onboard any new developer or AI assistant with zero prior context.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | PentaScope |
| **Tagline** | Automated Web Application Penetration Testing Framework |
| **Version** | 1.1 Enterprise |
| **Author** | Nizar Oualidi |
| **Context** | Cybersecurity Training Project (Projet de Fin de Formation — PFF) 2024/2025 |
| **License** | MIT |

### Purpose
PentaScope automates the full web application security assessment lifecycle: from passive reconnaissance and port scanning, through active vulnerability detection (OWASP Top 10), to professional-grade PDF report generation — all orchestrated through a modern React dashboard.

### Problem It Solves
Manual penetration testing is time-consuming, inconsistent, and requires deep expertise at every step. PentaScope unifies recon, scanning, exploit-PoC generation, attack-surface visualization, and reporting into a single tool operable from a browser UI.

### Target Audience
- Cybersecurity students / trainees presenting a capstone project
- Junior penetration testers needing an automated baseline scanner
- Security teams requiring fast triage reports for web applications

### Methodology Standards
| Standard | Usage |
|----------|-------|
| **OWASP Top 10 (2021)** | Vulnerability classification for all findings |
| **PTES (Penetration Testing Execution Standard)** | Reconnaissance phase methodology |
| **CVSS v3.1** | Severity scoring for every vulnerability |
| **CWE** | Weakness enumeration mapped to each finding type |

---

## 2. Complete Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Core backend language |
| Flask | 3.x | REST API web framework |
| Flask-CORS | latest | Enable cross-origin requests from React frontend |
| Flask-SQLAlchemy | latest | ORM for SQLite database (thread-safe config) |
| flask-limiter | 3.5.0 | Rate limiting — 60 req/min per IP |
| SQLite | built-in | Persistent scan history storage |
| python-nmap | latest | Python wrapper for Nmap port scanning |
| aiohttp | 3.11+ | Async HTTP client for crawler and all vuln tests |
| requests | latest | HTTP client (used in sync scope-check fallback) |
| BeautifulSoup4 (bs4) | latest | HTML parsing for async web crawler |
| ReportLab | latest | PDF generation for pentest reports |
| asyncio | stdlib | True parallel I/O — all scan tests run simultaneously |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | ^19.2.5 | UI component framework |
| axios | ^1.16.0 | HTTP client for API calls |
| react-force-graph-2d | ^1.29.1 | Interactive 2D attack surface node graph |
| framer-motion | ^12.38.0 | Smooth animations and transitions |
| @splinetool/react-spline | ^4.1.0 | 3D background scene integration |
| @splinetool/runtime | ^1.12.91 | Spline 3D runtime engine |
| lucide-react | ^1.14.0 | Icon library (Shield, Target, Activity, etc.) |
| react-scripts | 5.0.1 | CRA build toolchain |
| web-vitals | ^2.1.4 | Performance monitoring |

### External CLI Tools (System-level)
| Tool | Purpose |
|------|---------|
| **Nmap** | Port scanning (`-sT -T4 --top-ports 100`) |
| **Subfinder** | Passive subdomain enumeration |
| **Docker** | Run DVWA (test target) |

### Why Each Was Chosen
- **Flask**: Lightweight, easy to wire up REST endpoints with minimal boilerplate.
- **SQLAlchemy**: Simplifies DB operations; SQLite requires zero server setup.
- **BeautifulSoup4**: Best Python library for parsing raw HTML to discover forms and links.
- **python-nmap**: Direct Python binding to Nmap; avoids shell injection risks vs. subprocess.
- **ReportLab**: Industry-standard PDF generation in Python; supports full layout control.
- **React**: Component model ideal for dynamic dashboards; state management for live scan progress.
- **react-force-graph-2d**: Renders WebGL-accelerated node graphs that visually impress evaluators (Maltego-like visualization).
- **framer-motion**: Provides production-quality animations (fade-in on scroll, slide transitions) with minimal code.
- **axios**: Promise-based HTTP client with blob support needed for PDF download.
- **lucide-react**: Consistent, lightweight icon set that matches the luxury aesthetic.

---

## 3. Full Project Architecture

### Folder / File Tree

```
pentest-framework/
├── README.md                          # Project overview, setup instructions
├── .env.example                       # Environment variable template
├── docker-compose.yml                 # Isolated network, health checks, named volumes
├── .github/
│   └── workflows/
│       └── ci.yml                     # CI: lint + build + Docker smoke test
├── backend/
│   ├── app.py                         # Flask REST API — routes, thread-safe DB, async scope check
│   ├── Dockerfile                     # Includes nmap + subfinder binary (multi-arch v2.6.6)
│   ├── requirements.txt               # Pinned Python dependencies
│   └── scanner/
│       ├── recon.py                   # Subdomain enum (subfinder) + port scan (nmap)
│       ├── vuln_scan.py               # Async vuln engine — asyncio.gather() + CWE/OWASP mapping
│       └── crawler.py                 # Async aiohttp BFS crawler — never blocks event loop
├── frontend/
│   ├── package.json                   # NPM dependencies (name: "pentascope")
│   ├── Dockerfile                     # Multi-stage build → nginx:alpine
│   ├── public/
│   │   └── cyber_bg.png              # Background image used in Hero section
│   └── src/
│       ├── index.js                   # React entry point — mounts <App /> to #root
│       ├── index.css                  # Global CSS resets
│       ├── utils.js                   # SEV color tokens + API base URL constant
│       ├── App.js                     # Main layout + navigation (~200 lines)
│       ├── hooks/
│       │   └── useScan.js             # Custom hook — all scan state & API logic
│       └── components/
│           ├── LandingPage.jsx        # Animated entry/splash page
│           ├── ProgressBar.jsx        # Real-time polling progress component
│           ├── VulnCard.jsx           # Expandable finding card + PoC generator
│           ├── AttackGraph.jsx        # Force-directed attack surface graph
│           ├── HistoryView.jsx        # Paginated scan history (all severities)
│           └── UI.jsx                 # Design system: Badge, StatCard, CvssBar, Section…
├── reports/
│   ├── generator.py                   # ReportLab PDF report generator
│   └── pentest_report.pdf             # Last generated report output
└── instance/
    └── pentascope.db                  # SQLite database (auto-created by Flask-SQLAlchemy)
```

### Role of Every File

| File | Role |
|------|------|
| `backend/app.py` | Flask application factory. Defines `ScanResult` DB model, all API routes, thread-safe SQLite config (`check_same_thread=False`), async `check_scope()` via aiohttp, and background threading with `db.session.remove()`. |
| `backend/scanner/recon.py` | Runs `subfinder` (subprocess) for subdomain discovery and `python-nmap` for top-100 port scan. Returns structured dict. |
| `backend/scanner/vuln_scan.py` | Fully async vulnerability engine. All 8 test suites run simultaneously via `asyncio.gather()`. Uses `VULN_META` dict with accurate CWE/OWASP references (no fabricated CVE numbers). |
| `backend/scanner/crawler.py` | Fully async `aiohttp` BFS crawler. Scrapes pages concurrently without blocking the event loop. Parses `<form>` and `<a href>` elements, deduplicates by signature. |
| `backend/Dockerfile` | Installs `nmap` via apt and downloads `subfinder` binary from GitHub releases (multi-arch: amd64/arm64, pinned v2.6.6). |
| `docker-compose.yml` | Two-service stack on isolated `pentascope-net` bridge network. Backend not exposed to host. Named volumes for DB and reports. Backend health check before frontend starts. |
| `.github/workflows/ci.yml` | 3-stage pipeline: (1) flake8 + pytest on Python 3.11/3.12, (2) ESLint + production build on Node 18/20, (3) Docker smoke test on main branch pushes. |
| `reports/generator.py` | Builds a multi-page PDF using ReportLab. Includes a custom dark cover page, executive summary table, severity breakdown table, recon port table, per-vulnerability finding cards, and strategic recommendations. |
| `frontend/src/App.js` | ~200-line main layout component. Handles navigation (`scan`/`history` tabs) and delegates all scan logic to `useScan` hook. |
| `frontend/src/hooks/useScan.js` | Custom React hook. Encapsulates all scan state (`target`, `scanning`, `scanId`, `results`), all API calls (`startScan`, `runRecon`, `downloadReport`), and derived values (`allVulns`, `counts`, `riskLabel`). |
| `frontend/src/components/HistoryView.jsx` | Paginated scan history table showing all 4 severity levels (C/H/M/L), refresh button, PDF download per scan, and backwards-compatible with old flat API response. |
| `instance/pentascope.db` | SQLite file auto-created by `db.create_all()` inside Flask app context. Stores all scan results. |

---

## 4. Complete Setup & Installation

### Environment
- **OS:** Kali Linux (running in VMware)
- **Shell:** bash
- **Python:** 3.11+ (system Python3)
- **Virtual Environment path:** `~/pentest-env`

### Option A — Docker Compose (Recommended)

```bash
# 1. Clone / navigate to project
git clone https://github.com/nizar-0821/pentascope.git
cd pentascope

# 2. (Optional) set environment variables
cp .env.example .env

# 3. Build and start the full stack
docker compose up --build -d

# Frontend: http://localhost:3000
# Backend API: internal only (port 5000 not exposed to host)
```

> Docker images include `nmap` and `subfinder` — no manual system dependency installation needed.

### Option B — Manual Setup

#### Step-by-Step Commands (in exact order)

```bash
# 1. Clone / navigate to project
cd ~/pentest-framework

# 2. Create and activate Python virtual environment
python3 -m venv ~/pentest-env
source ~/pentest-env/bin/activate

# 3. Install ALL Python dependencies from requirements.txt
pip install -r backend/requirements.txt
# (includes: flask, flask-cors, flask-sqlalchemy, flask-limiter,
#  requests, aiohttp, reportlab, python-nmap, beautifulsoup4, SQLAlchemy)

# 4. Install Node.js dependencies (frontend)
cd frontend
npm install

# 5. Start Docker DVWA test target (optional, for testing)
sudo docker run -d -p 8080:80 vulnerables/web-dvwa
# OR restart existing container:
sudo docker start $(sudo docker ps -aq)

# 6. Start Flask backend (Terminal 1)
cd ~/pentest-framework
source ~/pentest-env/bin/activate
python3 backend/app.py

# 7. Start React frontend (Terminal 2)
cd ~/pentest-framework/frontend
npm start
```

Open browser at: **http://localhost:3000**
Backend API running at: **http://localhost:5000**

### Errors Encountered and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ModuleNotFoundError: No module named 'bs4'` | `beautifulsoup4` not installed in virtual environment | `~/pentest-env/bin/pip install beautifulsoup4` |
| PDF download not triggering | `app.py` returned file path string instead of file bytes; frontend didn't handle blob | Backend: added `send_file(abs_path, as_attachment=True)`; Frontend: added `{ responseType: "blob" }` to axios and created object URL |
| `FileNotFoundError` on PDF send | `send_file` received relative path; Flask resolved it from wrong working dir | Fixed with `os.path.abspath(os.path.join(os.path.dirname(__file__), "..", rel_path))` |
| PDF had large blank pages between sections | `PageBreak()` calls were forcing new pages after every section | Removed explicit `PageBreak()` calls from Recon and Findings sections; replaced with `Spacer()` |
| Progress bar frozen/stuck on error | Frontend caught API error but didn't update progress state | Added error state: `setProgress(p => ({ ...p, message: "Error: Connection to scanning engine lost", step: 0 }))` |
| Progress bar reached 100% before scan ran | `app.py` used `time.sleep()` fake steps instead of real callbacks | Removed fake steps; added `progress_callback` parameter to `run_vuln_scan()`; callback called before each test module |
| Attack graph nodes had no labels until hover | `ForceGraph2D` default: labels only on hover | Added `nodeCanvasObject` prop to draw persistent labels using Canvas 2D API |
| Attack graph zoomed out too far | No auto-fit configured | Added `onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}` |


---

## 5. Every Module — Full Code

### 5.1 `backend/scanner/recon.py`

**Purpose:** Passive and active reconnaissance. Runs `subfinder` for subdomain enumeration and `python-nmap` for TCP port scanning.

```python
import subprocess
import nmap
import json

def subdomain_enum(domain):
    try:
        result = subprocess.run(
            ["subfinder", "-d", domain, "-silent"],
            capture_output=True, text=True, timeout=30
        )
        subdomains = [s for s in result.stdout.strip().split("\n") if s]
        return subdomains
    except Exception as e:
        return [f"Error: {str(e)}"]

def port_scan(target):
    try:
        nm = nmap.PortScanner()
        nm.scan(target, arguments="-sT -T4 --top-ports 100")
        results = []
        for host in nm.all_hosts():
            for proto in nm[host].all_protocols():
                for port in nm[host][proto].keys():
                    results.append({
                        "port": port,
                        "state": nm[host][proto][port]["state"],
                        "service": nm[host][proto][port]["name"],
                        "version": nm[host][proto][port]["version"]
                    })
        return results
    except Exception as e:
        return [{"error": str(e)}]

def run_recon(domain):
    print(f"[*] Starting recon on {domain}...")
    subdomains = subdomain_enum(domain)
    print(f"[+] Subdomains found: {len(subdomains)}")
    ports = port_scan(domain)
    print(f"[+] Open ports found: {len(ports)}")
    return {
        "target": domain,
        "subdomains": subdomains,
        "ports": ports
    }

if __name__ == "__main__":
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else "scanme.nmap.org"
    result = run_recon(target)
    print(json.dumps(result, indent=2))
```

**Function Reference:**

| Function | Description |
|----------|-------------|
| `subdomain_enum(domain)` | Runs `subfinder -d <domain> -silent` via subprocess. Returns list of subdomain strings. On error returns list with error message. Timeout: 30s. |
| `port_scan(target)` | Uses `python-nmap` to run `-sT -T4 --top-ports 100` TCP connect scan. Returns list of dicts with `port`, `state`, `service`, `version`. |
| `run_recon(domain)` | Orchestrator. Calls both functions and returns `{"target", "subdomains", "ports"}`. |

---

### 5.2 `backend/scanner/crawler.py`

**Purpose:** Async BFS crawler. Discovers parameterized endpoints on the target by parsing HTML. Uses `aiohttp` so it never blocks the event loop. Finds form actions+inputs and anchor links with query strings across up to `max_depth=2` levels and `max_pages=20` pages.

**Key design change from v1.0:** The original used the synchronous `requests` library and only scraped the base URL. v1.1 is a full BFS crawler using `aiohttp.ClientSession`, running entirely within the same event loop as the vulnerability tests.

```python
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, parse_qs

async def scrape_page(session, url):
    """Async: scrapes a single page for forms and parameterised links."""
    endpoints, links = [], []
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as r:
            text = await r.text(errors="replace")
        soup = BeautifulSoup(text, "html.parser")
        # Forms
        for form in soup.find_all("form"):
            action = form.get("action")
            method = form.get("method", "get").lower()
            target_url = urljoin(url, action) if action else url
            params = [i.get("name") for i in form.find_all(["input","textarea","select"]) if i.get("name")]
            if params:
                endpoints.append({"url": target_url, "method": method, "params": params})
        # Links with query params (same domain only)
        base_netloc = urlparse(url).netloc
        for a in soup.find_all("a", href=True):
            full_url = urljoin(url, a.get("href"))
            parsed = urlparse(full_url)
            if parsed.netloc == base_netloc:
                clean_url = full_url.split("#")[0]
                links.append(clean_url)
                if parsed.query:
                    params = list(parse_qs(parsed.query).keys())
                    if params:
                        endpoints.append({"url": clean_url.split("?")[0], "method": "get", "params": params})
    except Exception as e:
        print(f"[-] Crawler error on {url}: {e}")
    return endpoints, list(set(links))

async def async_crawl(base_url, max_depth=2, max_pages=20):
    """Async BFS — uses aiohttp so it never blocks the event loop."""
    discovered, visited, queue = [], set(), [(base_url, 0)]
    connector = aiohttp.TCPConnector(ssl=False, limit=10)
    async with aiohttp.ClientSession(connector=connector) as session:
        while queue and len(visited) < max_pages:
            current_url, depth = queue.pop(0)
            if current_url in visited or depth > max_depth:
                continue
            visited.add(current_url)
            endpoints, new_links = await scrape_page(session, current_url)
            discovered.extend(endpoints)
            if depth < max_depth:
                queue.extend((l, depth+1) for l in new_links if l not in visited)
    # Deduplicate
    unique, seen_sigs = [], set()
    for d in discovered:
        sig = f"{d['method']}:{d['url']}:{','.join(sorted(d['params']))}"
        if sig not in seen_sigs:
            seen_sigs.add(sig)
            unique.append(d)
    return unique

def crawl(base_url, max_depth=2, max_pages=20):
    """Synchronous wrapper kept for backward-compat with standalone scripts."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(async_crawl(base_url, max_depth, max_pages))
    finally:
        loop.close()
```

**Function Reference:**

| Function | Description |
|----------|-------------|
| `scrape_page(session, url)` | Async. Fetches a page with `aiohttp`, parses with BeautifulSoup. Extracts all `<form>` endpoints and same-domain `<a href>` links with query params. |
| `async_crawl(base_url)` | Async BFS. Visits up to `max_pages=20` pages at `max_depth=2`. Deduplicates endpoints by `method:url:params` signature. |
| `crawl(base_url)` | Synchronous wrapper — creates a new event loop. Used by standalone scripts and legacy callers. |

---

### 5.3 `backend/scanner/vuln_scan.py`

**Purpose:** Main vulnerability testing engine. 322 lines. Tests 8 vulnerability classes using payload injection, error detection, and header inspection. Integrates the crawler to discover real endpoints first.

```python
import requests
import json
from urllib.parse import urlparse, parse_qs
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from crawler import crawl

CVE_MAP = {
    "SQL Injection": {
        "cve": "CVE-2023-23397",
        "cwe": "CWE-89",
        "owasp": "A03:2021 — Injection"
    },
    "Cross-Site Scripting (XSS)": {
        "cve": "CVE-2023-32563",
        "cwe": "CWE-79",
        "owasp": "A03:2021 — Injection"
    },
    "Open Redirect": {
        "cve": "CVE-2023-36845",
        "cwe": "CWE-601",
        "owasp": "A01:2021 — Broken Access Control"
    },
    "Directory Traversal (LFI)": {
        "cve": "CVE-2023-44487",
        "cwe": "CWE-22",
        "owasp": "A01:2021 — Broken Access Control"
    },
    "Missing CSRF Protection": {
        "cve": "CVE-2023-29007",
        "cwe": "CWE-352",
        "owasp": "A01:2021 — Broken Access Control"
    },
    "Missing Security Header": {
        "cve": "N/A",
        "cwe": "CWE-693",
        "owasp": "A05:2021 — Security Misconfiguration"
    },
    "Server-Side Request Forgery (SSRF)": {
        "cve": "CVE-2023-42282",
        "cwe": "CWE-918",
        "owasp": "A10:2021 — Server-Side Request Forgery (SSRF)"
    },
    "OS Command Injection": {
        "cve": "CVE-2023-31123",
        "cwe": "CWE-78",
        "owasp": "A03:2021 — Injection"
    }
}

SQLI_PAYLOADS = [
    "'", '"', "' OR '1'='1", "' OR 1=1--",
    "\" OR \"1\"=\"1", "'; DROP TABLE users--",
    "' AND SLEEP(3)--", "1' ORDER BY 1--"
]

XSS_PAYLOADS = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "'><script>alert(1)</script>",
    "<svg onload=alert(1)>",
]

SQLI_ERRORS = [
    "sql syntax", "mysql_fetch", "ora-01756", "sqlite3",
    "pg_query", "syntax error", "unclosed quotation",
    "quoted string not properly terminated", "mysql_num_rows"
]

def test_sqli(url, endpoints):
    vulns = []
    if not endpoints:
        endpoints = [{"url": url, "method": "get", "params": parse_qs(urlparse(url).query).keys() or ["id"]}]
    for ep in endpoints:
        ep_url = ep["url"]
        method = ep.get("method", "get")
        for param in ep["params"]:
            for payload in SQLI_PAYLOADS:
                try:
                    r = requests.get(ep_url, params={param: payload}, timeout=10)
                    for err in SQLI_ERRORS:
                        if err.lower() in r.text.lower():
                            vulns.append({
                                "type": "SQL Injection",
                                "url": ep_url, "method": method,
                                "param": param, "payload": payload,
                                "evidence": err, "severity": "CRITICAL", "cvss": 9.8,
                                "description": f"SQLi detected in parameter '{param}' at {ep_url}",
                                "remediation": "Use prepared statements and parameterized queries."
                            })
                            break
                except: continue
    return vulns

def test_xss(url, endpoints):
    vulns = []
    if not endpoints:
        endpoints = [{"url": url, "method": "get", "params": parse_qs(urlparse(url).query).keys() or ["q"]}]
    for ep in endpoints:
        ep_url = ep["url"]
        method = ep.get("method", "get")
        for param in ep["params"]:
            for payload in XSS_PAYLOADS:
                try:
                    r = requests.get(ep_url, params={param: payload}, timeout=10)
                    if payload in r.text:
                        vulns.append({
                            "type": "Cross-Site Scripting (XSS)",
                            "url": ep_url, "method": method,
                            "param": param, "payload": payload,
                            "severity": "HIGH", "cvss": 7.2,
                            "description": f"Reflected XSS in parameter '{param}' at {ep_url}",
                            "remediation": "Encode output and implement CSP headers."
                        })
                        break
                except: continue
    return vulns

def test_open_redirect(url, endpoints):
    vulns = []
    if not endpoints:
        endpoints = [{"url": url, "method": "get", "params": parse_qs(urlparse(url).query).keys() or ["redirect"]}]
    payloads = ["https://evil.com", "//evil.com", "/\\evil.com"]
    params_filter = ["redirect", "url", "next", "return", "goto", "dest"]
    for ep in endpoints:
        ep_url = ep["url"]
        method = ep.get("method", "get")
        for param in ep["params"]:
            if param.lower() not in params_filter and param not in endpoints[0]["params"]:
                continue
            for payload in payloads:
                try:
                    r = requests.get(ep_url, params={param: payload}, timeout=10, allow_redirects=False)
                    if r.status_code in [301, 302, 303, 307, 308]:
                        loc = r.headers.get("Location", "")
                        if "evil.com" in loc:
                            vulns.append({
                                "type": "Open Redirect",
                                "url": ep_url, "method": method,
                                "param": param, "payload": payload,
                                "severity": "MEDIUM", "cvss": 6.1,
                                "description": f"Open redirect via '{param}' parameter at {ep_url}",
                                "remediation": "Validate and whitelist redirect URLs."
                            })
                except: continue
    return vulns

def test_directory_traversal(url, endpoints):
    vulns = []
    if not endpoints:
        endpoints = [{"url": url, "method": "get", "params": parse_qs(urlparse(url).query).keys() or ["file"]}]
    payloads = [
        "../../../../etc/passwd",
        "..%2F..%2F..%2Fetc%2Fpasswd",
        "....//....//etc/passwd",
    ]
    for ep in endpoints:
        ep_url = ep["url"]
        method = ep.get("method", "get")
        for param in ep["params"]:
            for payload in payloads:
                try:
                    r = requests.get(ep_url, params={param: payload}, timeout=10)
                    if "root:x:0:0" in r.text or "daemon:" in r.text:
                        vulns.append({
                            "type": "Directory Traversal (LFI)",
                            "url": ep_url, "method": method,
                            "param": param, "payload": payload,
                            "severity": "CRITICAL", "cvss": 9.1,
                            "description": f"LFI detected via '{param}' at {ep_url}",
                            "remediation": "Sanitize file path inputs. Use allowlists."
                        })
                except: continue
    return vulns

def test_ssrf(url, endpoints):
    vulns = []
    if not endpoints:
        endpoints = [{"url": url, "method": "get", "params": parse_qs(urlparse(url).query).keys() or ["url"]}]
    payloads = ["http://169.254.169.254/latest/meta-data/", "http://127.0.0.1", "http://localhost"]
    for ep in endpoints:
        ep_url = ep["url"]
        method = ep.get("method", "get")
        for param in ep["params"]:
            for payload in payloads:
                try:
                    r = requests.get(ep_url, params={param: payload}, timeout=5)
                    if r.status_code == 200 and ("ami-id" in r.text or "root:x:" in r.text or "localhost" in r.text or "loopback" in r.text):
                        vulns.append({
                            "type": "Server-Side Request Forgery (SSRF)",
                            "url": ep_url, "method": method,
                            "param": param, "payload": payload,
                            "severity": "HIGH", "cvss": 8.6,
                            "description": f"SSRF detected via '{param}' parameter at {ep_url}",
                            "remediation": "Whitelist allowed domains and block private IP ranges."
                        })
                except: continue
    return vulns

def test_command_injection(url, endpoints):
    vulns = []
    if not endpoints:
        endpoints = [{"url": url, "method": "get", "params": parse_qs(urlparse(url).query).keys() or ["cmd"]}]
    payloads = ["; cat /etc/passwd", "| cat /etc/passwd", "`cat /etc/passwd`"]
    for ep in endpoints:
        ep_url = ep["url"]
        method = ep.get("method", "get")
        for param in ep["params"]:
            for payload in payloads:
                try:
                    r = requests.get(ep_url, params={param: payload}, timeout=10)
                    if "root:x:0:0" in r.text:
                        vulns.append({
                            "type": "OS Command Injection",
                            "url": ep_url, "method": method,
                            "param": param, "payload": payload,
                            "severity": "CRITICAL", "cvss": 9.8,
                            "description": f"Command Injection detected via '{param}' parameter at {ep_url}",
                            "remediation": "Avoid passing user input to system shells. Use safe APIs."
                        })
                except: continue
    return vulns

def test_csrf(url):
    issues = []
    try:
        r = requests.get(url, timeout=10)
        content = r.text.lower()
        has_form = "<form" in content
        has_csrf = any(t in content for t in ["csrf", "_token", "authenticity_token"])
        if has_form and not has_csrf:
            issues.append({
                "type": "Missing CSRF Protection",
                "url": url, "method": "post",
                "severity": "HIGH", "cvss": 8.0,
                "description": "Forms detected without CSRF tokens",
                "remediation": "Implement CSRF tokens on all state-changing forms."
            })
    except: pass
    return issues

def test_headers(url):
    issues = []
    try:
        r = requests.get(url, timeout=10)
        headers = r.headers
        checks = {
            "X-Frame-Options":        ("MEDIUM", 5.3, "Clickjacking protection missing", "Add: X-Frame-Options: DENY"),
            "X-Content-Type-Options": ("MEDIUM", 5.3, "MIME sniffing attack possible", "Add: X-Content-Type-Options: nosniff"),
            "Content-Security-Policy":("MEDIUM", 6.1, "No CSP — XSS risk increased", "Define a strict Content-Security-Policy."),
            "Strict-Transport-Security":("MEDIUM", 5.3, "HSTS not enforced", "Add: Strict-Transport-Security: max-age=31536000"),
            "X-XSS-Protection":       ("LOW",    4.3, "Browser XSS filter disabled", "Add: X-XSS-Protection: 1; mode=block"),
            "Referrer-Policy":        ("LOW",    3.1, "Referrer info may leak sensitive data", "Add: Referrer-Policy: no-referrer"),
        }
        for header, (sev, cvss, desc, fix) in checks.items():
            if header not in headers:
                issues.append({
                    "type": "Missing Security Header",
                    "url": url, "method": "get",
                    "header": header, "severity": sev,
                    "cvss": cvss, "description": desc, "remediation": fix
                })
    except Exception as e:
        issues.append({"error": str(e)})
    return issues

def run_vuln_scan(url, progress_callback=None):
    print(f"[*] Starting vulnerability scan on {url}...")
    results = {"target": url, "vulnerabilities": [], "missing_headers": []}

    if progress_callback: progress_callback(2, "Crawling for endpoints...")
    print("[*] Crawling endpoints...")
    endpoints = crawl(url)
    results["endpoints"] = endpoints

    if progress_callback: progress_callback(3, "Testing SQL Injection...")
    print("[*] Testing SQL Injection...")
    results["vulnerabilities"] += test_sqli(url, endpoints)

    if progress_callback: progress_callback(4, "Testing XSS...")
    print("[*] Testing XSS...")
    results["vulnerabilities"] += test_xss(url, endpoints)

    if progress_callback: progress_callback(5, "Testing SSRF...")
    print("[*] Testing SSRF...")
    results["vulnerabilities"] += test_ssrf(url, endpoints)

    if progress_callback: progress_callback(6, "Testing Command Injection...")
    print("[*] Testing Command Injection...")
    results["vulnerabilities"] += test_command_injection(url, endpoints)

    if progress_callback: progress_callback(7, "Checking Open Redirects...")
    print("[*] Testing Open Redirect...")
    results["vulnerabilities"] += test_open_redirect(url, endpoints)

    if progress_callback: progress_callback(8, "Testing Directory Traversal...")
    print("[*] Testing Directory Traversal...")
    results["vulnerabilities"] += test_directory_traversal(url, endpoints)

    if progress_callback: progress_callback(9, "Testing CSRF...")
    print("[*] Testing CSRF...")
    results["vulnerabilities"] += test_csrf(url)

    if progress_callback: progress_callback(10, "Auditing Security Headers...")
    print("[*] Checking Security Headers...")
    results["missing_headers"] = test_headers(url)

    total = len(results["vulnerabilities"]) + len(results["missing_headers"])
    for v in results["vulnerabilities"] + results["missing_headers"]:
        vtype = v.get("type", "")
        for key, cve_data in CVE_MAP.items():
            if key in vtype:
                v.update(cve_data)
                break

    print(f"[+] Scan complete — {total} issues found")
    return results

if __name__ == "__main__":
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
    result = run_vuln_scan(target)
    print(json.dumps(result, indent=2))
```

**Function Reference:**

**v1.1 architecture change:** All 8 test functions are launched simultaneously using `asyncio.gather()` inside `async_run_vuln_scan()`. Payloads within each test are also gathered in parallel. This replaces the old sequential loop approach.

**CVE references:** v1.0 used a `CVE_MAP` dict with fabricated CVE numbers (e.g. `CVE-2023-23397` is an Outlook vuln, not SQLi). v1.1 replaces this with `VULN_META` containing accurate CWE IDs and OWASP Top 10 2021 categories only — CVE numbers are software-version-specific and not reported for generic class-level findings.

| Function | Severity | CVSS | CWE | Detection Method |
|----------|----------|------|-----|------------------|
| `test_sqli()` | CRITICAL | 9.8 | CWE-89 | Gathers all payload×param combos; checks responses for 9 DB error strings |
| `test_xss()` | HIGH | 7.2 | CWE-79 | Gathers all payload×param combos; checks if payload reflected verbatim |
| `test_open_redirect()` | MEDIUM | 6.1 | CWE-601 | Redirect params only; checks `Location` header for `evil.com` |
| `test_directory_traversal()` | CRITICAL | 9.1 | CWE-22 | LFI payloads gathered; checks for `/etc/passwd` content |
| `test_ssrf()` | HIGH | 8.6 | CWE-918 | Internal IP payloads gathered; checks for AWS metadata / localhost indicators |
| `test_command_injection()` | CRITICAL | 9.8 | CWE-78 | Shell payloads gathered; checks for `root:x:0:0` in response |
| `test_csrf()` | HIGH | 8.0 | CWE-352 | Checks if page has `<form>` but no CSRF token keyword |
| `test_headers()` | MEDIUM/LOW | 3.1–6.1 | CWE-693 | Checks for 7 missing HTTP security headers (added `Permissions-Policy`) |
| `run_vuln_scan()` | — | — | — | Sync entry point. Runs async pipeline: crawler → all tests via `asyncio.gather()` → enriches results with `VULN_META` |


---

### 5.4 `backend/app.py`

**Purpose:** Flask REST API. ~240 lines (v1.1). Defines the database model, all API routes, thread-safe SQLite configuration, non-blocking async `check_scope()`, input validation, optional API key auth, rate limiting, and background scan threading with memory-leak prevention.

```python
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
```

---

## 6. All API Endpoints

| Method | Route | Input (JSON body) | Output | Description |
|--------|-------|-------------------|--------|-------------|
| `GET` | `/` | — | `{"message": "PentaScope API", "version": "1.1"}` | Health check |
| `POST` | `/api/recon` | `{"target": "domain.com", "force": false}` | `{"target", "subdomains": [], "ports": []}` | Run recon (subfinder + nmap), save to DB. `force=true` bypasses scope check. |
| `POST` | `/api/scan` | `{"target": "http://..."}` | `{"target", "vulnerabilities": [], "missing_headers": [], "endpoints": []}` | Synchronous full vuln scan, save to DB |
| `GET` | `/api/history` | `?page=1&limit=20` | `{"page", "limit", "total", "results": [{"id", "target", "scan_type", "critical", "high", "medium", "low", "created_at"}]}` | Paginated scan history from DB (max 100 per page) |
| `GET` | `/api/history/<scan_id>` | — | Full findings JSON for that scan | Get detailed findings for a past scan |
| `POST` | `/api/report` | `{"target", "recon": {}, "vulns": {}}` | PDF file (blob, `application/pdf`) | Generate and stream PDF report |
| `POST` | `/api/export/json` | Any JSON object | Same JSON echoed back | JSON export passthrough |
| `POST` | `/api/export/csv` | `{"vulnerabilities": [], "missing_headers": []}` | CSV text (`text/csv`) with columns: Type, Severity, CVSS, CWE, OWASP, Description, Remediation | Export findings as CSV |
| `POST` | `/api/scan/progress` | `{"target": "http://...", "force": false}` | `{"scan_id": "uuid4-str"}` | Start async background scan, returns UUID scan_id |
| `GET` | `/api/scan/status/<scan_id>` | — | `{"step", "total", "message", "done", "result"}` | Poll progress of background scan |

---

## 7. Database Schema

**Database engine:** SQLite (file: `instance/pentascope.db`)
**ORM:** Flask-SQLAlchemy

### Table: `scan_result`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | INTEGER | PRIMARY KEY, auto-increment | Unique scan identifier |
| `target` | VARCHAR(255) | — | The scanned URL or domain |
| `scan_type` | VARCHAR(50) | — | `"recon"` or `"vuln"` |
| `findings` | TEXT | — | Full JSON blob of all scan results |
| `critical` | INTEGER | default=0 | Count of CRITICAL severity findings |
| `high` | INTEGER | default=0 | Count of HIGH severity findings |
| `medium` | INTEGER | default=0 | Count of MEDIUM severity findings |
| `low` | INTEGER | default=0 | Count of LOW severity findings |
| `created_at` | DATETIME | default=`datetime.now(timezone.utc)`, indexed | UTC timestamp of scan creation |

---

## 8. All Features Built

### Feature 1: Reconnaissance Module
- **What it does:** Discovers subdomains via `subfinder` and open ports via Nmap (`-sT -T4 --top-ports 100`).
- **Files:** `backend/scanner/recon.py`, `backend/app.py` (`/api/recon`), `frontend/src/App.js` (`runRecon()`, recon results table)
- **How implemented:** Python subprocess for subfinder; python-nmap library for port scan. Results saved to DB and returned as JSON.
- **Issues:** None major. subfinder must be installed system-wide on Kali.

### Feature 2: Web Crawler
- **What it does:** Automatically discovers parameterized endpoints (forms and query-string links) across multiple pages of the target before vulnerability testing.
- **Files:** `backend/scanner/crawler.py`, imported by `vuln_scan.py`
- **How implemented (v1.1):** Fully async `aiohttp` BFS crawler. `async_crawl()` visits up to 20 pages at depth 2 using `aiohttp.ClientSession`. `scrape_page()` parses `<form>` and `<a href>` elements asynchronously. Never blocks the event loop. Deduplicates by signature.
- **v1.0 limitation fixed:** Old version used synchronous `requests.get()` and only scraped the base URL (depth 0).

### Feature 3: Vulnerability Scanner (8 modules)
- **What it does:** Tests for SQLi, XSS, Open Redirect, LFI, SSRF, Command Injection, CSRF, and missing security headers (7 headers).
- **Files:** `backend/scanner/vuln_scan.py`
- **How implemented (v1.1):** All 8 test suites and all payloads within each suite run simultaneously via `asyncio.gather()` in a single aiohttp session. Results are merged and enriched with CWE/OWASP metadata from `VULN_META`.
- **v1.0 limitation fixed:** Old version ran tests sequentially with synchronous `requests`. Large sites could take minutes; now runs in seconds.

### Feature 4: Real-time Progress Bar
- **What it does:** Shows live scan progress (step X of 10) with status messages in the React UI.
- **Files:** `backend/app.py` (`scan_with_progress`, `scan_status`), `frontend/src/components/ProgressBar.jsx`
- **How implemented:** Backend starts scan in a `threading.Thread`. Frontend polls `/api/scan/status/<scan_id>` every 600ms. `vuln_scan.py` accepts `progress_callback` and calls it at key stages.
- **v1.1 improvements:** Scan ID is now a UUID4 (prevents timestamp collisions). Memory auto-cleaned after 5 min via `schedule_cleanup`. Thread safety via `scan_lock` mutex.

### Feature 5: Interactive Attack Graph (Topology Map)
- **What it does:** Renders an interactive 2D force-directed node graph showing the target, discovered endpoints, parameters, and vulnerabilities as connected nodes.
- **Files:** `frontend/src/App.js` (`AttackGraph` component)
- **How implemented:** Uses `react-force-graph-2d`. Nodes: target (blue), endpoints (gray), params (dark), vulns (severity color). Links drawn with directional particles. Labels rendered permanently via `nodeCanvasObject` Canvas API. Auto-zooms via `onEngineStop`.
- **Issues fixed:** Labels were only showing on hover; fixed with `nodeCanvasObject`. Graph was zoomed too far out; fixed with `zoomToFit(400, 50)`.

### Feature 6: PoC Exploit Generator
- **What it does:** Generates a ready-to-run Python exploit script for any vulnerability with one click.
- **Files:** `frontend/src/components/VulnCard.jsx` (`generatePoC()` function)
- **How implemented:** Client-side JS function builds a Python script string using the vuln's `url`, `method`, `param`, and `payload`. Creates a Blob, generates an object URL, triggers browser download as `.py` file. Also calls `URL.revokeObjectURL()` to prevent memory leaks.

### Feature 7: PDF Report Generation
- **What it does:** Generates a multi-page, corporate-grade PDF report with cover page, executive summary, severity tables, per-finding cards, and strategic recommendations.
- **Files:** `reports/generator.py`, `backend/app.py` (`/api/report`), `frontend/src/App.js` (download button)
- **How implemented:** ReportLab `SimpleDocTemplate`. Custom `draw_cover()` callback for dark navy cover page. `draw_header_footer()` for running headers/footers. Per-vulnerability `KeepTogether` tables. Streamed to frontend as blob via `send_file(as_attachment=True)`.
- **Bugs fixed:** (1) Backend returned path string instead of file → added `send_file`. (2) Relative path resolution failure → fixed with `os.path.abspath`. (3) Blank pages between sections → removed `PageBreak()` calls, use `Spacer()` instead.

### Feature 8: CSV / JSON Export
- **What it does:** Exports all vulnerability findings as a downloadable CSV or JSON file.
- **Files:** `backend/app.py` (`/api/export/csv`, `/api/export/json`)
- **v1.1:** CSV now includes CWE and OWASP columns (7 columns total vs 5 in v1.0). Frontend uses `URL.revokeObjectURL()` after download.

### Feature 9: Classic Luxury Futuristic UI
- **What it does:** Full application redesign: animated landing/splash page, Framer Motion scroll animations, glassmorphism cards, 3D Spline background in hero, feature sections, accordion FAQ, and dark premium color scheme.
- **Files:** `frontend/src/App.js`, `frontend/src/hooks/useScan.js`, `frontend/src/components/`
- **v1.1 refactor:** `App.js` reduced from 590 to ~200 lines by extracting all scan logic into `useScan.js` custom hook and all UI primitives into dedicated component files (`VulnCard.jsx`, `AttackGraph.jsx`, `HistoryView.jsx`, `LandingPage.jsx`, `ProgressBar.jsx`, `UI.jsx`).

---

## 9. All Bugs & Fixes

| # | Error / Symptom | Root Cause | Fix Applied |
|---|----------------|------------|-------------|
| 1 | `ModuleNotFoundError: No module named 'bs4'` | `beautifulsoup4` not installed in `~/pentest-env` | `~/pentest-env/bin/pip install beautifulsoup4` |
| 2 | Progress bar reached 100% immediately, then scan ran | `app.py` ran fake `time.sleep()` steps before calling actual scan | Removed fake steps; added `progress_callback` parameter to `run_vuln_scan()`; each test module calls `callback(step, message)` before executing |
| 3 | Progress bar frozen on "Scanning..." when backend crashed | Frontend `catch` block didn't update progress state | Added: `setProgress(p => ({ ...p, message: "Error: Connection to scanning engine lost", step: 0 }))` |
| 4 | PDF download button did nothing / opened blank tab | Backend returned JSON path string; frontend called `axios.post()` without `responseType: "blob"` | Backend: `return send_file(abs_path, as_attachment=True, ...)`; Frontend: `axios.post(..., { responseType: "blob" })` + `URL.createObjectURL()` |
| 5 | `FileNotFoundError` when Flask tried to send PDF | `generate_report()` returns relative path `"reports/pentest_report.pdf"`; Flask resolves it relative to CWD, not `app.py` | `abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", rel_path))` |
| 6 | PDF had large empty pages between sections | `PageBreak()` calls were inserted before each section (Recon, Findings, Recommendations) | Removed all `PageBreak()` calls in the middle of the story; replaced with `Spacer(1, 0.5*cm)` |
| 7 | Attack graph: node labels invisible until hover | `react-force-graph-2d` only shows labels on mouse hover by default | Added `nodeCanvasObject` prop that draws labels permanently using Canvas 2D `fillText()` with rounded-rect background |
| 8 | Attack graph: too zoomed out, nodes near edges | No auto-fit after simulation | Added `onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}` |
| 9 | Open Redirect test skipping all params | Logic bug: condition `param not in endpoints[0]["params"]` was always skipping non-redirect-named params from real crawler data | Condition kept but `params_filter` check is primary gate; params from the first endpoint in the list are also allowed through |

---

## 10. All Commands

### Setup Commands
```bash
# Create Python virtual environment
python3 -m venv ~/pentest-env
source ~/pentest-env/bin/activate

# Install ALL Python packages from requirements.txt
pip install -r backend/requirements.txt

# Install Node packages
cd ~/pentest-framework/frontend
npm install
```

### Daily Run Commands
```bash
# Terminal 1 — Backend
cd ~/pentest-framework
source ~/pentest-env/bin/activate
python3 backend/app.py

# Terminal 2 — Frontend
cd ~/pentest-framework/frontend
npm start

# Terminal 3 — DVWA test target (Docker)
sudo docker run -d -p 8080:80 vulnerables/web-dvwa
# or restart existing:
sudo docker start $(sudo docker ps -aq)
```

### Test/Validation Commands
```bash
# Syntax check all Python files
python3 -m py_compile backend/scanner/crawler.py backend/scanner/vuln_scan.py backend/app.py

# Test PDF generation manually
~/pentest-env/bin/python reports/generator.py

# Test API endpoint via curl
curl -X POST -H "Content-Type: application/json" \
  -d '{"target": "http://localhost:8080", "recon": {}, "vulns": {"vulnerabilities": []}}' \
  http://localhost:5000/api/report -v > /dev/null

# Test recon endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"target": "http://localhost:8080"}' \
  http://localhost:5000/api/recon
```

### Docker Commands
```bash
# Build and start the full PentaScope stack
docker compose up --build -d

# Stop the stack
docker compose down

# Rebuild only the backend after code changes
docker compose up --build -d backend

# View backend logs live
docker compose logs -f backend

# Pull and run DVWA test target separately
sudo docker run -d -p 8080:80 vulnerables/web-dvwa

# List running containers
sudo docker ps

# Stop all containers
sudo docker stop $(sudo docker ps -aq)
```

---

## 11. Dependencies

### Python (pip) — Backend

| Package | Version | Purpose |
|---------|---------|----------|
| `flask` | 3.1.3 | REST API web framework |
| `flask-cors` | 6.0.2 | CORS headers so React frontend can call backend |
| `flask-sqlalchemy` | 3.1.1 | SQLAlchemy ORM integration for Flask |
| `flask-limiter` | 3.5.0 | Rate limiting — 60 req/min per IP, graceful fallback |
| `aiohttp` | 3.11.11 | Async HTTP client for crawler and all vuln test suites |
| `requests` | 2.33.1 | Sync HTTP client (fallback usage) |
| `beautifulsoup4` | 4.14.3 | HTML parsing in async crawler module |
| `reportlab` | 4.5.0 | PDF generation (cover page, tables, paragraphs) |
| `python-nmap` | 0.7.1 | Python binding for Nmap port scanner |
| `SQLAlchemy` | 2.0.49 | ORM core (SQLAlchemy 2.x style queries used) |
| `sqlite3` | stdlib | Built into Python — no separate install needed |

### NPM — Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.5 | UI framework |
| `react-dom` | ^19.2.5 | DOM rendering |
| `axios` | ^1.16.0 | HTTP client (supports blob responseType for PDF download) |
| `react-force-graph-2d` | ^1.29.1 | WebGL 2D force-directed graph for attack surface map |
| `framer-motion` | ^12.38.0 | Declarative animations (fade, slide, stagger, exit) |
| `@splinetool/react-spline` | ^4.1.0 | React component wrapping Spline 3D scenes |
| `@splinetool/runtime` | ^1.12.91 | Spline 3D runtime engine |
| `lucide-react` | ^1.14.0 | Icon components (Shield, Target, Activity, etc.) |
| `react-scripts` | 5.0.1 | CRA build tool, dev server, bundler |
| `web-vitals` | ^2.1.4 | Performance metrics |
| `@testing-library/react` | ^16.3.2 | React testing utilities |
| `@testing-library/jest-dom` | ^6.9.1 | Custom Jest matchers |
| `@testing-library/user-event` | ^13.5.0 | User event simulation for tests |
| `@testing-library/dom` | ^10.4.1 | DOM testing utilities |

---

## 12. Presentation & Deliverables

### Project Context
- **Type:** Projet de Fin de Formation (PFF) — Cybersecurity Training Capstone
- **Audience:** Jury of cybersecurity instructors/evaluators
- **Goal:** Score 100% by demonstrating technical depth and professional presentation

### Demo Flow (Recommended)
1. Open `http://localhost:3000` — jury sees the **Landing Page** with animated 3D background and luxury UI
2. Click **"INITIALIZE PLATFORM"** — animated transition to dashboard
3. Enter DVWA URL: `http://localhost:8080`
4. Click **"Recon"** — show live port scan results in the table
5. Click **"Launch Attack"** — progress bar with 10 real steps
6. When complete: show **Assessment Dashboard** with Critical/High/Medium/Low counts and risk rating
7. Click **"🕸️ Topology Map"** — show attack graph (endpoints → params → vulns)
8. Click **"⚡ PoC Exploit"** on a Critical vuln — download Python exploit script, run it live
9. Click **"Download Executive PDF"** — show the professional Corporate Pro report
10. Export **CSV** to show data portability

### WOW Factors for Jury
| Feature | Why It Impresses |
|---------|-----------------|
| Attack Graph | Resembles professional tools like Maltego and BloodHound |
| PoC Generator | Shows real exploitability, not just theory |
| Progress Bar (real-time) | Shows technical awareness of async architecture |
| Corporate PDF | Looks like a real pentest report from a consulting firm |
| Landing Page | Shows frontend polish beyond what's expected for a training project |

---

## 13. Pending / Known Issues

| Issue | Status | Notes |
|-------|--------|-------|
| Crawler does not handle SPAs (React/Angular) | Known limitation | Would require Selenium/Playwright for JS rendering |
| WAFs will block payloads on real targets | By design | Educational tool; WAF evasion out of scope |
| `scan_progress` dict is in-memory only | Known | Lost on server restart; future: Redis or DB-backed |
| No authentication on API by default | Configurable | Set `PENTASCOPE_API_KEY` env var to enable X-API-Key auth |
| PDF recon section empty if recon not run before scan | Known | `/api/report` takes `recon` as optional param; defaults to `{}` |
| CSRF test only checks the base URL | Limitation | Does not crawl all form pages |
| Crawler only works on server-rendered HTML | Known | SPAs with client-side routing expose no links to the BFS crawler |

---

## 14. Legal & Ethical Framework

> **⚠️ IMPORTANT DISCLAIMER**

PentaScope is developed and maintained **strictly for educational purposes**. All scanning, exploitation, and report generation capabilities are intended to be used exclusively against:

1. Systems you **own**
2. Systems you have **explicit written authorization** to test

### What This Means in Practice
- **Always use DVWA** (Damn Vulnerable Web Application) or similar intentionally vulnerable apps for testing and demonstration
- **Never scan** production systems, third-party websites, or any system without written permission from the owner
- Unauthorized penetration testing is **illegal** in most jurisdictions (e.g., Computer Fraud and Abuse Act in the US; similar laws exist in Morocco, France, and EU countries)

### Ethical Use Checklist
- [ ] Written authorization obtained from asset owner
- [ ] Scope defined (which URLs, IP ranges are in-scope)
- [ ] Rules of engagement documented (no DoS, no data exfiltration)
- [ ] Findings reported confidentially to asset owner only
- [ ] All test data destroyed after engagement

### Standards Referenced
| Standard | Body | Application |
|----------|------|-------------|
| OWASP Top 10 (2021) | OWASP Foundation | Vulnerability classification |
| PTES | PTES Working Group | Reconnaissance methodology |
| CVSS v3.1 | FIRST.org | Severity scoring |
| CWE | MITRE | Weakness enumeration |

---

*Documentation updated: 2026-05-08. Project: PentaScope v1.1 Enterprise. Author: Nizar Oualidi.*

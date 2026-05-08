import asyncio
import aiohttp
import json
from urllib.parse import urlparse, parse_qs
from typing import Callable, Optional

try:
    from .crawler import async_crawl   # package import
except ImportError:
    from crawler import async_crawl    # direct execution fallback

# ── Remediation advice ───────────────────────────────────────────────────────
REMEDIATIONS = {
    "SQLi":             "Use prepared statements and parameterized queries. Never concatenate user input into SQL.",
    "XSS":              "Encode all output contextually and implement a strict Content-Security-Policy (CSP).",
    "OpenRedirect":     "Validate and whitelist redirect URLs. Reject or encode destination parameters that leave the origin.",
    "LFI":              "Sanitize file path inputs. Use allowlists for permitted file names; never expose raw user input to filesystem calls.",
    "SSRF":             "Whitelist allowed external domains; block private/loopback IP ranges at the network layer.",
    "CommandInjection": "Avoid passing user input to system shells. Use language-native APIs with argument arrays instead of shell strings.",
    "CSRF":             "Implement SameSite=Strict cookies and synchronizer CSRF tokens on all state-changing endpoints.",
}

# ── Accurate CWE / OWASP references (no fabricated CVEs) ─────────────────────
# CVE numbers are only meaningful when tied to a specific software version.
# For generic vulnerability classes we reference CWE and OWASP Top 10 2021.
VULN_META = {
    "SQL Injection": {
        "cve": "N/A (class-level finding)",
        "cwe": "CWE-89",
        "owasp": "A03:2021 — Injection",
    },
    "Cross-Site Scripting (XSS)": {
        "cve": "N/A (class-level finding)",
        "cwe": "CWE-79",
        "owasp": "A03:2021 — Injection",
    },
    "Open Redirect": {
        "cve": "N/A (class-level finding)",
        "cwe": "CWE-601",
        "owasp": "A01:2021 — Broken Access Control",
    },
    "Directory Traversal (LFI)": {
        "cve": "N/A (class-level finding)",
        "cwe": "CWE-22",
        "owasp": "A01:2021 — Broken Access Control",
    },
    "Missing CSRF Protection": {
        "cve": "N/A (class-level finding)",
        "cwe": "CWE-352",
        "owasp": "A01:2021 — Broken Access Control",
    },
    "Missing Security Header": {
        "cve": "N/A",
        "cwe": "CWE-693",
        "owasp": "A05:2021 — Security Misconfiguration",
    },
    "Server-Side Request Forgery (SSRF)": {
        "cve": "N/A (class-level finding)",
        "cwe": "CWE-918",
        "owasp": "A10:2021 — Server-Side Request Forgery (SSRF)",
    },
    "OS Command Injection": {
        "cve": "N/A (class-level finding)",
        "cwe": "CWE-78",
        "owasp": "A03:2021 — Injection",
    },
}

# ── Payload libraries ─────────────────────────────────────────────────────────
SQLI_PAYLOADS = [
    "'", '"',
    "' OR '1'='1", "' OR 1=1--",
    '" OR "1"="1',
    "'; DROP TABLE users--",
    "' AND SLEEP(3)--",
    "1' ORDER BY 1--",
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
    "quoted string not properly terminated", "mysql_num_rows",
]


# ── Low-level fetch helper ────────────────────────────────────────────────────
async def fetch(
    session: aiohttp.ClientSession,
    url: str,
    params: dict | None = None,
    timeout: int = 10,
    allow_redirects: bool = True,
) -> tuple[int, dict, str]:
    try:
        async with session.get(
            url,
            params=params,
            timeout=aiohttp.ClientTimeout(total=timeout),
            allow_redirects=allow_redirects,
        ) as r:
            text = await r.text(errors="replace")
            return r.status, dict(r.headers), text
    except Exception:
        return 0, {}, ""


# ── Individual test coroutines ────────────────────────────────────────────────

async def test_sqli(session: aiohttp.ClientSession, url: str, endpoints: list) -> list:
    if not endpoints:
        endpoints = [{
            "url": url, "method": "get",
            "params": list(parse_qs(urlparse(url).query).keys()) or ["id"],
        }]

    # Build ALL coroutines, then gather them truly in parallel
    coro_meta: list[tuple] = []
    coros: list = []
    for ep in endpoints:
        for param in ep["params"]:
            for payload in SQLI_PAYLOADS:
                coro_meta.append((ep, param, payload))
                coros.append(fetch(session, ep["url"], params={param: payload}))

    responses = await asyncio.gather(*coros, return_exceptions=True)

    vulns: list = []
    seen: set = set()
    for (ep, param, payload), resp in zip(coro_meta, responses):
        if isinstance(resp, Exception):
            continue
        status, _, text = resp
        if status == 0:
            continue
        for err in SQLI_ERRORS:
            if err.lower() in text.lower():
                key = (ep["url"], param)
                if key not in seen:
                    seen.add(key)
                    vulns.append({
                        "type": "SQL Injection",
                        "url": ep["url"], "method": ep.get("method", "get"),
                        "param": param, "payload": payload, "evidence": err,
                        "severity": "CRITICAL", "cvss": 9.8,
                        "description": f"SQL Injection detected in parameter '{param}' at {ep['url']}",
                        "remediation": REMEDIATIONS["SQLi"],
                    })
                break
    return vulns


async def test_xss(session: aiohttp.ClientSession, url: str, endpoints: list) -> list:
    if not endpoints:
        endpoints = [{
            "url": url, "method": "get",
            "params": list(parse_qs(urlparse(url).query).keys()) or ["q"],
        }]

    coro_meta: list[tuple] = []
    coros: list = []
    for ep in endpoints:
        for param in ep["params"]:
            for payload in XSS_PAYLOADS:
                coro_meta.append((ep, param, payload))
                coros.append(fetch(session, ep["url"], params={param: payload}))

    responses = await asyncio.gather(*coros, return_exceptions=True)

    vulns: list = []
    seen: set = set()
    for (ep, param, payload), resp in zip(coro_meta, responses):
        if isinstance(resp, Exception):
            continue
        status, _, text = resp
        if status == 0:
            continue
        if payload in text:
            key = (ep["url"], param)
            if key not in seen:
                seen.add(key)
                vulns.append({
                    "type": "Cross-Site Scripting (XSS)",
                    "url": ep["url"], "method": ep.get("method", "get"),
                    "param": param, "payload": payload,
                    "severity": "HIGH", "cvss": 7.2,
                    "description": f"Reflected XSS in parameter '{param}' at {ep['url']}",
                    "remediation": REMEDIATIONS["XSS"],
                })
    return vulns


async def test_open_redirect(session: aiohttp.ClientSession, url: str, endpoints: list) -> list:
    if not endpoints:
        endpoints = [{
            "url": url, "method": "get",
            "params": list(parse_qs(urlparse(url).query).keys()) or ["redirect"],
        }]

    REDIRECT_PARAMS = {"redirect", "url", "next", "return", "goto", "dest", "location", "link"}
    payloads = ["https://evil.com", "//evil.com", "/\\evil.com"]

    coro_meta: list[tuple] = []
    coros: list = []
    for ep in endpoints:
        for param in ep["params"]:
            if param.lower() not in REDIRECT_PARAMS:
                continue
            for payload in payloads:
                coro_meta.append((ep, param, payload))
                coros.append(fetch(session, ep["url"], params={param: payload}, allow_redirects=False))

    if not coros:
        return []

    responses = await asyncio.gather(*coros, return_exceptions=True)

    vulns: list = []
    seen: set = set()
    for (ep, param, payload), resp in zip(coro_meta, responses):
        if isinstance(resp, Exception):
            continue
        status, headers, _ = resp
        if status in {301, 302, 303, 307, 308}:
            loc = headers.get("Location", "")
            if "evil.com" in loc:
                key = (ep["url"], param)
                if key not in seen:
                    seen.add(key)
                    vulns.append({
                        "type": "Open Redirect",
                        "url": ep["url"], "method": ep.get("method", "get"),
                        "param": param, "payload": payload,
                        "severity": "MEDIUM", "cvss": 6.1,
                        "description": f"Open redirect via '{param}' parameter at {ep['url']}",
                        "remediation": REMEDIATIONS["OpenRedirect"],
                    })
    return vulns


async def test_directory_traversal(session: aiohttp.ClientSession, url: str, endpoints: list) -> list:
    if not endpoints:
        endpoints = [{
            "url": url, "method": "get",
            "params": list(parse_qs(urlparse(url).query).keys()) or ["file"],
        }]

    payloads = [
        "../../../../etc/passwd",
        "..%2F..%2F..%2Fetc%2Fpasswd",
        "....//....//etc/passwd",
    ]

    coro_meta: list[tuple] = []
    coros: list = []
    for ep in endpoints:
        for param in ep["params"]:
            for payload in payloads:
                coro_meta.append((ep, param, payload))
                coros.append(fetch(session, ep["url"], params={param: payload}))

    responses = await asyncio.gather(*coros, return_exceptions=True)

    vulns: list = []
    seen: set = set()
    for (ep, param, payload), resp in zip(coro_meta, responses):
        if isinstance(resp, Exception):
            continue
        status, _, text = resp
        if status == 0:
            continue
        if "root:x:0:0" in text or "daemon:" in text:
            key = (ep["url"], param)
            if key not in seen:
                seen.add(key)
                vulns.append({
                    "type": "Directory Traversal (LFI)",
                    "url": ep["url"], "method": ep.get("method", "get"),
                    "param": param, "payload": payload,
                    "severity": "CRITICAL", "cvss": 9.1,
                    "description": f"LFI detected via '{param}' parameter at {ep['url']}",
                    "remediation": REMEDIATIONS["LFI"],
                })
    return vulns


async def test_ssrf(session: aiohttp.ClientSession, url: str, endpoints: list) -> list:
    if not endpoints:
        endpoints = [{
            "url": url, "method": "get",
            "params": list(parse_qs(urlparse(url).query).keys()) or ["url"],
        }]

    payloads = [
        "http://169.254.169.254/latest/meta-data/",
        "http://127.0.0.1",
        "http://localhost",
    ]

    coro_meta: list[tuple] = []
    coros: list = []
    for ep in endpoints:
        for param in ep["params"]:
            for payload in payloads:
                coro_meta.append((ep, param, payload))
                coros.append(fetch(session, ep["url"], params={param: payload}, timeout=5))

    responses = await asyncio.gather(*coros, return_exceptions=True)

    vulns: list = []
    seen: set = set()
    for (ep, param, payload), resp in zip(coro_meta, responses):
        if isinstance(resp, Exception):
            continue
        status, _, text = resp
        if status == 200 and any(sig in text for sig in ["ami-id", "root:x:", "localhost", "loopback"]):
            key = (ep["url"], param)
            if key not in seen:
                seen.add(key)
                vulns.append({
                    "type": "Server-Side Request Forgery (SSRF)",
                    "url": ep["url"], "method": ep.get("method", "get"),
                    "param": param, "payload": payload,
                    "severity": "HIGH", "cvss": 8.6,
                    "description": f"SSRF detected via '{param}' parameter at {ep['url']}",
                    "remediation": REMEDIATIONS["SSRF"],
                })
    return vulns


async def test_command_injection(session: aiohttp.ClientSession, url: str, endpoints: list) -> list:
    if not endpoints:
        endpoints = [{
            "url": url, "method": "get",
            "params": list(parse_qs(urlparse(url).query).keys()) or ["cmd"],
        }]

    payloads = ["; cat /etc/passwd", "| cat /etc/passwd", "`cat /etc/passwd`"]

    coro_meta: list[tuple] = []
    coros: list = []
    for ep in endpoints:
        for param in ep["params"]:
            for payload in payloads:
                coro_meta.append((ep, param, payload))
                coros.append(fetch(session, ep["url"], params={param: payload}))

    responses = await asyncio.gather(*coros, return_exceptions=True)

    vulns: list = []
    seen: set = set()
    for (ep, param, payload), resp in zip(coro_meta, responses):
        if isinstance(resp, Exception):
            continue
        status, _, text = resp
        if status == 0:
            continue
        if "root:x:0:0" in text:
            key = (ep["url"], param)
            if key not in seen:
                seen.add(key)
                vulns.append({
                    "type": "OS Command Injection",
                    "url": ep["url"], "method": ep.get("method", "get"),
                    "param": param, "payload": payload,
                    "severity": "CRITICAL", "cvss": 9.8,
                    "description": f"OS Command Injection detected via '{param}' parameter at {ep['url']}",
                    "remediation": REMEDIATIONS["CommandInjection"],
                })
    return vulns


async def test_csrf(session: aiohttp.ClientSession, url: str) -> list:
    status, _, text = await fetch(session, url)
    if status == 0:
        return []
    content = text.lower()
    has_form = "<form" in content
    has_csrf = any(t in content for t in ["csrf", "_token", "authenticity_token"])
    if has_form and not has_csrf:
        return [{
            "type": "Missing CSRF Protection", "url": url, "method": "post",
            "severity": "HIGH", "cvss": 8.0,
            "description": "Forms detected without CSRF tokens.",
            "remediation": REMEDIATIONS["CSRF"],
        }]
    return []


async def test_headers(session: aiohttp.ClientSession, url: str) -> list:
    status, headers, _ = await fetch(session, url)
    if status == 0:
        return [{"error": "Connection failed"}]

    headers_lower = {k.lower(): v for k, v in headers.items()}
    checks = {
        "X-Frame-Options":          ("MEDIUM", 5.3, "Clickjacking protection missing.",        "Add: X-Frame-Options: DENY"),
        "X-Content-Type-Options":   ("MEDIUM", 5.3, "MIME-sniffing attack possible.",          "Add: X-Content-Type-Options: nosniff"),
        "Content-Security-Policy":  ("MEDIUM", 6.1, "No CSP — XSS risk significantly increased.", "Define a strict Content-Security-Policy."),
        "Strict-Transport-Security":("MEDIUM", 5.3, "HSTS not enforced — downgrade attacks possible.", "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains"),
        "X-XSS-Protection":         ("LOW",    4.3, "Legacy browser XSS filter not explicitly enabled.", "Add: X-XSS-Protection: 1; mode=block"),
        "Referrer-Policy":          ("LOW",    3.1, "Referrer information may leak sensitive URL data.", "Add: Referrer-Policy: no-referrer"),
        "Permissions-Policy":       ("LOW",    3.1, "Browser features not restricted via Permissions-Policy.", "Add: Permissions-Policy: geolocation=(), microphone=(), camera=()"),
    }
    issues: list = []
    for header, (sev, cvss, desc, fix) in checks.items():
        if header.lower() not in headers_lower:
            issues.append({
                "type": "Missing Security Header", "url": url, "method": "get",
                "header": header, "severity": sev, "cvss": cvss,
                "description": desc, "remediation": fix,
            })
    return issues


# ── Orchestrator ──────────────────────────────────────────────────────────────

async def async_run_vuln_scan(
    url: str,
    endpoints: list,
    progress_callback: Optional[Callable] = None,
) -> dict:
    results: dict = {"target": url, "vulnerabilities": [], "missing_headers": []}

    connector = aiohttp.TCPConnector(ssl=False, limit=20)
    async with aiohttp.ClientSession(connector=connector) as session:

        # Run all test suites truly in parallel via gather
        if progress_callback:
            progress_callback(3, "Launching parallel vulnerability tests...")

        (
            sqli_results,
            xss_results,
            ssrf_results,
            cmdi_results,
            redirect_results,
            lfi_results,
            csrf_results,
            header_results,
        ) = await asyncio.gather(
            test_sqli(session, url, endpoints),
            test_xss(session, url, endpoints),
            test_ssrf(session, url, endpoints),
            test_command_injection(session, url, endpoints),
            test_open_redirect(session, url, endpoints),
            test_directory_traversal(session, url, endpoints),
            test_csrf(session, url),
            test_headers(session, url),
        )

        if progress_callback:
            progress_callback(9, "Collating results...")

        results["vulnerabilities"] = (
            sqli_results + xss_results + ssrf_results
            + cmdi_results + redirect_results + lfi_results + csrf_results
        )
        results["missing_headers"] = header_results

    return results


def run_vuln_scan(url: str, progress_callback: Optional[Callable] = None) -> dict:
    """
    Synchronous entry point (called from Flask threads).
    The crawler and all tests run inside a single event loop so aiohttp
    connections are properly reused and nothing blocks OS threads.
    """
    print(f"[*] Starting vulnerability scan on {url}...")

    async def _pipeline():
        if progress_callback:
            progress_callback(2, "Crawling for endpoints...")
        print("[*] Crawling endpoints (async)...")
        endpoints = await async_crawl(url)

        if progress_callback:
            progress_callback(3, "Running parallel vulnerability tests...")
        return await async_run_vuln_scan(url, endpoints, progress_callback)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        results = loop.run_until_complete(_pipeline())
    finally:
        loop.close()

    # Attach endpoints to results for the AttackGraph
    results["endpoints"] = results.get("endpoints", [])

    # Enrich every finding with CWE / OWASP metadata
    for v in results["vulnerabilities"] + results["missing_headers"]:
        vtype = v.get("type", "")
        for key, meta in VULN_META.items():
            if key in vtype:
                v.setdefault("cve", meta["cve"])
                v.setdefault("cwe", meta["cwe"])
                v.setdefault("owasp", meta["owasp"])
                break

    total = len(results["vulnerabilities"]) + len(results["missing_headers"])
    print(f"[+] Scan complete — {total} issues found")
    return results


if __name__ == "__main__":
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
    result = run_vuln_scan(target)
    print(json.dumps(result, indent=2))
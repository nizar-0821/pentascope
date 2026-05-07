import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

def crawl(base_url):
    print(f"[*] Crawling {base_url} for endpoints and parameters...")
    discovered = []
    try:
        r = requests.get(base_url, timeout=10)
        soup = BeautifulSoup(r.text, 'html.parser')

        # Find all forms and their inputs
        for form in soup.find_all("form"):
            action = form.get("action")
            method = form.get("method", "get").lower()
            target_url = urljoin(base_url, action) if action else base_url
            
            params = []
            for input_tag in form.find_all(["input", "textarea", "select"]):
                name = input_tag.get("name")
                if name:
                    params.append(name)
            
            if params:
                discovered.append({
                    "url": target_url,
                    "method": method,
                    "params": params
                })

        # Find all links with query parameters
        for a in soup.find_all("a", href=True):
            href = a.get("href")
            full_url = urljoin(base_url, href)
            parsed = urlparse(full_url)
            if parsed.netloc == urlparse(base_url).netloc: # Stay on same domain
                if parsed.query:
                    from urllib.parse import parse_qs
                    params = list(parse_qs(parsed.query).keys())
                    if params:
                        clean_url = full_url.split('?')[0]
                        discovered.append({
                            "url": clean_url,
                            "method": "get",
                            "params": params
                        })

    except Exception as e:
        print(f"[-] Crawler error: {str(e)}")

    # Deduplicate
    unique_endpoints = []
    seen = set()
    for d in discovered:
        sig = f"{d['method']}:{d['url']}:{','.join(sorted(d['params']))}"
        if sig not in seen:
            seen.add(sig)
            unique_endpoints.append(d)

    print(f"[+] Crawler found {len(unique_endpoints)} parameterized endpoints")
    return unique_endpoints

if __name__ == "__main__":
    import sys
    import json
    target = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
    res = crawl(target)
    print(json.dumps(res, indent=2))

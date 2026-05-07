import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

def scrape_page(url):
    """Scrapes a single page for forms and parameterized links. Returns endpoints and new links."""
    endpoints = []
    links = []
    try:
        r = requests.get(url, timeout=10)
        soup = BeautifulSoup(r.text, 'html.parser')

        # Forms
        for form in soup.find_all("form"):
            action = form.get("action")
            method = form.get("method", "get").lower()
            target_url = urljoin(url, action) if action else url
            params = [i.get("name") for i in form.find_all(["input", "textarea", "select"]) if i.get("name")]
            if params:
                endpoints.append({"url": target_url, "method": method, "params": params})

        # Links
        for a in soup.find_all("a", href=True):
            href = a.get("href")
            full_url = urljoin(url, href)
            parsed = urlparse(full_url)
            
            if parsed.netloc == urlparse(url).netloc:
                clean_url = full_url.split('#')[0]
                links.append(clean_url)
                
                if parsed.query:
                    from urllib.parse import parse_qs
                    params = list(parse_qs(parsed.query).keys())
                    if params:
                        endpoints.append({"url": clean_url.split('?')[0], "method": "get", "params": params})
    except Exception as e:
        print(f"[-] Crawler error on {url}: {str(e)}")
    
    return endpoints, list(set(links))

def crawl(base_url, max_depth=2, max_pages=20):
    print(f"[*] Starting BFS crawl on {base_url} (max_depth={max_depth}, max_pages={max_pages})...")
    discovered = []
    visited = set()
    queue = [(base_url, 0)]

    while queue and len(visited) < max_pages:
        current_url, depth = queue.pop(0)
        
        if current_url in visited or depth > max_depth:
            continue
            
        visited.add(current_url)
        print(f"[*] Crawling: {current_url} (depth={depth})")
        
        endpoints, new_links = scrape_page(current_url)
        discovered.extend(endpoints)
        
        if depth < max_depth:
            for link in new_links:
                if link not in visited:
                    queue.append((link, depth + 1))

    # Deduplicate endpoints
    unique_endpoints = []
    seen_sigs = set()
    for d in discovered:
        sig = f"{d['method']}:{d['url']}:{','.join(sorted(d['params']))}"
        if sig not in seen_sigs:
            seen_sigs.add(sig)
            unique_endpoints.append(d)

    print(f"[+] Crawler visited {len(visited)} pages and found {len(unique_endpoints)} parameterized endpoints")
    return unique_endpoints

if __name__ == "__main__":
    import sys
    import json
    target = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
    res = crawl(target)
    print(json.dumps(res, indent=2))

import asyncio
import aiohttp
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, parse_qs


async def scrape_page(session: aiohttp.ClientSession, url: str):
    """Async version: scrapes a single page for forms and parameterised links."""
    endpoints = []
    links = []
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10), allow_redirects=True) as r:
            text = await r.text(errors="replace")
        soup = BeautifulSoup(text, "html.parser")

        # Forms
        for form in soup.find_all("form"):
            action = form.get("action")
            method = form.get("method", "get").lower()
            target_url = urljoin(url, action) if action else url
            params = [
                i.get("name")
                for i in form.find_all(["input", "textarea", "select"])
                if i.get("name")
            ]
            if params:
                endpoints.append({"url": target_url, "method": method, "params": params})

        # Links with query parameters
        base_netloc = urlparse(url).netloc
        for a in soup.find_all("a", href=True):
            href = a.get("href")
            full_url = urljoin(url, href)
            parsed = urlparse(full_url)
            if parsed.netloc == base_netloc:
                clean_url = full_url.split("#")[0]
                links.append(clean_url)
                if parsed.query:
                    params = list(parse_qs(parsed.query).keys())
                    if params:
                        endpoints.append({
                            "url": clean_url.split("?")[0],
                            "method": "get",
                            "params": params,
                        })
    except Exception as e:
        print(f"[-] Crawler error on {url}: {e}")
    return endpoints, list(set(links))


async def async_crawl(base_url: str, max_depth: int = 2, max_pages: int = 20) -> list:
    """Async BFS crawler — uses aiohttp so it never blocks the event loop."""
    print(f"[*] Starting async BFS crawl on {base_url} (max_depth={max_depth}, max_pages={max_pages})...")
    discovered: list = []
    visited: set = set()
    queue: list = [(base_url, 0)]

    connector = aiohttp.TCPConnector(ssl=False, limit=10)
    async with aiohttp.ClientSession(connector=connector) as session:
        while queue and len(visited) < max_pages:
            current_url, depth = queue.pop(0)
            if current_url in visited or depth > max_depth:
                continue
            visited.add(current_url)
            print(f"[*] Crawling: {current_url} (depth={depth})")

            endpoints, new_links = await scrape_page(session, current_url)
            discovered.extend(endpoints)

            if depth < max_depth:
                for link in new_links:
                    if link not in visited:
                        queue.append((link, depth + 1))

    # Deduplicate endpoints by (method, url, params)
    unique_endpoints: list = []
    seen_sigs: set = set()
    for d in discovered:
        sig = f"{d['method']}:{d['url']}:{','.join(sorted(d['params']))}"
        if sig not in seen_sigs:
            seen_sigs.add(sig)
            unique_endpoints.append(d)

    print(f"[+] Crawler visited {len(visited)} pages, found {len(unique_endpoints)} parameterised endpoints")
    return unique_endpoints


def crawl(base_url: str, max_depth: int = 2, max_pages: int = 20) -> list:
    """Synchronous wrapper kept for backwards compatibility (used by standalone scripts)."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(async_crawl(base_url, max_depth, max_pages))
    finally:
        loop.close()


if __name__ == "__main__":
    import sys
    import json
    target = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
    res = crawl(target)
    print(json.dumps(res, indent=2))

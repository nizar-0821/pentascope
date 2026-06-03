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
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, CvssBar } from './UI';
import { SEV } from '../utils';

export function VulnCard({ vuln, index }) {
  const [open, setOpen] = useState(false);
  const c = SEV[vuln.severity] || SEV.LOW;

  const generatePoC = (e) => {
    e.stopPropagation();
    let code = `#!/usr/bin/env python3\n# Auto-generated PoC Exploit by PentaScope\nimport requests\n\n`;
    code += `url = "${vuln.url || 'http://target.com'}"\n`;
    code += `method = "${(vuln.method || 'get').toUpperCase()}"\n\n`;

    if (vuln.param && vuln.payload) {
      if ((vuln.method || '').toLowerCase() === 'post') {
        code += `data = {"${vuln.param}": "${vuln.payload.replace(/"/g, '\\"')}"}\n`;
        code += `print(f"[*] Sending POST payload to {url}...")\nr = requests.post(url, data=data, allow_redirects=False)\n`;
      } else {
        code += `params = {"${vuln.param}": "${vuln.payload.replace(/"/g, '\\"')}"}\n`;
        code += `print(f"[*] Sending GET payload to {url}...")\nr = requests.get(url, params=params, allow_redirects=False)\n`;
      }
    } else {
      code += `print(f"[*] Sending {method} request to {url}...")\nr = requests.request(method, url, allow_redirects=False)\n`;
    }
    code += `print(f"[+] Status Code: {r.status_code}")\n`;
    code += `print("[+] Exploit sent successfully.")\n`;

    const blob = new Blob([code], { type: "text/x-python" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = u; a.download = `exploit_${vuln.type.replace(/[^a-zA-Z]/g, '')}.py`; a.click();
  };

  return (
    <div style={{ background: "rgba(255, 255, 255, 0.02)", border: `1px solid ${c.border}`, borderLeft: `3px solid ${c.color}`, borderRadius: 12, marginBottom: 12, transition: "all 0.2s ease" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: "#8b949e", fontSize: 13, fontFamily: "monospace" }}>#{String(index).padStart(2, "0")}</span>
          <span style={{ fontWeight: "500", color: "#f0f6fc", fontSize: 15 }}>{vuln.type}</span>
          {vuln.param && <code style={{ color: "#58a6ff", fontSize: 12, background: "rgba(88, 166, 255, 0.1)", padding: "2px 8px", borderRadius: 4 }}>{vuln.param}</code>}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {vuln.cve && vuln.cve !== "N/A" && <span style={{ color: "#8b949e", fontSize: 11, background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "2px 8px" }}>{vuln.cve}</span>}
          <button onClick={generatePoC} style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 6, padding: "4px 12px", color: "#e6edf3", fontSize: 11, cursor: "pointer", fontWeight: "500", transition: "background 0.2s" }}>PoC Exploit</button>
          <Badge s={vuln.severity} />
          <span style={{ color: "#8b949e", fontSize: 10, width: 10, textAlign: "center" }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 20px 20px", borderTop: `1px solid rgba(255,255,255,0.05)`, marginTop: 8, paddingTop: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <div style={{ color: "#8b949e", fontSize: 11, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: "600" }}>Description</div>
                  <div style={{ color: "#c9d1d9", fontSize: 14, lineHeight: 1.6 }}>{vuln.description || vuln.header}</div>
                </div>
                <div>
                  <div style={{ color: "#8b949e", fontSize: 11, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: "600" }}>Remediation</div>
                  <div style={{ color: "#52c41a", fontSize: 14, lineHeight: 1.6 }}>{vuln.remediation || "Apply security best practices."}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginTop: 24 }}>
                {vuln.cvss && <div><div style={{ color: "#8b949e", fontSize: 11, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: "600" }}>CVSS v3.1</div><CvssBar score={vuln.cvss} /></div>}
                {vuln.cwe && <div><div style={{ color: "#8b949e", fontSize: 11, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: "600" }}>CWE ID</div><span style={{ color: "#e6edf3", fontSize: 13, fontFamily: "monospace" }}>{vuln.cwe}</span></div>}
                {vuln.owasp && <div><div style={{ color: "#8b949e", fontSize: 11, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: "600" }}>OWASP Category</div><span style={{ color: "#e6edf3", fontSize: 13 }}>{vuln.owasp}</span></div>}
              </div>
              {vuln.payload && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ color: "#8b949e", fontSize: 11, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: "600" }}>Injected Payload</div>
                  <code style={{ color: "#ff4d4f", fontSize: 13, background: "rgba(255, 77, 79, 0.05)", border: "1px solid rgba(255, 77, 79, 0.2)", borderRadius: 6, padding: "8px 12px", display: "block", fontFamily: "monospace", overflowX: "auto" }}>{vuln.payload}</code>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

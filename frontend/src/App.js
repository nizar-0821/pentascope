import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ForceGraph2D from 'react-force-graph-2d';
import Spline from '@splinetool/react-spline';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Target, Lock, FileText, Server, Users, Key, AlertTriangle, ChevronDown, CheckCircle, Database } from 'lucide-react';

const API = "http://localhost:5000";

const SEV = {
  CRITICAL: { color: "#ff4d4f", bg: "rgba(255, 77, 79, 0.08)", border: "rgba(255, 77, 79, 0.3)" },
  HIGH: { color: "#faad14", bg: "rgba(250, 173, 20, 0.08)", border: "rgba(250, 173, 20, 0.3)" },
  MEDIUM: { color: "#fadb14", bg: "rgba(250, 219, 20, 0.08)", border: "rgba(250, 219, 20, 0.3)" },
  LOW: { color: "#52c41a", bg: "rgba(82, 196, 26, 0.08)", border: "rgba(82, 196, 26, 0.3)" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

function Badge({ s }) {
  const c = SEV[s] || SEV.LOW;
  return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: "600", letterSpacing: 0.5 }}>{s}</span>;
}

function StatCard({ label, count, color }) {
  return (
    <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px 24px", textAlign: "center", minWidth: 100, backdropFilter: "blur(10px)" }}>
      <div style={{ color, fontSize: 36, fontWeight: "300", fontFamily: "system-ui, -apple-system, sans-serif" }}>{count}</div>
      <div style={{ color: "#8b949e", fontSize: 11, marginTop: 4, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function CvssBar({ score }) {
  const color = score >= 9 ? "#ff4d4f" : score >= 7 ? "#faad14" : score >= 4 ? "#fadb14" : "#52c41a";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 6, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${(score / 10) * 100}%`, background: color, height: "100%", borderRadius: 6 }} />
      </div>
      <span style={{ color, fontSize: 12, fontWeight: "600", minWidth: 24 }}>{score}</span>
    </div>
  );
}

function VulnCard({ vuln, index }) {
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

function ProgressBar({ scanId, onDone }) {
  const [progress, setProgress] = useState({ step: 0, total: 10, message: "Initializing components..." });

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/api/scan/status/${scanId}`);
        setProgress(res.data);
        if (res.data.done) { clearInterval(iv); onDone(res.data.result); }
      } catch {
        clearInterval(iv);
        setProgress(p => ({ ...p, message: "Error: Connection to scanning engine lost", step: 0 }));
      }
    }, 600);
    return () => clearInterval(iv);
  }, [scanId]);

  const pct = Math.round((progress.step / progress.total) * 100);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 40, textAlign: "center", backdropFilter: "blur(10px)" }}>
      <Activity size={32} color="#58a6ff" style={{ marginBottom: 16, animation: "spin 2s linear infinite" }} />
      <div style={{ color: "#e6edf3", fontSize: 15, marginBottom: 16, fontWeight: "500" }}>{progress.message}</div>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, height: 6, marginBottom: 12, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: "linear-gradient(90deg, #3182ce, #63b3ed)", height: "100%", borderRadius: 10, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ color: "#8b949e", fontSize: 12 }}>Phase {progress.step} of {progress.total} — {pct}%</div>
    </motion.div>
  );
}

function AttackGraph({ results }) {
  const fgRef = useRef();
  const targetUrl = results?.target || "Target";
  const endpoints = results?.endpoints || [];
  const vulns = [...(results?.vulnerabilities || []), ...(results?.missing_headers || [])];

  const nodes = [{ id: "Target", name: targetUrl, group: "target", val: 6, color: "#58a6ff" }];
  const links = [];
  const epNodes = new Set();

  endpoints.forEach(ep => {
    const epName = ep.url;
    if (!epNodes.has(epName)) {
      epNodes.add(epName);
      nodes.push({ id: epName, name: new URL(epName, "http://localhost").pathname, group: "endpoint", val: 4, color: "#8b949e" });
      links.push({ source: "Target", target: epName });
    }
    ep.params?.forEach(p => {
      const pId = `${epName}?${p}`;
      nodes.push({ id: pId, name: p, group: "param", val: 2, color: "#484f58" });
      links.push({ source: epName, target: pId });
    });
  });

  vulns.forEach((v, i) => {
    const vId = `vuln_${i}`;
    nodes.push({ id: vId, name: v.type, group: "vuln", val: 4, color: SEV[v.severity]?.color || "#ff4d4f" });

    let targetNode = "Target";
    if (v.url && v.param) targetNode = `${v.url}?${v.param}`;
    else if (v.url) targetNode = v.url;

    if (!nodes.find(n => n.id === targetNode)) {
      nodes.push({ id: targetNode, name: targetNode.replace(/^.*\/\/[^/]+/, ''), group: "implicit", val: 2, color: "#8b949e" });
      links.push({ source: "Target", target: targetNode });
    }

    links.push({ source: targetNode, target: vId, color: SEV[v.severity]?.color || "#ff4d4f" });
  });

  return (
    <div style={{ height: 600, width: "100%", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden", marginTop: 24 }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeRelSize={6}
        linkColor={l => l.color || "rgba(255,255,255,0.1)"}
        backgroundColor="transparent"
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={d => d.color ? 0.01 : 0.005}
        cooldownTicks={100}
        onEngineStop={() => fgRef.current && fgRef.current.zoomToFit(400, 50)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px -apple-system, sans-serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

          ctx.fillStyle = 'rgba(15, 17, 26, 0.8)';
          ctx.beginPath();
          ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1], 4 / globalScale);
          ctx.fill();

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = node.color;
          ctx.fillText(label, node.x, node.y);
          node.__bckgDimensions = bckgDimensions;
        }}
      />
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} style={{ marginBottom: 120 }}>
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <h2 style={{ fontSize: 36, fontWeight: "700", color: "#f8fafc", marginBottom: 16, letterSpacing: -1 }}>{title}</h2>
        {description && <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>{description}</p>}
      </div>
      {children}
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 32, transition: "transform 0.3s ease, background 0.3s ease" }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}>
      <div style={{ width: 48, height: 48, background: "rgba(56, 189, 248, 0.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: "#38bdf8" }}>
        <Icon size={24} />
      </div>
      <h3 style={{ color: "#f8fafc", fontSize: 20, fontWeight: "600", marginBottom: 12 }}>{title}</h3>
      <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function AccordionItem({ title, icon: Icon, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0", cursor: "pointer", background: "none", border: "none", color: "#f8fafc" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 18, fontWeight: "500" }}>
          <Icon size={20} color="#38bdf8" /> {title}
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown size={20} color="#94a3b8" /></motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ paddingBottom: 24, color: "#94a3b8", fontSize: 15, lineHeight: 1.6, paddingLeft: 36 }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LandingPage({ onEnter }) {
  return (
    <motion.div
      key="landing"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#09090b", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", top: 40, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
        <div className="logo-icon" style={{ width: 48, height: 48, marginBottom: 16, display: "flex", justifyContent: "center", alignItems: "center", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: "50%", background: "rgba(56, 189, 248, 0.05)", boxShadow: "0 0 20px rgba(56, 189, 248, 0.2)" }}>
          <Target size={24} color="#38bdf8" />
        </div>
        <div className="neo-title" style={{ color: "#94a3b8", fontSize: 12, letterSpacing: 4 }}>PENTASCOPE</div>
      </div>

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.1) 0%, transparent 60%)", zIndex: 1, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')", opacity: 0.5, zIndex: 1, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 1200, padding: "0 20px" }}>
        <motion.h1 className="neo-title" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 1 }} style={{ fontSize: "clamp(30px, 6vw, 90px)", lineHeight: 1.1, color: "#f8fafc", margin: 0 }}>
          ADVANCED<br />
          ATTACK SURFACE<br />
          <span style={{ color: "#38bdf8" }}>DISCOVERY</span>
        </motion.h1>
      </div>

      <div style={{ position: "absolute", bottom: 60, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
        <motion.button
          onClick={onEnter}
          className="neo-button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          style={{ padding: "18px 48px", fontSize: 15, letterSpacing: 3, marginBottom: 24 }}
        >
          INITIALIZE PLATFORM
        </motion.button>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }} className="neo-title" style={{ color: "#64748b", fontSize: 10, letterSpacing: 3, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, background: "#10b981", borderRadius: "50%", boxShadow: "0 0 10px #10b981" }} /> SECURED CONNECTION ESTABLISHED
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [viewingLanding, setViewingLanding] = useState(true);
  const [target, setTarget] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState(null);
  const [results, setResults] = useState(null);
  const [reportStatus, setReport] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const resultsRef = useRef(null);

  const startScan = async () => {
    if (!target) return alert("Please enter a target URL");
    setScanning(true); setResults(null); setReport("");
    try {
      const res = await axios.post(`${API}/api/scan/progress`, { target });
      setScanId(res.data.scan_id);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { setScanning(false); alert("Error: Scanning engine unreachable"); }
  };

  const runRecon = async () => {
    if (!target) return alert("Please enter a target URL");
    setResults(null); setReport("");
    try {
      const res = await axios.post(`${API}/api/recon`, { target });
      setResults({ type: "recon", data: res.data });
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { alert("Error: Scanning engine unreachable"); }
  };

  const onScanDone = (result) => {
    setScanning(false); setScanId(null);
    setResults({ type: "scan", data: result });
  };

  const allVulns = results?.type === "scan"
    ? [...(results.data.vulnerabilities || []), ...(results.data.missing_headers || [])]
    : [];

  const counts = {
    CRITICAL: allVulns.filter(v => v.severity === "CRITICAL").length,
    HIGH: allVulns.filter(v => v.severity === "HIGH").length,
    MEDIUM: allVulns.filter(v => v.severity === "MEDIUM").length,
    LOW: allVulns.filter(v => v.severity === "LOW").length,
  };
  const riskScore = counts.CRITICAL * 10 + counts.HIGH * 7 + counts.MEDIUM * 4 + counts.LOW;
  const riskLabel = riskScore >= 20 ? "CRITICAL" : riskScore >= 10 ? "HIGH" : riskScore >= 4 ? "MEDIUM" : "LOW";

  return (
    <AnimatePresence mode="wait">
      {viewingLanding ? (
        <LandingPage onEnter={() => setViewingLanding(false)} />
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{ background: "#09090b", minHeight: "100vh", color: "#f8fafc", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", overflowX: "hidden" }}
        >

          {/* Header */}
          <div style={{ background: "rgba(9, 9, 11, 0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 40px", display: "flex", alignItems: "center", height: 72, position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #0ea5e9, #3b82f6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(14, 165, 233, 0.4)" }}>
                <Shield size={20} color="#fff" />
              </div>
              <span style={{ fontSize: 22, fontWeight: "700", letterSpacing: -0.5 }}>PentaScope <span style={{ fontWeight: "400", color: "#94a3b8" }}>Enterprise</span></span>
            </div>
            <div style={{ flex: 1 }} />
            <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 13, fontWeight: "500", background: "rgba(255,255,255,0.03)", padding: "8px 16px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ width: 8, height: 8, background: "#10b981", borderRadius: "50%", boxShadow: "0 0 10px #10b981" }} /> System Active
            </span>
          </div>

          {/* Hero 3D Section */}
          <div style={{ height: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "url('/cyber_bg.png')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.5 }}>
              {/* Overlay to fade edges into black */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60vh", background: "linear-gradient(to top, #09090b, transparent)" }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "30vh", background: "linear-gradient(to bottom, #09090b, transparent)" }} />
            </div>

            <motion.div initial="hidden" animate="visible" variants={staggerContainer} style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 900, padding: "0 24px", textAlign: "center", marginTop: 40 }}>
              <motion.div variants={fadeUp} style={{ display: "inline-block", background: "rgba(14, 165, 233, 0.1)", border: "1px solid rgba(14, 165, 233, 0.3)", color: "#38bdf8", padding: "6px 16px", borderRadius: 30, fontSize: 13, fontWeight: "600", marginBottom: 24, letterSpacing: 1, textTransform: "uppercase" }}>
                Next-Gen Security Framework
              </motion.div>
              <motion.h1 variants={fadeUp} style={{ fontSize: "clamp(48px, 6vw, 72px)", fontWeight: "800", lineHeight: 1.1, marginBottom: 24, letterSpacing: -2 }}>
                Automated Audits. <br /><span style={{ background: "linear-gradient(90deg, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Zero Compromise.</span>
              </motion.h1>
              <motion.p variants={fadeUp} style={{ color: "#94a3b8", fontSize: "clamp(16px, 2vw, 20px)", maxWidth: 600, margin: "0 auto 48px", lineHeight: 1.6 }}>
                Discover, map, and exploit vulnerabilities across your web infrastructure with unparalleled speed and architectural clarity.
              </motion.p>

              <motion.div variants={fadeUp} style={{ background: "rgba(15, 17, 26, 0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 12, backdropFilter: "blur(20px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset", display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                  <Target size={20} color="#64748b" style={{ position: "absolute", left: 16 }} />
                  <input value={target} onChange={e => setTarget(e.target.value)}
                    placeholder="https://target-application.internal"
                    onKeyDown={e => e.key === "Enter" && startScan()}
                    style={{ width: "100%", background: "transparent", border: "none", padding: "16px 16px 16px 48px", color: "#f8fafc", fontSize: 16, outline: "none" }}
                  />
                </div>
                <button onClick={runRecon} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "0 24px", height: 50, color: "#e2e8f0", cursor: "pointer", fontSize: 14, fontWeight: "500", transition: "all 0.2s" }} onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.08)"} onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.05)"}>Recon</button>
                <button onClick={startScan} disabled={scanning} style={{ background: "linear-gradient(135deg, #0ea5e9, #3b82f6)", border: "none", borderRadius: 12, padding: "0 32px", height: 50, color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: "600", transition: "all 0.2s", boxShadow: "0 8px 20px rgba(14, 165, 233, 0.3)" }} onMouseEnter={e => e.target.style.boxShadow = "0 12px 24px rgba(14, 165, 233, 0.5)"} onMouseLeave={e => e.target.style.boxShadow = "0 8px 20px rgba(14, 165, 233, 0.3)"}>
                  {scanning ? "Scanning..." : "Launch Attack"}
                </button>
              </motion.div>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 120px", position: "relative", zIndex: 20 }}>

            <Section title="Enterprise-Grade Capabilities" description="PentaScope combines advanced dynamic analysis with an intuitive visual architecture, providing security teams with actionable intelligence.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                <FeatureCard icon={Activity} title="Automated Vulnerability Discovery" desc="Scans for OWASP Top 10 vulnerabilities including SSRF, Command Injection, XSS, and SQLi using advanced payload mutation." />
                <FeatureCard icon={Database} title="Attack Surface Mapping" desc="Generates a live, interactive 2D node graph of all discovered endpoints, parameters, and their associated vulnerabilities." />
                <FeatureCard icon={Lock} title="1-Click PoC Exploitation" desc="Automatically generates ready-to-run Python exploit scripts for critical vulnerabilities, allowing immediate verification by security teams." />
              </div>
            </Section>

            <Section title="Strategic Security Benefits" description="Integrating PentaScope into your workflows ensures compliance and significantly reduces architectural risk.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 32 }}>
                <div style={{ display: "flex", gap: 20 }}>
                  <div style={{ marginTop: 4 }}><CheckCircle color="#10b981" size={24} /></div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>Risk Mitigation</h3>
                    <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>Identify and patch critical vulnerabilities before they reach production, drastically lowering the risk of data breaches.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20 }}>
                  <div style={{ marginTop: 4 }}><CheckCircle color="#10b981" size={24} /></div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>Corporate Reporting</h3>
                    <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>Generate board-ready PDF reports with zero empty spaces, styled for enterprise audit compliance.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20 }}>
                  <div style={{ marginTop: 4 }}><CheckCircle color="#10b981" size={24} /></div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>SDLC Integration</h3>
                    <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>Shift security left by providing developers with actionable remediation advice directly mapped to code inputs.</p>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="General Security Recommendations" description="Beyond automated testing, we recommend implementing these foundational security architectures across your enterprise.">
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "0 32px" }}>
                <AccordionItem title="Zero Trust Architecture" icon={Shield}>
                  Implement a Zero Trust framework where trust is never implicitly granted based on network location. Every request must be authenticated, authorized, and continuously validated.
                </AccordionItem>
                <AccordionItem title="Strict Input Sanitization" icon={FileText}>
                  All user-supplied data must be treated as untrusted. Utilize parameterized queries for database access, and apply strict context-aware output encoding to prevent injection attacks.
                </AccordionItem>
                <AccordionItem title="Identity & Access Management (IAM)" icon={Users}>
                  Enforce the Principle of Least Privilege (PoLP). Ensure that applications, services, and users only have the bare minimum permissions necessary to execute their function.
                </AccordionItem>
                <AccordionItem title="Continuous Patch Management" icon={AlertTriangle}>
                  Maintain an active inventory of all third-party dependencies and system components. Apply critical security patches within 48 hours of release to prevent exploitation of known CVEs.
                </AccordionItem>
              </div>
            </Section>

            {/* Dynamic Results Area */}
            <div ref={resultsRef} style={{ scrollMarginTop: 100 }}>
              <AnimatePresence>
                {scanning && scanId && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <ProgressBar scanId={scanId} onDone={onScanDone} />
                  </motion.div>
                )}

                {results?.type === "scan" && !scanning && (
                  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <h2 style={{ fontSize: 28, fontWeight: "700" }}>Assessment Dashboard</h2>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button onClick={async () => {
                          setReport("generating");
                          try {
                            const res = await axios.post(`${API}/api/report`, { target, vulns: results.data }, { responseType: "blob" });
                            const url = URL.createObjectURL(res.data);
                            const a = document.createElement("a"); a.href = url; a.download = "pentest_report.pdf"; a.click();
                            setReport("done");
                          } catch { setReport("error"); }
                        }} style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 8, padding: "10px 20px", color: "#10b981", cursor: "pointer", fontSize: 13, fontWeight: "600", transition: "all 0.2s" }}>
                          {reportStatus === "generating" ? "Generating..." : "Download Executive PDF"}
                        </button>
                        <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 4, border: "1px solid rgba(255,255,255,0.05)" }}>
                          <button onClick={() => setViewMode("table")} style={{ background: viewMode === "table" ? "rgba(255,255,255,0.1)" : "transparent", border: "none", borderRadius: 6, padding: "8px 16px", color: viewMode === "table" ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: "500", transition: "all 0.2s" }}>List View</button>
                          <button onClick={() => setViewMode("graph")} style={{ background: viewMode === "graph" ? "rgba(255,255,255,0.1)" : "transparent", border: "none", borderRadius: 6, padding: "8px 16px", color: viewMode === "graph" ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: "500", transition: "all 0.2s" }}>Topology Map</button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24, marginBottom: 32 }}>
                      <div>
                        <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: "500", marginBottom: 6 }}>Security Posture Assessment</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <span style={{ fontSize: 32, fontWeight: "700", color: SEV[riskLabel]?.color }}>{riskLabel} RISK</span>
                          <span style={{ color: "#64748b", fontSize: 15, background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 6 }}>{allVulns.length} Total Findings</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <StatCard label="Critical" count={counts.CRITICAL} color="#ff4d4f" />
                        <StatCard label="High" count={counts.HIGH} color="#faad14" />
                        <StatCard label="Medium" count={counts.MEDIUM} color="#fadb14" />
                        <StatCard label="Low" count={counts.LOW} color="#52c41a" />
                      </div>
                    </div>

                    {viewMode === "table" ? (
                      <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 32, minHeight: 400 }}>
                        <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: "600", marginBottom: 20 }}>Detailed Findings</div>
                        {allVulns.length === 0
                          ? <div style={{ color: "#52c41a", textAlign: "center", padding: 60, fontSize: 16, fontWeight: "500", background: "rgba(82, 196, 26, 0.05)", borderRadius: 12, border: "1px solid rgba(82, 196, 26, 0.2)" }}>✓ No security vulnerabilities were detected in this assessment.</div>
                          : allVulns.sort((a, b) => (b.cvss || 0) - (a.cvss || 0)).map((v, i) => <VulnCard key={i} vuln={v} index={i + 1} />)
                        }
                      </div>
                    ) : (
                      <AttackGraph results={results.data} />
                    )}
                  </motion.div>
                )}

                {results?.type === "recon" && !scanning && (
                  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 32 }}>
                    <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: "600", marginBottom: 24 }}>Network Topology & Services</div>
                    <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: "500", marginBottom: 16 }}>Discovered Open Ports ({results.data.ports?.length || 0})</div>
                    {results.data.ports?.length > 0
                      ? <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", background: "rgba(0,0,0,0.2)" }}>
                          <thead><tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            {["Port", "Service", "State", "Version"].map(h => <th key={h} style={{ padding: "16px 20px", textAlign: "left", color: "#94a3b8", fontSize: 13, fontWeight: "500" }}>{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {results.data.ports.map((p, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                <td style={{ padding: "16px 20px", color: "#f8fafc", fontWeight: "600" }}>{p.port}</td>
                                <td style={{ padding: "16px 20px", color: "#38bdf8" }}>{p.service}</td>
                                <td style={{ padding: "16px 20px" }}><span style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: "500" }}>{p.state}</span></td>
                                <td style={{ padding: "16px 20px", color: "#94a3b8" }}>{p.version || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      : <div style={{ color: "#94a3b8", background: "rgba(255,255,255,0.02)", padding: 30, textAlign: "center", borderRadius: 10 }}>No responsive services found.</div>
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Target, Lock, FileText, Users,
  AlertTriangle, CheckCircle, Database, Activity,
} from 'lucide-react';
import { API, SEV } from './utils';
import { useScan } from './hooks/useScan';

import { StatCard, Section, FeatureCard, AccordionItem, staggerContainer, fadeUp } from './components/UI';
import { LandingPage }  from './components/LandingPage';
import { VulnCard }     from './components/VulnCard';
import { ProgressBar }  from './components/ProgressBar';
import { AttackGraph }  from './components/AttackGraph';
import { HistoryView }  from './components/HistoryView';

export default function App() {
  const [viewingLanding, setViewingLanding] = useState(true);
  const [viewMode,  setViewMode]  = useState('table');  // 'table' | 'graph'
  const [activeTab, setActiveTab] = useState('scan');   // 'scan' | 'history'
  const resultsRef = useRef(null);

  const {
    target, setTarget,
    scanning, scanId, results, reportStatus,
    allVulns, counts, riskLabel,
    startScan, runRecon, onScanDone, downloadReport,
    exportCSV, exportJSON,
  } = useScan();

  const handleStartScan = (force = false) => {
    setActiveTab('scan');
    startScan(force).then(() => {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  };

  const handleRunRecon = (force = false) => {
    setActiveTab('scan');
    runRecon(force).then(() => {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  };

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
          style={{ background: '#09090b', minHeight: '100vh', color: '#f8fafc', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", overflowX: 'hidden' }}
        >
          {/* Header */}
          <div style={{ background: 'rgba(9,9,11,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 40px', display: 'flex', alignItems: 'center', height: 72, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(14,165,233,0.4)' }}>
                <Shield size={20} color="#fff" />
              </div>
              <span style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.5 }}>
                PentaScope <span style={{ fontWeight: '400', color: '#94a3b8' }}>Enterprise</span>
              </span>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', gap: 16, marginRight: 24 }}>
              <button
                onClick={() => setActiveTab('scan')}
                style={{ background: 'none', border: 'none', color: activeTab === 'scan' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: '500' }}
              >Dashboard</button>
              <button
                onClick={() => setActiveTab('history')}
                style={{ background: 'none', border: 'none', color: activeTab === 'history' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: '500' }}
              >History</button>
            </div>

            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, fontWeight: '500', background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} /> System Active
            </span>
          </div>

          {activeTab === 'scan' ? (
            <>
              {/* Hero Section */}
              <div style={{ height: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: "url('/cyber_bg.png')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5 }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60vh', background: 'linear-gradient(to top, #09090b, transparent)' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30vh', background: 'linear-gradient(to bottom, #09090b, transparent)' }} />
                </div>

                <motion.div initial="hidden" animate="visible" variants={staggerContainer} style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 900, padding: '0 24px', textAlign: 'center', marginTop: 40 }}>
                  <motion.div variants={fadeUp} style={{ display: 'inline-block', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#38bdf8', padding: '6px 16px', borderRadius: 30, fontSize: 13, fontWeight: '600', marginBottom: 24, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Next-Gen Security Framework
                  </motion.div>

                  <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: '800', lineHeight: 1.1, marginBottom: 24, letterSpacing: -2 }}>
                    Automated Audits. <br />
                    <span style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Zero Compromise.</span>
                  </motion.h1>

                  <motion.p variants={fadeUp} style={{ color: '#94a3b8', fontSize: 'clamp(16px, 2vw, 20px)', maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>
                    Discover, map, and exploit vulnerabilities across your web infrastructure with unparalleled speed and architectural clarity.
                  </motion.p>

                  {/* Scan input bar */}
                  <motion.div variants={fadeUp} style={{ background: 'rgba(15,17,26,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 12, backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Target size={20} color="#64748b" style={{ position: 'absolute', left: 16 }} />
                      <input
                        id="target-input"
                        value={target}
                        onChange={e => setTarget(e.target.value)}
                        placeholder="https://target-application.internal"
                        onKeyDown={e => e.key === 'Enter' && handleStartScan()}
                        style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px 16px 16px 48px', color: '#f8fafc', fontSize: 16, outline: 'none' }}
                      />
                    </div>
                    <button
                      id="recon-btn"
                      onClick={() => handleRunRecon(false)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0 24px', height: 50, color: '#e2e8f0', cursor: 'pointer', fontSize: 14, fontWeight: '500', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    >Recon</button>
                    <button
                      id="scan-btn"
                      onClick={() => handleStartScan(false)}
                      disabled={scanning}
                      style={{ background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', border: 'none', borderRadius: 12, padding: '0 32px', height: 50, color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(14,165,233,0.3)' }}
                      onMouseEnter={e => e.target.style.boxShadow = '0 12px 24px rgba(14,165,233,0.5)'}
                      onMouseLeave={e => e.target.style.boxShadow = '0 8px 20px rgba(14,165,233,0.3)'}
                    >
                      {scanning ? 'Scanning…' : 'Launch Attack'}
                    </button>
                  </motion.div>
                </motion.div>
              </div>

              {/* Main content */}
              <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 120px', position: 'relative', zIndex: 20 }}>
                <Section title="Enterprise-Grade Capabilities" description="PentaScope combines advanced dynamic analysis with an intuitive visual architecture, providing security teams with actionable intelligence.">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                    <FeatureCard icon={Activity} title="Automated Vulnerability Discovery" desc="Scans for OWASP Top 10 vulnerabilities including SSRF, Command Injection, XSS, and SQLi using advanced payload mutation." />
                    <FeatureCard icon={Database} title="Attack Surface Mapping" desc="Generates a live, interactive 2D node graph of all discovered endpoints, parameters, and their associated vulnerabilities." />
                    <FeatureCard icon={Lock} title="1-Click PoC Exploitation" desc="Automatically generates ready-to-run Python exploit scripts for critical vulnerabilities, allowing immediate verification by security teams." />
                  </div>
                </Section>

                <Section title="Strategic Security Benefits" description="Integrating PentaScope into your workflows ensures compliance and significantly reduces architectural risk.">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 32 }}>
                    {[
                      { title: 'Risk Mitigation', body: 'Identify and patch critical vulnerabilities before they reach production, drastically lowering the risk of data breaches.' },
                      { title: 'Corporate Reporting', body: 'Generate board-ready PDF reports with zero empty spaces, styled for enterprise audit compliance.' },
                      { title: 'SDLC Integration', body: 'Shift security left by providing developers with actionable remediation advice directly mapped to code inputs.' },
                    ].map(({ title, body }) => (
                      <div key={title} style={{ display: 'flex', gap: 20 }}>
                        <div style={{ marginTop: 4 }}><CheckCircle color="#10b981" size={24} /></div>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>{title}</h3>
                          <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="General Security Recommendations" description="Beyond automated testing, we recommend implementing these foundational security architectures across your enterprise.">
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: '0 32px' }}>
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
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <ProgressBar scanId={scanId} onDone={onScanDone} />
                      </motion.div>
                    )}

                    {results?.type === 'scan' && !scanning && (
                      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <h2 style={{ fontSize: 28, fontWeight: '700' }}>Assessment Dashboard</h2>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <button
                              id="download-pdf-btn"
                              onClick={() => downloadReport(target, results.data)}
                              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 18px', color: '#10b981', cursor: 'pointer', fontSize: 13, fontWeight: '600', transition: 'all 0.2s' }}
                            >
                              {reportStatus === 'generating' ? 'Generating…' : 'Download PDF'}
                            </button>
                            <button
                              id="export-csv-btn"
                              onClick={() => exportCSV(results.data)}
                              style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 8, padding: '10px 16px', color: '#38bdf8', cursor: 'pointer', fontSize: 13, fontWeight: '600', transition: 'all 0.2s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.15)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.08)'; }}
                            >Export CSV</button>
                            <button
                              id="export-json-btn"
                              onClick={() => exportJSON(results.data)}
                              style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.25)', borderRadius: 8, padding: '10px 16px', color: '#818cf8', cursor: 'pointer', fontSize: 13, fontWeight: '600', transition: 'all 0.2s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.15)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.08)'; }}
                            >Export JSON</button>
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                              <button onClick={() => setViewMode('table')} style={{ background: viewMode === 'table' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: 6, padding: '8px 16px', color: viewMode === 'table' ? '#fff' : '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.2s' }}>List View</button>
                              <button onClick={() => setViewMode('graph')} style={{ background: viewMode === 'graph' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: 6, padding: '8px 16px', color: viewMode === 'graph' ? '#fff' : '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: '500', transition: 'all 0.2s' }}>Topology Map</button>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24, marginBottom: 32 }}>
                          <div>
                            <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: '500', marginBottom: 6 }}>Security Posture Assessment</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              <span style={{ fontSize: 32, fontWeight: '700', color: SEV[riskLabel]?.color }}>{riskLabel} RISK</span>
                              <span style={{ color: '#64748b', fontSize: 15, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6 }}>{allVulns.length} Total Findings</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <StatCard label="Critical" count={counts.CRITICAL} color="#ff4d4f" />
                            <StatCard label="High"     count={counts.HIGH}     color="#faad14" />
                            <StatCard label="Medium"   count={counts.MEDIUM}   color="#fadb14" />
                            <StatCard label="Low"      count={counts.LOW}      color="#52c41a" />
                          </div>
                        </div>

                        {viewMode === 'table' ? (
                          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 32, minHeight: 400 }}>
                            <div style={{ color: '#f8fafc', fontSize: 18, fontWeight: '600', marginBottom: 20 }}>Detailed Findings</div>
                            {allVulns.length === 0
                              ? <div style={{ color: '#52c41a', textAlign: 'center', padding: 60, fontSize: 16, fontWeight: '500', background: 'rgba(82,196,26,0.05)', borderRadius: 12, border: '1px solid rgba(82,196,26,0.2)' }}>✓ No security vulnerabilities were detected in this assessment.</div>
                              : allVulns.sort((a, b) => (b.cvss || 0) - (a.cvss || 0)).map((v, i) => <VulnCard key={i} vuln={v} index={i + 1} />)
                            }
                          </div>
                        ) : (
                          <AttackGraph results={results.data} />
                        )}
                      </motion.div>
                    )}

                    {results?.type === 'recon' && !scanning && (
                      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 32 }}>
                        <div style={{ color: '#f8fafc', fontSize: 18, fontWeight: '600', marginBottom: 24 }}>Network Topology & Services</div>
                        <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: '500', marginBottom: 16 }}>Discovered Open Ports ({results.data.ports?.length || 0})</div>
                        {results.data.ports?.length > 0
                          ? <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(0,0,0,0.2)' }}>
                              <thead><tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {['Port', 'Service', 'State', 'Version'].map(h => <th key={h} style={{ padding: '16px 20px', textAlign: 'left', color: '#94a3b8', fontSize: 13, fontWeight: '500' }}>{h}</th>)}
                              </tr></thead>
                              <tbody>
                                {results.data.ports.map((p, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '16px 20px', color: '#f8fafc', fontWeight: '600' }}>{p.port}</td>
                                    <td style={{ padding: '16px 20px', color: '#38bdf8' }}>{p.service}</td>
                                    <td style={{ padding: '16px 20px' }}><span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: '500' }}>{p.state}</span></td>
                                    <td style={{ padding: '16px 20px', color: '#94a3b8' }}>{p.version || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          : <div style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.02)', padding: 30, textAlign: 'center', borderRadius: 10 }}>No responsive services found.</div>
                        }
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          ) : (
            <div style={{ paddingTop: 100, maxWidth: 1200, margin: '0 auto', paddingLeft: 24, paddingRight: 24 }}>
              <HistoryView />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
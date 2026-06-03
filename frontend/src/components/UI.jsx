import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SEV } from '../utils';

export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export function Badge({ s }) {
  const c = SEV[s] || SEV.LOW;
  return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: "600", letterSpacing: 0.5 }}>{s}</span>;
}

export function StatCard({ label, count, color }) {
  return (
    <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px 24px", textAlign: "center", minWidth: 100, backdropFilter: "blur(10px)" }}>
      <div style={{ color, fontSize: 36, fontWeight: "300", fontFamily: "system-ui, -apple-system, sans-serif" }}>{count}</div>
      <div style={{ color: "#8b949e", fontSize: 11, marginTop: 4, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

export function CvssBar({ score }) {
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

export function Section({ title, description, children }) {
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

export function FeatureCard({ icon: Icon, title, desc }) {
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

export function AccordionItem({ title, icon: Icon, children }) {
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

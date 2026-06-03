import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

export function LandingPage({ onEnter }) {
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

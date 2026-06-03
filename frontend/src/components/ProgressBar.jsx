import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { API } from '../utils';

export function ProgressBar({ scanId, onDone }) {
  const [progress, setProgress] = useState({ step: 0, total: 10, message: "Initializing components..." });
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/api/scan/status/${scanId}`);
        setProgress(res.data);
        if (res.data.done) { clearInterval(iv); onDone(res.data.result); }
      } catch (err) {
        clearInterval(iv);
        setProgress(p => ({ ...p, message: "Error: Connection to scanning engine lost", step: 0 }));
        if (err.response && err.response.data && err.response.data.error) {
            setErrorMsg(err.response.data.error);
        }
      }
    }, 600);
    return () => clearInterval(iv);
  }, [scanId, onDone]);

  const pct = Math.round((progress.step / progress.total) * 100);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 40, textAlign: "center", backdropFilter: "blur(10px)" }}>
      {errorMsg ? (
        <div style={{ color: "#ff4d4f", fontSize: 16, fontWeight: "500" }}>{errorMsg}</div>
      ) : (
        <>
          <Activity size={32} color="#58a6ff" style={{ marginBottom: 16, animation: "spin 2s linear infinite" }} />
          <div style={{ color: "#e6edf3", fontSize: 15, marginBottom: 16, fontWeight: "500" }}>{progress.message}</div>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, height: 6, marginBottom: 12, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, background: "linear-gradient(90deg, #3182ce, #63b3ed)", height: "100%", borderRadius: 10, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ color: "#8b949e", fontSize: 12 }}>Phase {progress.step} of {progress.total} — {pct}%</div>
        </>
      )}
    </motion.div>
  );
}

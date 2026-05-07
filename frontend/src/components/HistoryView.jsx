import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, Download } from 'lucide-react';
import { API, SEV } from '../utils';

export function HistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/history`);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (scanId) => {
    try {
      const resDetail = await axios.get(`${API}/api/history/${scanId}`);
      const scanData = resDetail.data;
      const resPdf = await axios.post(`${API}/api/report`, { target: scanData.target || "Unknown", vulns: scanData }, { responseType: "blob" });
      const url = URL.createObjectURL(resPdf.data);
      const a = document.createElement("a"); a.href = url; a.download = `pentest_report_${scanId}.pdf`; a.click();
    } catch (err) {
      alert("Failed to generate report from history.");
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Loading scan history...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Clock size={24} color="#38bdf8" />
        <h2 style={{ fontSize: 24, fontWeight: "600", color: "#f8fafc", margin: 0 }}>Scan History</h2>
      </div>

      {history.length === 0 ? (
        <div style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>No previous scans found.</div>
      ) : (
        <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "rgba(0,0,0,0.2)" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["Date", "Target", "Type", "Critical", "High", "Action"].map(h => <th key={h} style={{ padding: "16px 20px", textAlign: "left", color: "#94a3b8", fontSize: 13, fontWeight: "500" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {history.map((scan) => (
                <tr key={scan.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "16px 20px", color: "#94a3b8", fontSize: 13 }}>{scan.created_at}</td>
                  <td style={{ padding: "16px 20px", color: "#f8fafc", fontWeight: "500" }}>{scan.target}</td>
                  <td style={{ padding: "16px 20px", color: "#38bdf8", fontSize: 13, textTransform: "capitalize" }}>{scan.scan_type}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ color: SEV.CRITICAL.color, fontWeight: "600" }}>{scan.critical}</span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ color: SEV.HIGH.color, fontWeight: "600" }}>{scan.high}</span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    {scan.scan_type === "vuln" && (
                      <button onClick={() => downloadReport(scan.id)} style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 6, padding: "6px 12px", color: "#10b981", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <Download size={14} /> PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, Download, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { API, SEV } from '../utils';

const PAGE_SIZE = 15;

export function HistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [error,   setError]   = useState(null);

  const fetchHistory = useCallback(async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/api/history`, {
        params: { page: p, limit: PAGE_SIZE },
      });
      // Support both old flat array and new paginated object
      if (Array.isArray(res.data)) {
        setHistory(res.data);
        setTotal(res.data.length);
      } else {
        setHistory(res.data.results || []);
        setTotal(res.data.total   || 0);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
      setError('Failed to load scan history. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchHistory(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const downloadReport = async (scanId) => {
    try {
      const resDetail = await axios.get(`${API}/api/history/${scanId}`);
      const scanData  = resDetail.data;
      const target    = scanData.target || 'Unknown';
      const resPdf    = await axios.post(
        `${API}/api/report`,
        { target, vulns: scanData },
        { responseType: 'blob' },
      );
      const url = URL.createObjectURL(resPdf.data);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `pentest_report_${scanId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate report from history.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const SeverityBadge = ({ count, color, label }) => (
    <span style={{ color, fontWeight: '600', fontSize: 14 }}>
      {count}<span style={{ color: '#64748b', fontWeight: '400', fontSize: 11, marginLeft: 3 }}>{label}</span>
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 32 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Clock size={24} color="#38bdf8" />
          <h2 style={{ fontSize: 24, fontWeight: '600', color: '#f8fafc', margin: 0 }}>Scan History</h2>
          {total > 0 && (
            <span style={{ color: '#64748b', fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '3px 10px' }}>
              {total} scans
            </span>
          )}
        </div>
        <button
          onClick={() => fetchHistory(page)}
          title="Refresh"
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#38bdf8'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ color: '#ff4d4f', background: 'rgba(255,77,79,0.08)', border: '1px solid rgba(255,77,79,0.2)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading scan history…</div>
      ) : history.length === 0 ? (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>No previous scans found.</div>
      ) : (
        <>
          <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(0,0,0,0.2)' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Date', 'Target', 'Type', 'Findings', 'Action'].map(h => (
                    <th key={h} style={{ padding: '16px 20px', textAlign: 'left', color: '#94a3b8', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((scan) => (
                  <tr key={scan.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>{scan.created_at}</td>
                    <td style={{ padding: '16px 20px', color: '#f8fafc', fontWeight: '500', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.target}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ color: '#38bdf8', fontSize: 12, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 20, padding: '3px 10px', textTransform: 'capitalize' }}>{scan.scan_type}</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {scan.scan_type === 'vuln' ? (
                        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                          <SeverityBadge count={scan.critical} color={SEV.CRITICAL.color} label="C" />
                          <SeverityBadge count={scan.high}     color={SEV.HIGH.color}     label="H" />
                          <SeverityBadge count={scan.medium}   color={SEV.MEDIUM.color}   label="M" />
                          <SeverityBadge count={scan.low}      color={SEV.LOW.color}       label="L" />
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {scan.scan_type === 'vuln' && (
                        <button
                          onClick={() => downloadReport(scan.id)}
                          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 6, padding: '7px 14px', color: '#10b981', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'; }}
                        >
                          <Download size={13} /> PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 14px', color: page <= 1 ? '#334155' : '#94a3b8', cursor: page <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
              >
                <ChevronLeft size={15} /> Prev
              </button>
              <span style={{ color: '#64748b', fontSize: 13 }}>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 14px', color: page >= totalPages ? '#334155' : '#94a3b8', cursor: page >= totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

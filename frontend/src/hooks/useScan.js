import { useState, useCallback } from 'react';
import axios from 'axios';
import { API } from '../utils';

/**
 * useScan — encapsulates all scanning state and logic
 * extracted from App.js to keep it maintainable.
 */
export function useScan() {
  const [target, setTarget]       = useState('');
  const [scanning, setScanning]   = useState(false);
  const [scanId, setScanId]       = useState(null);
  const [results, setResults]     = useState(null);
  const [reportStatus, setReport] = useState(''); // '' | 'generating' | 'done' | 'error'

  const startScan = useCallback(async (force = false) => {
    if (!target) return alert('Please enter a target URL');
    setScanning(true);
    setResults(null);
    setReport('');
    try {
      const res = await axios.post(`${API}/api/scan/progress`, { target, force });
      setScanId(res.data.scan_id);
    } catch (err) {
      setScanning(false);
      if (err.response?.data?.requires_force) {
        if (window.confirm(`${err.response.data.details}\n\nOverride and force the scan anyway?`)) {
          startScan(true);
        }
      } else {
        const msg = err.response?.data?.details || err.response?.data?.error || 'Scanning engine unreachable';
        alert(`Error: ${msg}`);
      }
    }
  }, [target]);

  const runRecon = useCallback(async (force = false) => {
    if (!target) return alert('Please enter a target URL');
    setResults(null);
    setReport('');
    try {
      const res = await axios.post(`${API}/api/recon`, { target, force });
      setResults({ type: 'recon', data: res.data });
    } catch (err) {
      if (err.response?.data?.requires_force) {
        if (window.confirm(`${err.response.data.details}\n\nOverride and force the recon anyway?`)) {
          runRecon(true);
        }
      } else {
        const msg = err.response?.data?.details || err.response?.data?.error || 'Scanning engine unreachable';
        alert(`Error: ${msg}`);
      }
    }
  }, [target]);

  const onScanDone = useCallback((result) => {
    setScanning(false);
    setScanId(null);
    setResults({ type: 'scan', data: result });
  }, []);

  const downloadReport = useCallback(async (reportTarget, vulnData) => {
    setReport('generating');
    try {
      const res = await axios.post(
        `${API}/api/report`,
        { target: reportTarget, vulns: vulnData },
        { responseType: 'blob' },
      );
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = 'pentest_report.pdf';
      a.click();
      URL.revokeObjectURL(url);
      setReport('done');
    } catch {
      setReport('error');
    }
  }, []);

  const exportCSV = useCallback(async (vulnData) => {
    try {
      const payload = {
        vulnerabilities: vulnData.vulnerabilities || [],
        missing_headers:  vulnData.missing_headers  || [],
      };
      const res = await axios.post(`${API}/api/export/csv`, payload, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = 'pentest_findings.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export CSV.');
    }
  }, []);

  const exportJSON = useCallback((vulnData) => {
    try {
      const blob = new Blob([JSON.stringify(vulnData, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href      = url;
      a.download  = 'pentest_findings.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export JSON.');
    }
  }, []);

  // Derived state
  const allVulns = results?.type === 'scan'
    ? [...(results.data.vulnerabilities || []), ...(results.data.missing_headers || [])]
    : [];

  const counts = {
    CRITICAL: allVulns.filter(v => v.severity === 'CRITICAL').length,
    HIGH:     allVulns.filter(v => v.severity === 'HIGH').length,
    MEDIUM:   allVulns.filter(v => v.severity === 'MEDIUM').length,
    LOW:      allVulns.filter(v => v.severity === 'LOW').length,
  };

  const riskScore = counts.CRITICAL * 10 + counts.HIGH * 7 + counts.MEDIUM * 4 + counts.LOW;
  const riskLabel = riskScore >= 20 ? 'CRITICAL' : riskScore >= 10 ? 'HIGH' : riskScore >= 4 ? 'MEDIUM' : 'LOW';

  return {
    target, setTarget,
    scanning,
    scanId,
    results,
    reportStatus,
    allVulns,
    counts,
    riskScore,
    riskLabel,
    startScan,
    runRecon,
    onScanDone,
    downloadReport,
    exportCSV,
    exportJSON,
  };
}

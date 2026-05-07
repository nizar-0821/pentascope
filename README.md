<div align="center">

# 🔐 PentaScope
### Advanced Attack Surface Discovery & Web Penetration Testing Framework

[![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![OWASP](https://img.shields.io/badge/OWASP-Top%2010-E44D26?style=for-the-badge)](https://owasp.org)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)

**Automated Audits. Zero Compromise.**

*Discover, map, and exploit vulnerabilities across your web infrastructure with unparalleled speed and architectural clarity.*

📖 **[Full Technical Documentation](./PENTASCOPE_FULL_DOCUMENTATION.md)**

</div>

---

## 📌 Overview

**PentaScope** is a full-stack web application penetration testing framework that automates the complete security assessment lifecycle — from passive reconnaissance and intelligent crawling, through active multi-vector vulnerability detection, to professional-grade PDF report generation — all orchestrated through a premium, luxury-futuristic React dashboard.

Built as a **Projet de Fin de Formation (PFF)** in Cybersecurity — 2024/2025.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Recon Module** | Subdomain enumeration (Subfinder) + port scanning (Nmap `-sT -T4 --top-ports 100`) |
| 🕷️ **Intelligent Crawler** | BeautifulSoup HTML crawler — discovers all forms, inputs, and parameterized links |
| 🛡️ **8-Vector Vuln Scanner** | SQLi, XSS, SSRF, LFI, Command Injection, Open Redirect, CSRF, Security Headers |
| 🕸️ **Attack Surface Graph** | Interactive 2D force-directed topology map (Maltego-style) via `react-force-graph-2d` |
| ⚡ **PoC Exploit Generator** | 1-click auto-generated Python exploit scripts for every finding |
| 📊 **Live Progress Bar** | Real-time 10-step scan progress via background threading + polling |
| 📄 **Corporate PDF Report** | Enterprise-grade ReportLab PDF with cover page, CVSS scoring, and findings |
| 📤 **CSV / JSON Export** | Export all findings for integration with other tools |
| 🎨 **Luxury Futuristic UI** | Framer Motion animations, Spline 3D background, glassmorphism design |

---

## 🏗️ Architecture

```
pentest-framework/
├── backend/
│   ├── app.py                  # Flask REST API — all routes, DB, async threading
│   └── scanner/
│       ├── recon.py            # Subfinder + Nmap reconnaissance
│       ├── vuln_scan.py        # 8-module vulnerability engine + OWASP/CVE mapping
│       └── crawler.py          # BeautifulSoup HTML endpoint discovery
├── frontend/
│   └── src/
│       └── App.js              # React dashboard — UI, Attack Graph, PoC Generator
├── reports/
│   └── generator.py            # ReportLab PDF — corporate cover page + findings
├── PENTASCOPE_FULL_DOCUMENTATION.md   # Complete technical documentation
└── README.md
```

---

## 🎯 Vulnerability Coverage (OWASP Top 10)

| Vulnerability | Severity | CVSS | OWASP Category |
|--------------|----------|------|----------------|
| SQL Injection | 🔴 CRITICAL | 9.8 | A03:2021 — Injection |
| OS Command Injection | 🔴 CRITICAL | 9.8 | A03:2021 — Injection |
| Directory Traversal (LFI) | 🔴 CRITICAL | 9.1 | A01:2021 — Broken Access Control |
| Server-Side Request Forgery | 🟠 HIGH | 8.6 | A10:2021 — SSRF |
| Missing CSRF Protection | 🟠 HIGH | 8.0 | A01:2021 — Broken Access Control |
| Cross-Site Scripting (XSS) | 🟠 HIGH | 7.2 | A03:2021 — Injection |
| Open Redirect | 🟡 MEDIUM | 6.1 | A01:2021 — Broken Access Control |
| Missing Security Headers | 🟡 MEDIUM / 🟢 LOW | 3.1–6.1 | A05:2021 — Security Misconfiguration |

---

## ⚙️ Installation

### Prerequisites
- Kali Linux (or any Debian-based OS)
- Python 3.x + pip
- Node.js + npm
- Nmap (`sudo apt install nmap`)
- Subfinder (`go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest`)

### Setup

```bash
# 1. Clone the project
git clone https://github.com/nizar-0821/pentascope.git
cd pentascope

# 2. Create Python virtual environment
python3 -m venv ~/pentest-env
source ~/pentest-env/bin/activate

# 3. Install Python dependencies
pip install flask flask-cors flask-sqlalchemy requests reportlab python-nmap beautifulsoup4

# 4. Install frontend dependencies
cd frontend && npm install
```

---

## ▶️ Usage

```bash
# Terminal 1 — Start the Flask API
cd ~/pentascope
source ~/pentest-env/bin/activate
python3 backend/app.py

# Terminal 2 — Start the React Dashboard
cd ~/pentascope/frontend
npm start
```

Open browser: **http://localhost:3000**

### Test Target (DVWA)
```bash
sudo docker run -d -p 8080:80 vulnerables/web-dvwa
```
Then scan: `http://localhost:8080`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/recon` | Subdomain enum + port scan |
| `POST` | `/api/scan/progress` | Start async vulnerability scan |
| `GET` | `/api/scan/status/<id>` | Poll real-time scan progress |
| `GET` | `/api/history` | Last 20 scans from database |
| `POST` | `/api/report` | Generate & download PDF report |
| `POST` | `/api/export/csv` | Export findings as CSV |

---

## 📸 Demo Flow

1. **Landing Page** → Animated 3D hero with luxury UI
2. **Initialize Platform** → Transition to dashboard
3. **Recon** → Live port scan results table
4. **Launch Attack** → 10-step real-time progress bar
5. **Assessment Dashboard** → Risk score + Critical/High/Medium/Low counts
6. **Topology Map** → Interactive attack graph
7. **PoC Exploit** → Download ready-to-run Python exploit
8. **PDF Report** → Corporate executive report download

---

## 🛡️ Legal Disclaimer

> ⚠️ **This tool is for educational and authorized testing purposes only.**
> Only test systems you own or have **explicit written permission** to test.
> Unauthorized penetration testing is illegal in most jurisdictions.

---

## 👨‍💻 Author

**Nizar Oualidi** — Cybersecurity Training Project 2024/2025

📖 **[Full Technical Documentation →](./PENTASCOPE_FULL_DOCUMENTATION.md)**

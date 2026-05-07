# 🔐 PentaScope
> Automated Web Application Penetration Testing Framework

![Python](https://img.shields.io/badge/Python-3.x-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Flask](https://img.shields.io/badge/Flask-3.x-black)
![License](https://img.shields.io/badge/License-MIT-green)

## 📌 Overview
PentaScope is a full-stack penetration testing framework that automates
the web application security assessment lifecycle — from reconnaissance
to professional PDF reporting.

## 🚀 Features
- 🔍 **Recon Module** — Subdomain enumeration + port scanning (Nmap)
- 🛡️ **Vuln Scanner** — SQLi, XSS, Missing Security Headers detection
- 📊 **Dashboard** — React UI for target management & results
- 📄 **PDF Report** — Auto-generated professional report with CVSS scoring
- 🔗 **REST API** — Flask backend orchestrating all modules

## 🏗️ Architecture
pentest-framework/
├── backend/
│   ├── scanner/
│   │   ├── recon.py        # Nmap + Subfinder
│   │   └── vuln_scan.py    # SQLi, XSS, Headers
│   └── app.py              # Flask REST API
├── frontend/
│   └── src/
│       └── App.js          # React Dashboard
└── reports/
└── generator.py        # PDF Report (ReportLab)
## ⚙️ Installation

### Prerequisites
- Kali Linux (VMware)
- Python 3.x
- Node.js + npm
- Nmap, Subfinder

### Setup
```bash
# Clone project
git clone https://github.com/yourusername/pentascope
cd pentascope

# Python environment
python3 -m venv ~/pentest-env
source ~/pentest-env/bin/activate
pip install flask flask-cors requests reportlab python-nmap

# Frontend
cd frontend && npm install
```

## ▶️ Usage

```bash
# Terminal 1 — Start API
source ~/pentest-env/bin/activate
python3 backend/app.py

# Terminal 2 — Start Dashboard
cd frontend && npm start
```

Open browser: **http://localhost:3000**

## 🎯 Methodology
| Phase | Tools | Standard |
|-------|-------|----------|
| Reconnaissance | Nmap, Subfinder | PTES |
| Vulnerability Scan | Custom Scanner | OWASP Top 10 |
| Reporting | ReportLab PDF | CVSS v3.1 |

## ⚠️ Legal Disclaimer
This tool is for **educational purposes only**.
Only test systems you own or have explicit permission to test.

## 👨‍💻 Author
**[Nizar Oualidi]** — Cybersecurity Training Project 2024/2025

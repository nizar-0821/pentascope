<div align="center">

# 🔐 PentaScope
### Advanced Attack Surface Discovery & Web Penetration Testing Framework

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![OWASP](https://img.shields.io/badge/OWASP-Top%2010-E44D26?style=for-the-badge)](https://owasp.org)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](.github/workflows/ci.yml)
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
| 🕷️ **Async Intelligent Crawler** | Fully async `aiohttp` BFS crawler — discovers all forms, inputs, and parameterized links without blocking |
| 🛡️ **8-Vector Vuln Scanner** | SQLi, XSS, SSRF, LFI, Command Injection, Open Redirect, CSRF, Security Headers (7 headers checked) |
| ⚡ **True Parallel Scanning** | All vulnerability tests run simultaneously via `asyncio.gather()` — dramatically faster than sequential |
| 🕸️ **Attack Surface Graph** | Interactive 2D force-directed topology map (Maltego-style) via `react-force-graph-2d` |
| 🎯 **PoC Exploit Generator** | 1-click auto-generated Python exploit scripts for every finding |
| 📊 **Live Progress Bar** | Real-time 10-step scan progress via background threading + polling |
| 📄 **Corporate PDF Report** | Enterprise-grade ReportLab PDF with cover page, CVSS scoring, CWE, and OWASP references |
| 📤 **CSV / JSON Export** | Export all findings (including CWE & OWASP columns) for integration with other tools |
| 🗂️ **Paginated Scan History** | Full scan history with severity breakdown (C/H/M/L) and pagination |
| 🎨 **Luxury Futuristic UI** | Framer Motion animations, Spline 3D background, glassmorphism design |
| 🐳 **Docker Compose Deploy** | One-command production deployment with network isolation and health checks |

---

## 🏗️ Architecture

```
pentest-framework/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI: Python lint/test + React build + Docker smoke test
├── backend/
│   ├── app.py                  # Flask REST API — routes, DB (thread-safe SQLite), async scope check
│   ├── Dockerfile              # Includes nmap + subfinder binary (multi-arch)
│   └── scanner/
│       ├── recon.py            # Subfinder + Nmap reconnaissance
│       ├── vuln_scan.py        # 8-module async vuln engine + CWE/OWASP mapping
│       └── crawler.py          # Async aiohttp BFS endpoint crawler
├── frontend/
│   ├── Dockerfile              # Multi-stage build → nginx:alpine
│   └── src/
│       ├── App.js              # Main layout + navigation
│       ├── hooks/
│       │   └── useScan.js      # Custom hook — all scan state & API logic
│       ├── components/
│       │   ├── LandingPage.jsx # Animated entry page
│       │   ├── ProgressBar.jsx # Real-time polling progress
│       │   ├── VulnCard.jsx    # Expandable finding card + PoC generator
│       │   ├── AttackGraph.jsx # Force-directed attack graph
│       │   ├── HistoryView.jsx # Paginated scan history
│       │   └── UI.jsx          # Design system components
│       └── utils.js            # SEV color tokens + API base URL
├── reports/
│   └── generator.py            # ReportLab PDF — corporate cover page + findings
├── docker-compose.yml          # Isolated network, health checks, named volumes
├── .env.example                # Environment variable template
└── README.md
```

---

## 🎯 Vulnerability Coverage (OWASP Top 10)

| Vulnerability | Severity | CVSS | CWE | OWASP Category |
|--------------|----------|------|-----|----------------|
| SQL Injection | 🔴 CRITICAL | 9.8 | CWE-89 | A03:2021 — Injection |
| OS Command Injection | 🔴 CRITICAL | 9.8 | CWE-78 | A03:2021 — Injection |
| Directory Traversal (LFI) | 🔴 CRITICAL | 9.1 | CWE-22 | A01:2021 — Broken Access Control |
| Server-Side Request Forgery | 🟠 HIGH | 8.6 | CWE-918 | A10:2021 — SSRF |
| Missing CSRF Protection | 🟠 HIGH | 8.0 | CWE-352 | A01:2021 — Broken Access Control |
| Cross-Site Scripting (XSS) | 🟠 HIGH | 7.2 | CWE-79 | A03:2021 — Injection |
| Open Redirect | 🟡 MEDIUM | 6.1 | CWE-601 | A01:2021 — Broken Access Control |
| Missing Security Headers | 🟡 MEDIUM / 🟢 LOW | 3.1–6.1 | CWE-693 | A05:2021 — Security Misconfiguration |

> **Note:** Findings are classified at the vulnerability class level (CWE/OWASP). CVE numbers are only applicable to specific software versions and are not reported for generic class-level findings.

---

## ⚙️ Installation

### Option A — Docker Compose (Recommended)

The fastest way to get a full production-ready stack running:

```bash
# 1. Clone the project
git clone https://github.com/nizar-0821/pentascope.git
cd pentascope

# 2. (Optional) configure environment
cp .env.example .env
# Edit .env to set PENTASCOPE_API_KEY if you want API key protection

# 3. Build and launch
docker compose up --build -d

# Frontend available at:  http://localhost:3000
# Backend API at:          http://localhost:5000  (internal only, not exposed to host)
```

> **What's included in Docker:** `nmap`, `subfinder` (v2.6.6, multi-arch), all Python deps, React production build served by nginx.

---

### Option B — Manual Setup

#### Prerequisites
- Kali Linux (or any Debian-based OS)
- Python 3.11+ + pip
- Node.js 18+ + npm
- `nmap` → `sudo apt install nmap`
- `subfinder` → `go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest`

#### Setup

```bash
# 1. Clone the project
git clone https://github.com/nizar-0821/pentascope.git
cd pentascope

# 2. Create Python virtual environment
python3 -m venv ~/pentest-env
source ~/pentest-env/bin/activate

# 3. Install Python dependencies
pip install -r backend/requirements.txt

# 4. Install frontend dependencies
cd frontend && npm install
```

---

## ▶️ Usage

### Manual Run (development)

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
| `GET` | `/` | API health check & version |
| `POST` | `/api/recon` | Subdomain enum + port scan |
| `POST` | `/api/scan` | Synchronous vulnerability scan |
| `POST` | `/api/scan/progress` | Start async vulnerability scan → returns `scan_id` |
| `GET` | `/api/scan/status/<id>` | Poll real-time scan progress |
| `GET` | `/api/history?page=1&limit=20` | Paginated scan history (all severities) |
| `GET` | `/api/history/<id>` | Detailed findings for a specific scan |
| `POST` | `/api/report` | Generate & download PDF report |
| `POST` | `/api/export/csv` | Export findings as CSV (with CWE & OWASP columns) |
| `POST` | `/api/export/json` | Export findings as JSON |

### Optional API Key Authentication

Set the `PENTASCOPE_API_KEY` environment variable to enable key-based auth on all protected routes:

```bash
export PENTASCOPE_API_KEY=your-secret-key
# Clients must then include: X-API-Key: your-secret-key
```

---

## 🔒 Security Design

| Control | Implementation |
|---------|---------------|
| **CORS** | Restricted to `ALLOWED_ORIGINS` env variable |
| **Rate Limiting** | 60 req/min via `flask-limiter` (graceful fallback if not installed) |
| **Scope Check** | robots.txt check + private IP detection before every scan |
| **Input Validation** | All targets validated as proper `http/https` URLs |
| **Thread Safety** | SQLite configured with `check_same_thread=False` + scoped sessions |
| **Memory Safety** | In-memory scan state auto-cleaned after 5 minutes |
| **Network Isolation** | Docker: backend not exposed to host — internal `pentascope-net` only |

---

## 📸 Demo Flow

1. **Landing Page** → Animated hero with luxury UI
2. **Initialize Platform** → Transition to dashboard
3. **Recon** → Live port scan results table
4. **Launch Attack** → 10-step real-time progress bar (parallel async scanning)
5. **Assessment Dashboard** → Risk score + Critical/High/Medium/Low counts
6. **Topology Map** → Interactive attack graph
7. **PoC Exploit** → Download ready-to-run Python exploit
8. **PDF Report** → Corporate executive report download
9. **History** → Paginated scan history with all severity levels

---

## 🔄 CI/CD Pipeline

The `.github/workflows/ci.yml` pipeline automatically runs on every push/PR:

| Stage | What it does |
|-------|-------------|
| **Backend** | `flake8` lint on Python 3.11 & 3.12, unit tests (if present) |
| **Frontend** | ESLint + production build on Node 18 & 20, build artifact upload |
| **Docker** | Full `docker compose build` + backend health check smoke test (main branch only) |

---

## 🛡️ Legal Disclaimer

> ⚠️ **This tool is for educational and authorized testing purposes only.**
> Only test systems you own or have **explicit written permission** to test.
> Unauthorized penetration testing is illegal in most jurisdictions.

---

## 👨‍💻 Author

**Nizar Oualidi** — Cybersecurity Training Project 2024/2025

📖 **[Full Technical Documentation →](./PENTASCOPE_FULL_DOCUMENTATION.md)**

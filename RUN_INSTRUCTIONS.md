# 🚀 PentaScope Quick Start Guide

This file contains the exact commands you need to run PentaScope on any new PC after you clone the repository.

## 📥 1. Initial Setup (Run Once on a New PC)

If you just cloned the repository on a new machine, you need to install the dependencies first:

```bash
# Clone the repository
git clone https://github.com/nizar-0821/pentascope.git
cd pentascope

# Install Backend Dependencies
python3 -m venv ~/pentest-env
source ~/pentest-env/bin/activate
pip install -r backend/requirements.txt

# Install Frontend Dependencies (Node.js & npm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.config/nvm" && . "$NVM_DIR/nvm.sh"
nvm install 20
cd frontend && npm install && cd ..
```

---

## ▶️ 2. Running the Application

You will need to open **two separate terminals** to run the backend and the frontend at the same time.

### Terminal 1: Start the Backend (API)
Open a new terminal and run:
```bash
source ~/pentest-env/bin/activate
cd ~/pentascope/backend
python3 app.py
```
*(The backend will start running on http://127.0.0.1:5000)*

### Terminal 2: Start the Frontend (React UI)
Open a second terminal and run:
```bash
export NVM_DIR="$HOME/.config/nvm" && . "$NVM_DIR/nvm.sh"
cd ~/pentascope/frontend
npm start
```
*(The frontend will automatically open in your browser at http://localhost:3000)*

---

## 🎯 3. Running a Test Target (Optional)

If you want to test PentaScope on a vulnerable application locally, you can start DVWA using Docker.

### Terminal 3 (or just run in background)
```bash
# Start Docker service (if not already running)
sudo systemctl start docker

# Run DVWA container
sudo docker run -d -p 8080:80 --name dvwa vulnerables/web-dvwa
```
*(DVWA will be available at http://localhost:8080 - Login with `admin` / `password`)*

---

## 🌐 URLs Overview

Once everything is running, here is where you can access your services:

- **PentaScope Dashboard:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **DVWA Test Target:** http://localhost:8080

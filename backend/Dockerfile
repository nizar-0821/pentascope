FROM python:3.11-slim

WORKDIR /app

# System dependencies:
#   nmap      — port scanning (python-nmap wrapper)
#   curl      — used to download subfinder
#   ca-certs  — TLS verification
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        nmap \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install subfinder (Go binary) from the official GitHub release
# Pinned to v2.6.6 — update the version tag when a new stable release ships
ARG SUBFINDER_VERSION=v2.6.6
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then GOARCH="amd64"; \
    elif [ "$ARCH" = "aarch64" ]; then GOARCH="arm64"; \
    else GOARCH="amd64"; fi && \
    curl -sSfL \
      "https://github.com/projectdiscovery/subfinder/releases/download/${SUBFINDER_VERSION}/subfinder_${SUBFINDER_VERSION#v}_linux_${GOARCH}.zip" \
      -o /tmp/subfinder.zip \
    && apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && unzip /tmp/subfinder.zip subfinder -d /usr/local/bin/ \
    && chmod +x /usr/local/bin/subfinder \
    && rm /tmp/subfinder.zip \
    && apt-get purge -y unzip \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port (documented — actual binding is via FLASK_HOST env)
EXPOSE 5000

CMD ["python", "app.py"]

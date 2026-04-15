#!/bin/bash
# ══════════════════════════════════════════════════════════
# 🏴‍☠️ PiratenQuest — Einmal-Setup auf dem Server
# Danach deployt jeder Git-Push automatisch via Watchtower
# ══════════════════════════════════════════════════════════
set -e
echo "🏴‍☠️ PiratenQuest Setup..."

# 1. GHCR Login — PAT als erstes Argument oder interaktiv
if [ -n "$1" ]; then
  echo "$1" | docker login ghcr.io -u asawall --password-stdin
else
  echo "Docker GHCR Login (GitHub PAT eingeben):"
  docker login ghcr.io -u asawall
fi

# 2. PiratenQuest Container
echo "🐳 PiratenQuest starten..."
docker pull ghcr.io/asawall/piratenquest:latest
docker stop piratenquest 2>/dev/null || true
docker rm piratenquest 2>/dev/null || true
docker run -d \
  --name piratenquest \
  --restart unless-stopped \
  --label com.centurylinklabs.watchtower.enable=true \
  -p 3030:3030 \
  ghcr.io/asawall/piratenquest:latest

# 3. Watchtower — auto-pulls neue Images alle 5 Min
echo "🗼 Watchtower für Auto-Deploy..."
docker stop watchtower 2>/dev/null || true
docker rm watchtower 2>/dev/null || true
docker run -d \
  --name watchtower \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /root/.docker/config.json:/config.json:ro \
  containrrr/watchtower \
  --interval 300 \
  --cleanup \
  --label-enable \
  --include-restarting

# 4. Apache VHost
echo "🌐 Apache VHost..."
if [ -d /etc/httpd/conf.d ]; then
  cat > /etc/httpd/conf.d/pq.vertriebsarchitekt.eu.conf << 'VHOST'
<VirtualHost *:80>
    ServerName pq.vertriebsarchitekt.eu
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3030/
    ProxyPassReverse / http://127.0.0.1:3030/
    ErrorLog /var/log/httpd/pq-error.log
</VirtualHost>
VHOST
  systemctl reload httpd
fi

# 5. SSL
echo "🔒 SSL Zertifikat..."
certbot --apache -d pq.vertriebsarchitekt.eu --non-interactive --agree-tos \
  --email andreas@sawall-partner.de 2>&1 || \
  echo "⚠️  SSL manuell: certbot --apache -d pq.vertriebsarchitekt.eu"

echo ""
echo "═══════════════════════════════════════════"
echo "✅ PiratenQuest LIVE: https://pq.vertriebsarchitekt.eu"
echo "🗼 Watchtower prüft alle 5 Min auf neue Images"
echo "📦 Jeder git push → GitHub Action baut Image → Watchtower deployt"
echo "═══════════════════════════════════════════"
docker ps --filter name=piratenquest --filter name=watchtower --format "  {{.Names}} | {{.Status}} | {{.Ports}}"

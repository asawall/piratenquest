#!/bin/bash
# ══════════════════════════════════════════════════════════
# 🏴‍☠️ PiratenQuest Komplett-Deployment
# Einfach per SSH auf dem Server (46.224.164.200) einfügen
# ══════════════════════════════════════════════════════════
set -e

echo "🏴‍☠️ PiratenQuest Deployment startet..."

# 1. GHCR Login
echo "📦 Docker Login..."
docker login ghcr.io -u asawall

# 2. Pull Image
echo "🐳 Image ziehen..."
docker pull ghcr.io/asawall/piratenquest:latest

# 3. Container (re)starten
echo "🚀 Container starten..."
docker stop piratenquest 2>/dev/null || true
docker rm piratenquest 2>/dev/null || true
docker run -d \
  --name piratenquest \
  --restart unless-stopped \
  -p 3030:3030 \
  ghcr.io/asawall/piratenquest:latest

# 4. Apache VHost
echo "🌐 Apache VHost..."
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

# 5. SSL
echo "🔒 SSL..."
certbot --apache -d pq.vertriebsarchitekt.eu --non-interactive --agree-tos --email andreas@sawall-partner.de 2>&1 || echo "⚠️ SSL manuell: certbot --apache -d pq.vertriebsarchitekt.eu"

# 6. SSH Deploy Key für GitHub Actions
echo "🔑 Deploy Key für Auto-Deploy..."
if [ ! -f /root/.ssh/pq_deploy ]; then
  ssh-keygen -t ed25519 -f /root/.ssh/pq_deploy -N "" -q
  cat /root/.ssh/pq_deploy.pub >> /root/.ssh/authorized_keys
  echo ""
  echo "═══════════════════════════════════════════"
  echo "📋 DIESEN PRIVATE KEY als GitHub Secret SERVER_SSH_KEY hinterlegen:"
  echo "   https://github.com/asawall/piratenquest/settings/secrets/actions/new"
  echo "═══════════════════════════════════════════"
  cat /root/.ssh/pq_deploy
  echo "═══════════════════════════════════════════"
fi

echo ""
echo "✅ Container Status:"
docker ps --filter name=piratenquest --format "  {{.Names}} | {{.Status}} | {{.Ports}}"
echo ""
echo "🏴‍☠️ PiratenQuest live auf: https://pq.vertriebsarchitekt.eu"

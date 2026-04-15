#!/bin/bash
# ══════════════════════════════════════════════════════════
# 🏴‍☠️ PiratenQuest Server Setup
# Einmalig auf dem Server (46.224.164.200) ausführen
# ══════════════════════════════════════════════════════════

set -e
echo "🏴‍☠️ PiratenQuest Server Setup startet..."

# 1. GHCR Login
echo "📦 GHCR Login..."
echo "$GHCR_TOKEN" | docker login ghcr.io -u asawall --password-stdin
# Setze GHCR_TOKEN als Umgebungsvariable vor dem Ausführen:
# export GHCR_TOKEN="dein-github-pat" && bash setup-server.sh

# 2. Pull & Run Container
echo "🐳 Docker Container starten..."
docker pull ghcr.io/asawall/piratenquest:latest
docker stop piratenquest 2>/dev/null || true
docker rm piratenquest 2>/dev/null || true
docker run -d \
  --name piratenquest \
  --restart unless-stopped \
  -p 3030:3030 \
  ghcr.io/asawall/piratenquest:latest

# 3. Apache VHost
echo "🌐 Apache VHost einrichten..."
if [ -d /etc/httpd/conf.d ]; then
  CONF="/etc/httpd/conf.d/pq.vertriebsarchitekt.eu.conf"
  cat > "$CONF" << 'APACHEEOF'
<VirtualHost *:80>
    ServerName pq.vertriebsarchitekt.eu
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3030/
    ProxyPassReverse / http://127.0.0.1:3030/
    ErrorLog /var/log/httpd/pq-error.log
    CustomLog /var/log/httpd/pq-access.log combined
</VirtualHost>
APACHEEOF
  # Enable proxy modules if needed
  httpd -M 2>/dev/null | grep -q proxy_http || echo "LoadModule proxy_http_module modules/mod_proxy_http.so" >> /etc/httpd/conf.modules.d/00-proxy.conf 2>/dev/null || true
  systemctl reload httpd
  echo "✅ Apache VHost aktiv"
elif [ -d /etc/apache2/sites-available ]; then
  CONF="/etc/apache2/sites-available/pq.vertriebsarchitekt.eu.conf"
  cat > "$CONF" << 'APACHEEOF'
<VirtualHost *:80>
    ServerName pq.vertriebsarchitekt.eu
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3030/
    ProxyPassReverse / http://127.0.0.1:3030/
    ErrorLog ${APACHE_LOG_DIR}/pq-error.log
    CustomLog ${APACHE_LOG_DIR}/pq-access.log combined
</VirtualHost>
APACHEEOF
  a2enmod proxy proxy_http 2>/dev/null || true
  a2ensite pq.vertriebsarchitekt.eu 2>/dev/null || true
  systemctl reload apache2
  echo "✅ Apache VHost aktiv"
fi

# 4. SSL mit Certbot
echo "🔒 SSL Zertifikat anfordern..."
if command -v certbot &>/dev/null; then
  certbot --apache -d pq.vertriebsarchitekt.eu --non-interactive --agree-tos --email andreas@sawall-partner.de 2>&1 || echo "⚠️  Certbot fehlgeschlagen - manuell nachholen: certbot --apache -d pq.vertriebsarchitekt.eu"
else
  echo "⚠️  Certbot nicht installiert. Installieren mit: yum install certbot python3-certbot-apache"
fi

# 5. SSH Key für GitHub Actions (optional)
echo ""
echo "═══════════════════════════════════════════"
echo "📋 Für automatisches Deployment via GitHub Actions:"
echo "   1. SSH Key generieren: ssh-keygen -t ed25519 -f /root/.ssh/piratenquest_deploy -N ''"
echo "   2. Public Key autorisieren: cat /root/.ssh/piratenquest_deploy.pub >> /root/.ssh/authorized_keys"
echo "   3. Private Key als GitHub Secret 'SERVER_SSH_KEY' hinterlegen:"
echo "      cat /root/.ssh/piratenquest_deploy"
echo "   4. GHCR Token als GitHub Secret 'GHCR_TOKEN' hinterlegen (dein GitHub PAT)"
echo "═══════════════════════════════════════════"

echo ""
echo "✅ PiratenQuest ist bereit auf: http://pq.vertriebsarchitekt.eu"
echo "🐳 Container Status:"
docker ps --filter name=piratenquest --format "  {{.Names}} | {{.Status}} | {{.Ports}}"

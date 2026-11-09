#!/usr/bin/env bash
#
# 安装/更新宿主机 Nginx 配置，签发证书并配置自动续期。
# 仅负责宿主机 Nginx + Certbot；应用容器由 deploy/install.sh 启动。
#
# 用法：
#   sudo DOMAIN=www.zhonghui.com ADMIN_DOMAIN=admin.zhonghui.com EMAIL=ops@example.com \
#     ./setup-host-nginx.sh
#
# 可选：
#   NGINX_CONF=/etc/nginx/conf.d/zhonghui.conf
#   WEBROOT=/var/www/certbot
#   CERT_NAME=www.zhonghui.com

set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "请使用 sudo 运行：sudo ./setup-host-nginx.sh" >&2
  exit 1
fi

DOMAIN="${DOMAIN:-www.zhonghui.com}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.zhonghui.com}"
BARE_DOMAIN="${BARE_DOMAIN:-${DOMAIN#www.}}"
EMAIL="${EMAIL:-}"
NGINX_CONF="${NGINX_CONF:-/etc/nginx/conf.d/zhonghui.conf}"
WEBROOT="${WEBROOT:-/var/www/certbot}"
CERT_NAME="${CERT_NAME:-$DOMAIN}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/nginx/host-zhonghui.conf"

if [[ -z "$EMAIL" ]]; then
  echo "缺少 EMAIL，例如：sudo EMAIL=ops@example.com ./setup-host-nginx.sh" >&2
  exit 1
fi
if ! command -v nginx >/dev/null 2>&1; then
  echo "未检测到 nginx，请先安装宿主机 Nginx。" >&2
  exit 1
fi
if [[ ! -f "$TEMPLATE" ]]; then
  echo "缺少模板：$TEMPLATE" >&2
  exit 1
fi
if ! command -v certbot >/dev/null 2>&1; then
  echo "安装 certbot…"
  apt-get update
  apt-get install -y certbot
fi

mkdir -p "$WEBROOT" "$(dirname "$NGINX_CONF")"
if [[ -f "$NGINX_CONF" ]]; then
  cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%Y%m%d%H%M%S)"
fi

reload_nginx() {
  nginx -t
  systemctl reload nginx
}

# 1. 首次签发前先放一个仅 HTTP 的临时配置，让 ACME challenge 可访问。
if [[ ! -f "/etc/letsencrypt/live/${CERT_NAME}/fullchain.pem" ]]; then
  cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${ADMIN_DOMAIN};

    location ^~ /.well-known/acme-challenge/ {
        root ${WEBROOT};
        default_type text/plain;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF
  reload_nginx
  echo "申请证书：${DOMAIN} / ${ADMIN_DOMAIN}"
  certbot certonly --webroot -w "$WEBROOT" \
    -d "$DOMAIN" -d "$ADMIN_DOMAIN" \
    --cert-name "$CERT_NAME" \
    --email "$EMAIL" --agree-tos --no-eff-email --non-interactive --expand
fi

# 2. 安装最终 HTTPS + 反向代理配置。
sed \
  -e "s#www\.zhonghui\.com#${DOMAIN}#g" \
  -e "s#admin\.zhonghui\.com#${ADMIN_DOMAIN}#g" \
  -e "s#zhonghui\.com#${BARE_DOMAIN}#g" \
  "$TEMPLATE" > "$NGINX_CONF"

# 如果证书名不是域名，修正证书路径。
if [[ "$CERT_NAME" != "$DOMAIN" ]]; then
  sed -i "s#/etc/letsencrypt/live/${DOMAIN}/#/etc/letsencrypt/live/${CERT_NAME}/#g" "$NGINX_CONF"
fi

reload_nginx

# 3. 证书续期后自动 reload Nginx。
HOOK_DIR="/etc/letsencrypt/renewal-hooks/deploy"
mkdir -p "$HOOK_DIR"
cat > "${HOOK_DIR}/30-zhonghui-reload-nginx.sh" <<'EOF'
#!/bin/sh
nginx -t && systemctl reload nginx
EOF
chmod +x "${HOOK_DIR}/30-zhonghui-reload-nginx.sh"

# 4. 启用 certbot 定时器（Debian/Ubuntu 安装 certbot 时通常自带）。
if systemctl list-unit-files | grep -q '^certbot.timer'; then
  systemctl enable --now certbot.timer
  echo "certbot.timer 已启用（自动续期）。"
else
  echo "未发现 certbot.timer，请确认系统已有 certbot 定时任务（cron/systemd）。"
fi

echo
echo "宿主机 Nginx 配置完成："
echo "  https://${DOMAIN}       -> 127.0.0.1:8080"
echo "  https://${ADMIN_DOMAIN} -> 127.0.0.1:8080"
echo "证书续期检查：sudo certbot renew --dry-run"

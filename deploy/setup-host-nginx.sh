#!/usr/bin/env bash
#
# 安装/更新宿主机 Nginx 配置，签发证书并配置自动续期。
# 仅负责宿主机 Nginx + Certbot；应用容器由 deploy/install.sh 启动。
#
# 域名来自 deploy/.env（也可用环境变量覆盖）：
#   SITE_DOMAIN=new.chinaaupairs.com
#   ADMIN_DOMAIN=admin.chinaaupairs.com
#   EMAIL=ops@example.com
#
# 用法：
#   sudo ./setup-host-nginx.sh
#   sudo SITE_DOMAIN=... ADMIN_DOMAIN=... EMAIL=... ./setup-host-nginx.sh
#
# 可选：
#   CERT_NAME（默认等于 SITE_DOMAIN）
#   NGINX_CONF（默认 /etc/nginx/conf.d/zhonghui-cms.conf）
#   WEBROOT（默认 /var/www/certbot）

set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "请使用 sudo 运行：sudo ./setup-host-nginx.sh" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "$SCRIPT_DIR/.env"
  set +a
fi

SITE_DOMAIN="${SITE_DOMAIN:-${DOMAIN:-new.chinaaupairs.com}}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.chinaaupairs.com}"
EMAIL="${EMAIL:-${ACME_EMAIL:-}}"
CERT_NAME="${CERT_NAME:-$SITE_DOMAIN}"
NGINX_CONF="${NGINX_CONF:-/etc/nginx/conf.d/zhonghui-cms.conf}"
WEBROOT="${WEBROOT:-/var/www/certbot}"
TEMPLATE="$SCRIPT_DIR/nginx/host-zhonghui.conf"
CERT_FILE="/etc/letsencrypt/live/${CERT_NAME}/fullchain.pem"

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
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update
    apt-get install -y certbot
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y epel-release certbot
  elif command -v yum >/dev/null 2>&1; then
    yum install -y epel-release certbot
  else
    echo "无法自动安装 certbot，请手动安装后重试。" >&2
    exit 1
  fi
fi

if [[ ! -f "$CERT_FILE" && -z "$EMAIL" ]]; then
  echo "首次申请证书需要 EMAIL，例如：sudo EMAIL=ops@example.com ./setup-host-nginx.sh" >&2
  exit 1
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
if [[ ! -f "$CERT_FILE" ]]; then
  cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${SITE_DOMAIN} ${ADMIN_DOMAIN};

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
  echo "申请证书：${SITE_DOMAIN} / ${ADMIN_DOMAIN}"
  certbot certonly --webroot -w "$WEBROOT" \
    -d "$SITE_DOMAIN" -d "$ADMIN_DOMAIN" \
    --cert-name "$CERT_NAME" \
    --email "$EMAIL" --agree-tos --no-eff-email --non-interactive --expand
fi

# 2. 安装最终 HTTPS + 反向代理配置。
sed \
  -e "s#__SITE_DOMAIN__#${SITE_DOMAIN}#g" \
  -e "s#__ADMIN_DOMAIN__#${ADMIN_DOMAIN}#g" \
  -e "s#__CERT_NAME__#${CERT_NAME}#g" \
  "$TEMPLATE" > "$NGINX_CONF"

reload_nginx

# 3. 证书续期后自动 reload Nginx。
HOOK_DIR="/etc/letsencrypt/renewal-hooks/deploy"
mkdir -p "$HOOK_DIR"
cat > "${HOOK_DIR}/30-zhonghui-reload-nginx.sh" <<'EOF'
#!/bin/sh
nginx -t && systemctl reload nginx
EOF
chmod +x "${HOOK_DIR}/30-zhonghui-reload-nginx.sh"

# 4. 自动续期：已有 cron 就复用；没有 systemd timer 时补一条 cron。
if crontab -l 2>/dev/null | grep -q 'certbot renew'; then
  echo "已有 certbot renew cron，沿用现有自动续期。"
elif systemctl list-unit-files 2>/dev/null | grep -q '^certbot.timer'; then
  systemctl enable --now certbot.timer
  echo "certbot.timer 已启用（自动续期）。"
else
  { crontab -l 2>/dev/null || true; echo "0 3 * * * /usr/bin/certbot renew --quiet && /usr/sbin/nginx -s reload"; } | crontab -
  echo "已添加 root cron：每天 03:00 检查证书续期。"
fi

echo
echo "宿主机 Nginx 配置完成："
echo "  前端：https://${SITE_DOMAIN}       -> 127.0.0.1:8080"
echo "  后台：https://${ADMIN_DOMAIN} -> 127.0.0.1:3010"
echo "证书：/etc/letsencrypt/live/${CERT_NAME}/"
echo "检查续期：sudo certbot renew --dry-run"

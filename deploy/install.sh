#!/usr/bin/env bash
#
# 中惠官网容器部署脚本
#
# 用法（在 deploy/ 目录）：
#   sudo ./install.sh                 # Docker 已安装
#   sudo ./install.sh --install-docker   # CentOS/RHEL 使用阿里云镜像
#   sudo ./install.sh --skip-seed     # 数据库已有数据时
#
# 宿主机 Nginx / 证书请另外执行：
#   sudo DOMAIN=www.beijingzhonghui.com ADMIN_DOMAIN=admin.beijingzhonghui.com EMAIL=ops@example.com \
#     ./setup-host-nginx.sh

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

INSTALL_DOCKER=0
SKIP_SEED=0
for arg in "$@"; do
  case "$arg" in
    --install-docker) INSTALL_DOCKER=1 ;;
    --skip-seed) SKIP_SEED=1 ;;
    *)
      echo "未知参数：$arg" >&2
      exit 1
      ;;
  esac
done

install_docker_centos() {
  local pm
  if command -v dnf >/dev/null 2>&1; then
    pm=dnf
    "$pm" install -y dnf-plugins-core
  else
    pm=yum
    "$pm" install -y yum-utils
  fi

  local repo=/etc/yum.repos.d/docker-ce.repo
  if [[ -f "$repo" ]]; then
    cp "$repo" "${repo}.bak.$(date +%Y%m%d%H%M%S)"
  fi
  rm -f "$repo"

  if [[ "$pm" == dnf ]]; then
    dnf config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
  else
    yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
  fi
  sed -i 's|download.docker.com|mirrors.aliyun.com/docker-ce|g' "$repo"

  rpm --import https://mirrors.aliyun.com/docker-ce/linux/centos/gpg \
    || rpm --import https://download.docker.com/linux/centos/gpg

  "$pm" clean all
  "$pm" makecache

  echo "安装 Docker CE / Compose 插件…"
  if ! "$pm" install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin; then
    echo "docker-buildx-plugin 安装失败，改为安装最小集合…" >&2
    "$pm" install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  fi
  systemctl enable --now docker
}

install_docker() {
  if command -v yum >/dev/null 2>&1 || command -v dnf >/dev/null 2>&1; then
    echo "检测到 CentOS/RHEL，使用阿里云 Docker CE 镜像安装…"
    install_docker_centos
  else
    echo "使用 Docker 官方脚本安装…"
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
  fi
}

if [[ "$INSTALL_DOCKER" -eq 1 ]]; then
  if [[ "${EUID}" -ne 0 ]]; then
    echo "安装 Docker 需要 root，请用 sudo 运行。" >&2
    exit 1
  fi
  install_docker
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "未检测到 Docker。请使用 --install-docker，或先按官方文档安装 Docker Engine + Compose 插件。" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "未检测到 docker compose 插件，请先安装 Docker Compose v2。" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "生成 .env…"
  PAYLOAD_SECRET="$(openssl rand -hex 32)"
  POSTGRES_PASSWORD="$(openssl rand -hex 16)"
  cat > .env <<EOF
PAYLOAD_SECRET=${PAYLOAD_SECRET}
POSTGRES_USER=zhonghui
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=zhonghui_cms
NEXT_PUBLIC_SITE_URL=https://www.beijingzhonghui.com
EOF
  chmod 600 .env
  echo "已生成 deploy/.env（请妥善保存）。"
else
  echo "使用已有 deploy/.env。"
fi

POSTGRES_USER="$(grep '^POSTGRES_USER=' .env | cut -d= -f2- || true)"
POSTGRES_DB="$(grep '^POSTGRES_DB=' .env | cut -d= -f2- || true)"
POSTGRES_USER="${POSTGRES_USER:-zhonghui}"
POSTGRES_DB="${POSTGRES_DB:-zhonghui_cms}"
SITE_URL="$(grep '^NEXT_PUBLIC_SITE_URL=' .env | cut -d= -f2- || true)"

echo "构建镜像…"
docker compose build

echo "启动 PostgreSQL…"
docker compose up -d postgres

for i in $(seq 1 40); do
  if docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi
  if [[ "$i" -eq 40 ]]; then
    echo "PostgreSQL 启动超时。" >&2
    exit 1
  fi
  sleep 2
done

if [[ "$SKIP_SEED" -eq 0 ]]; then
  echo "导入初始化数据并生成静态站…"
  docker compose run --rm --no-deps cms npm run seed:init
else
  echo "跳过 seed，直接启动。"
fi

echo "启动 CMS / builder / nginx…"
docker compose up -d

echo
echo "容器已启动："
echo "  宿主机 Nginx 应代理到：http://127.0.0.1:8080"
echo "  后台默认地址：https://admin.beijingzhonghui.com/admin"
echo
echo "如果还没有配置宿主机 Nginx / HTTPS，请执行："
echo "  sudo DOMAIN=www.beijingzhonghui.com ADMIN_DOMAIN=admin.beijingzhonghui.com EMAIL=你的邮箱 \\"
echo "    ./setup-host-nginx.sh"
echo
echo "首次打开后台时创建管理员账号。站点地址：${SITE_URL:-https://www.beijingzhonghui.com}"

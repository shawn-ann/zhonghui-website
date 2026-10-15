#!/usr/bin/env bash
#
# 中惠 CMS 本地启动脚本
#
# 用法:
#   ./scripts/start.sh            # 启动后台开发服务器（默认 dev）
#   ./scripts/start.sh dev        # 同上
#   ./scripts/start.sh preview    # 生成静态站点并在 8331 端口预览
#   ./scripts/start.sh stop       # 停止 dev / preview 服务
#
set -euo pipefail

CMS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$CMS_DIR"

CONTAINER="zhonghui-postgres"
PG_USER="zhonghui"
PG_PASS="zhonghui_pw"
PG_DB="zhonghui_cms"
PG_PORT="5432"
PREVIEW_PORT="8331"
MODE="${1:-dev}"

log() { printf '\033[36m[cms]\033[0m %s\n' "$*"; }
err() { printf '\033[31m[cms]\033[0m %s\n' "$*" >&2; }

ensure_docker() {
  docker info >/dev/null 2>&1 && return
  log "Docker 未运行，尝试启动..."
  if command -v open >/dev/null 2>&1; then open -a Docker >/dev/null 2>&1 || true; fi
  for _ in $(seq 1 60); do
    docker info >/dev/null 2>&1 && { log "Docker 就绪"; return; }
    sleep 2
  done
  err "Docker 守护进程未就绪，请手动启动 Docker Desktop 后重试"
  exit 1
}

ensure_postgres() {
  ensure_docker
  if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    log "PostgreSQL 容器已在运行"
  elif docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    log "启动已有容器 $CONTAINER"
    docker start "$CONTAINER" >/dev/null
  else
    log "创建并启动 PostgreSQL 容器 $CONTAINER"
    docker run -d --name "$CONTAINER" \
      -e POSTGRES_USER="$PG_USER" \
      -e POSTGRES_PASSWORD="$PG_PASS" \
      -e POSTGRES_DB="$PG_DB" \
      -p "${PG_PORT}:5432" postgres:16 >/dev/null
  fi
  log "等待 PostgreSQL 就绪..."
  for _ in $(seq 1 60); do
    docker exec "$CONTAINER" pg_isready -U "$PG_USER" >/dev/null 2>&1 && { log "PostgreSQL 就绪"; return; }
    sleep 2
  done
  err "PostgreSQL 未在预期时间内就绪"
  exit 1
}

ensure_env() {
  if [ ! -f .env ]; then
    log "未找到 .env，从 .env.example 复制"
    cp .env.example .env
  fi
}

ensure_deps() {
  if [ ! -d node_modules ]; then
    log "安装依赖（npm install）"
    npm install
  fi
}

case "$MODE" in
  dev)
    ensure_postgres
    ensure_env
    ensure_deps
    log "启动后台开发服务器 → http://localhost:3000/admin"
    exec npm run dev
    ;;
  preview)
    ensure_postgres
    ensure_env
    ensure_deps
    log "生成静态站点（npm run generate）"
    npm run generate
    log "静态预览 → http://127.0.0.1:${PREVIEW_PORT}/  （Ctrl+C 停止）"
    cd dist
    exec python3 -m http.server "$PREVIEW_PORT" --bind 127.0.0.1
    ;;
  stop)
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "http.server ${PREVIEW_PORT}" 2>/dev/null || true
    log "已停止 dev / preview 服务"
    log "PostgreSQL 容器仍在运行；如需停止：docker stop ${CONTAINER}"
    ;;
  *)
    err "未知模式: ${MODE}（可用: dev | preview | stop）"
    exit 1
    ;;
esac

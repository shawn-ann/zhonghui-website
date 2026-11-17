#!/usr/bin/env bash
#
# 完整恢复：PostgreSQL + 媒体文件（可选恢复 deploy/.env）
#
# 用法：
#   sudo ./restore.sh --latest
#   sudo ./restore.sh /var/backups/zhonghui/zhonghui-20261117-193000.tar.gz
#   sudo ./restore.sh --latest --yes
#   sudo ./restore.sh --latest --restore-env
#
# 选项：
#   --latest        使用 BACKUP_DIR 下最新的备份
#   --yes           跳过确认
#   --restore-env   用备份中的 env 覆盖当前 deploy/.env（会先备份当前 env）
#   --no-rebuild    不自动重新生成静态站
#
# 说明：
#   恢复数据库前会停止 cms 和 builder。
#   如果恢复的是不同服务器，建议先确保 deploy/.env 中的
#   POSTGRES_USER / POSTGRES_DB / POSTGRES_PASSWORD 与备份来源一致，
#   或在初始化数据库前先恢复 env。

set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/zhonghui}"
TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE=""
YES=0
RESTORE_ENV=0
REBUILD=1
TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

usage() {
  sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --latest) BACKUP_FILE="latest" ;;
    --yes|-y) YES=1 ;;
    --restore-env) RESTORE_ENV=1 ;;
    --no-rebuild) REBUILD=0 ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "未知参数：$1" >&2; usage >&2; exit 2 ;;
    *) BACKUP_FILE="$1" ;;
  esac
  shift
done

if ! docker compose version >/dev/null 2>&1; then
  echo "未找到 docker compose 插件。" >&2
  exit 1
fi
if [[ ! -f .env ]]; then
  echo "缺少 deploy/.env，请先按 README 完成初始化。" >&2
  exit 1
fi

if [[ -z "$BACKUP_FILE" || "$BACKUP_FILE" == "latest" ]]; then
  BACKUP_FILE="$(ls -1t "${BACKUP_DIR}"/zhonghui-*.tar.gz 2>/dev/null | head -n 1 || true)"
fi
if [[ -z "$BACKUP_FILE" || ! -f "$BACKUP_FILE" ]]; then
  echo "未找到备份文件。用法：" >&2
  echo "  sudo ./restore.sh /path/to/zhonghui-YYYYmmdd-HHMMSS.tar.gz" >&2
  echo "  sudo ./restore.sh --latest" >&2
  exit 1
fi

echo "准备从备份恢复：$BACKUP_FILE"
tar xzf "$BACKUP_FILE" -C "$TMP_DIR"
for f in db.dump media.tgz env; do
  if [[ ! -f "$TMP_DIR/$f" ]]; then
    echo "备份文件缺少 $f，停止恢复。" >&2
    exit 1
  fi
done

if [[ "$YES" -ne 1 ]]; then
  echo
  echo "警告：这会覆盖当前数据库和媒体文件。"
  read -r -p "输入 restore 确认继续：" answer
  if [[ "$answer" != "restore" ]]; then
    echo "已取消。"
    exit 1
  fi
fi

# shellcheck disable=SC1091
set -a; . ./.env; set +a
DB_USER="${POSTGRES_USER:-zhonghui}"
DB_NAME="${POSTGRES_DB:-zhonghui_cms}"

if [[ -z "$(docker compose ps -q postgres 2>/dev/null)" ]]; then
  echo "postgres 容器未运行，请先启动应用。" >&2
  exit 1
fi

echo "停止 CMS / builder…"
docker compose stop cms builder

echo "恢复数据库：${DB_USER}@${DB_NAME}"
docker compose exec -T postgres pg_restore \
  -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner \
  < "${TMP_DIR}/db.dump"

echo "恢复媒体文件…"
docker compose run --rm --no-deps cms \
  sh -c 'tar xzf - -C /app/media' < "${TMP_DIR}/media.tgz"

if [[ "$RESTORE_ENV" -eq 1 ]]; then
  echo "恢复 deploy/.env（原文件已备份）…"
  cp .env ".env.bak.${TS}"
  cp "${TMP_DIR}/env" .env
  chmod 600 .env
else
  echo "保留当前 deploy/.env。"
  echo "备份中的 env 已解压到临时目录，恢复完成后会删除。"
  echo "如需覆盖，使用：--restore-env"
fi

echo "启动 CMS / builder…"
docker compose up -d cms builder

if [[ "$REBUILD" -eq 1 ]]; then
  echo "重新生成静态站…"
  if ! docker compose run --rm --no-deps cms npm run generate; then
    echo "自动生成失败。请在后台页面列表点击「重建站点」，或查看 cms 日志。" >&2
  fi
fi

echo
echo "恢复完成。"
docker compose ps

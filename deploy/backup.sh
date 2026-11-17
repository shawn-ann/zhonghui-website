#!/usr/bin/env bash
#
# 完整备份：PostgreSQL + 媒体文件 + deploy/.env
#
# 用法：
#   sudo ./backup.sh
#   sudo BACKUP_DIR=/data/backups KEEP=14 ./backup.sh
#
# 输出：
#   /var/backups/zhonghui/zhonghui-YYYYmmdd-HHMMSS.tar.gz
#
# 备份文件内包含：
#   db.dump     PostgreSQL 自定义格式备份
#   media.tgz   cms-media 媒体卷
#   env         deploy/.env
#   manifest.txt

set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/zhonghui}"
KEEP="${KEEP:-7}"
TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/zhonghui-${TS}.tar.gz"
TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "未找到 docker compose 插件。" >&2
  exit 1
fi
if [[ ! -f .env ]]; then
  echo "缺少 deploy/.env，无法确定数据库账号。" >&2
  exit 1
fi
if ! mkdir -p "$BACKUP_DIR" 2>/dev/null; then
  echo "无法创建备份目录：$BACKUP_DIR" >&2
  echo "可指定其它目录：sudo BACKUP_DIR=/data/backups ./backup.sh" >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a; . ./.env; set +a
DB_USER="${POSTGRES_USER:-zhonghui}"
DB_NAME="${POSTGRES_DB:-zhonghui_cms}"

if [[ -z "$(docker compose ps -q postgres 2>/dev/null)" ]]; then
  echo "postgres 容器未运行，请先启动应用。" >&2
  exit 1
fi

echo "备份数据库：${DB_USER}@${DB_NAME}"
docker compose exec -T postgres pg_dump \
  -U "$DB_USER" -d "$DB_NAME" -Fc > "${TMP_DIR}/db.dump"

echo "备份媒体文件…"
docker compose run --rm --no-deps cms \
  sh -c 'tar czf - -C /app/media .' > "${TMP_DIR}/media.tgz"

echo "复制环境变量…"
cp .env "${TMP_DIR}/env"

{
  echo "createdAt=$(date -Iseconds)"
  echo "postgresUser=${DB_USER}"
  echo "postgresDb=${DB_NAME}"
  if git -C "$SCRIPT_DIR/.." rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "gitCommit=$(git -C "$SCRIPT_DIR/.." rev-parse --short HEAD)"
  fi
} > "${TMP_DIR}/manifest.txt"

tar czf "$BACKUP_FILE" -C "$TMP_DIR" .
chmod 600 "$BACKUP_FILE"

echo "清理旧备份（保留 ${KEEP} 份）…"
ls -1t "${BACKUP_DIR}"/zhonghui-*.tar.gz 2>/dev/null \
  | tail -n +$((KEEP + 1)) \
  | xargs -r rm -f

echo
echo "备份完成：$BACKUP_FILE"
du -h "$BACKUP_FILE" | awk '{print "文件大小：" $1}'

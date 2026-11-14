#!/usr/bin/env bash
#
# 拉取最新代码并更新生产容器。
#
# 用法（在 deploy/ 目录）：
#   sudo ./update.sh              # 有新提交时更新
#   sudo ./update.sh --force      # 代码没变化也重新构建、重启
#
# 可用环境变量：
#   REMOTE=origin
#   BRANCH=main
#   LOCK_FILE=/tmp/zhonghui-update.lock

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-main}"
LOCK_FILE="${LOCK_FILE:-/tmp/zhonghui-update.lock}"
FORCE=0

for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    *)
      echo "未知参数：$arg" >&2
      echo "用法：$0 [--force]" >&2
      exit 2
      ;;
  esac
done

if ! command -v git >/dev/null 2>&1; then
  echo "未找到 git，请先安装。" >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "未找到 docker compose 插件，请先安装 Docker Compose v2。" >&2
  exit 1
fi

# 防止 cron 和手工执行同时更新。
exec 9>"$LOCK_FILE"
if command -v flock >/dev/null 2>&1; then
  if ! flock -n 9; then
    echo "另一个更新任务正在运行，本次跳过。" >&2
    exit 1
  fi
fi

cd "$REPO_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "不是 git 仓库：$REPO_DIR" >&2
  exit 1
fi

# 只检查已跟踪文件的修改；未跟踪文件不阻塞更新。
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "工作区有未提交的修改，停止更新：" >&2
  git status --short --untracked-files=no >&2
  echo "请先提交、还原或 stash 后再执行。" >&2
  exit 1
fi

echo "拉取 ${REMOTE}/${BRANCH}…"
export GIT_TERMINAL_PROMPT=0
git fetch "$REMOTE" "$BRANCH"

LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse "${REMOTE}/${BRANCH}")"

if [[ "$LOCAL_SHA" == "$REMOTE_SHA" && "$FORCE" -eq 0 ]]; then
  echo "已是最新版本：${LOCAL_SHA:0:7}"
  exit 0
fi

if [[ "$LOCAL_SHA" != "$REMOTE_SHA" ]]; then
  if ! git merge-base --is-ancestor "$LOCAL_SHA" "$REMOTE_SHA"; then
    echo "本地分支不是远程的直接祖先，停止更新。" >&2
    echo "服务器上可能有本地提交或分支已分叉，请先处理：" >&2
    git log --oneline --decorate -5 >&2
    exit 1
  fi
  echo "更新代码：${LOCAL_SHA:0:7} → ${REMOTE_SHA:0:7}"
  git merge --ff-only "${REMOTE}/${BRANCH}"
else
  echo "代码未变化，使用 --force 重新构建。"
fi

cd "$SCRIPT_DIR"

if [[ ! -f .env ]]; then
  echo "缺少 deploy/.env，请先按 README 配置。" >&2
  exit 1
fi

echo "构建 CMS 镜像…"
docker compose build cms

echo "重启 CMS / builder…"
docker compose up -d cms builder

echo "等待 CMS 启动…"
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:3010/admin 2>/dev/null; then
    echo "CMS 已可访问。"
    break
  fi
  sleep 2
done

if ! curl -fsS -o /dev/null http://127.0.0.1:3010/admin 2>/dev/null; then
  echo "CMS 启动检查失败，请查看日志：" >&2
  echo "  cd $SCRIPT_DIR && docker compose logs --tail=100 cms" >&2
  exit 1
fi

echo "更新完成：$(git -C "$REPO_DIR" rev-parse --short HEAD)"
docker compose ps

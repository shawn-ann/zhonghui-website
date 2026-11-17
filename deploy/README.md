# 部署说明（同一台服务器）

完整文档见 [`docs/deployment.md`](../docs/deployment.md)。

## 结构

```text
用户
  ↓ 80 / 443（宿主机 Nginx，负责域名和证书）
宿主机 Nginx
  ├─ new.chinaaupairs.com   → 127.0.0.1:8080  容器内静态站
  └─ admin.chinaaupairs.com → 127.0.0.1:3010  CMS 后台

Docker Compose：
  postgres / builder / cms / nginx
```

- 容器内 Nginx 不再包含任何域名，只做静态站默认 server；
- 宿主机 Nginx 负责域名、TLS、证书续期；
- 后台直接代理到 CMS 的 `127.0.0.1:3010`；
- 域名全部来自 `deploy/.env`，换域名只需改 env 并重新签发证书。

## 域名配置

`deploy/.env`：

```env
SITE_DOMAIN=new.chinaaupairs.com
ADMIN_DOMAIN=admin.chinaaupairs.com

NEXT_PUBLIC_SITE_URL=https://new.chinaaupairs.com
```

- `SITE_DOMAIN`：前端域名
- `ADMIN_DOMAIN`：后台域名
- `NEXT_PUBLIC_SITE_URL`：后台「查看网站」链接

## 首次部署

```bash
cd deploy
cp .env.example .env
# 修改 .env 中的 SITE_DOMAIN / ADMIN_DOMAIN / NEXT_PUBLIC_SITE_URL

# 1. 配置宿主机 Nginx + 申请证书 + 自动续期
#    域名从 .env 读取，首次需要 EMAIL
sudo EMAIL=ops@example.com ./setup-host-nginx.sh

# 2. 启动应用容器、导入初始化数据、生成静态站
#    Docker 已按 docs/deployment.md 安装好，不需要 --install-docker
sudo ./install.sh
```

`install.sh` 会：

- 按需安装 Docker（`--install-docker`）；
- 首次运行生成 `deploy/.env`；
- 构建镜像；
- 启动 PostgreSQL；
- 执行 `seed:init` 导入页面、文章、媒体、菜单和站点设置；
- 启动 CMS / builder / 容器内 Nginx。

首次打开 `https://admin.chinaaupairs.com/admin` 创建管理员账号。

已有数据库时不要重复导入：

```bash
sudo ./install.sh --skip-seed
```

## 更换域名

只修改 `deploy/.env`：

```env
SITE_DOMAIN=新前端域名
ADMIN_DOMAIN=新后台域名
NEXT_PUBLIC_SITE_URL=https://新前端域名
```

然后：

```bash
sudo EMAIL=ops@example.com ./setup-host-nginx.sh
sudo docker compose build cms
sudo docker compose up -d cms
```

`setup-host-nginx.sh` 会按新域名重新生成宿主机配置并申请证书；容器 Nginx 不需要改。

## 证书自动续期

脚本会：

- 用 webroot 方式签发 `SITE_DOMAIN` + `ADMIN_DOMAIN` 证书；
- 安装续期后 reload Nginx 的 hook；
- 复用已有 `certbot renew` cron；没有 cron 时自动添加每天 03:00 的任务。

检查：

```bash
sudo certbot renew --dry-run
crontab -l | grep certbot
```

## 自动更新

服务器建议使用 GitHub SSH（443 端口）拉取代码；部署源也可以是阿里云 Codeup / Gitee。

`update.sh` 会先 fetch 远程分支，比较本地和远程提交；只有代码有变化时才构建并重启容器。

首次从旧代码拉取脚本时：

```bash
cd /opt/zhonghui-website
git pull

cd deploy
chmod +x update.sh

# 已经手动 pull 过代码，需要强制重建一次
sudo ./update.sh --force
```

之后正常更新：

```bash
cd deploy
sudo ./update.sh

# 代码没变化也强制重建、重启
sudo ./update.sh --force
```

脚本流程：

```text
检查工作区是否干净
git fetch origin main
比较本地 HEAD 和 origin/main
git merge --ff-only
docker compose build cms
docker compose up -d cms builder
检查 127.0.0.1:3010/admin 是否可访问
```

几点说明：

- 先 `fetch` 是为了判断“有没有新提交”，避免没有变化也重新构建；
- 使用 `merge --ff-only`，服务器本地不会产生合并提交；
- 工作区有未提交修改时脚本会停止，防止覆盖服务器上的改动；
- 使用 `flock` 防止 cron 和手工执行同时更新；
- `update.sh` 会重启 `cms` 和 `builder`。如果手工修改了 `cms/src/render/styles/base.css` 或渲染代码，也必须先重启 builder，再到后台点「重建站点」，否则静态站会继续使用旧样式。

定时检查示例（每 10 分钟检查一次，有更新才部署）：

```cron
*/10 * * * * /opt/zhonghui-website/deploy/update.sh >> /var/log/zhonghui-update.log 2>&1
```

> 自动部署会直接重启生产 CMS。如果不希望每次 push 都自动上线，改成手动执行，或使用低频 cron（例如每小时一次）。

## 本地 Compose 模拟（不连生产域名）

```bash
docker compose -f docker-compose.local.yml up -d
```

- 静态站：`http://www.localhost:8080/`
- 后台：`http://admin.localhost:8080/admin`

本地不经过宿主机 Nginx，也不使用证书。

## 备份与恢复

完整备份包含：

```text
PostgreSQL 数据库
cms-media 媒体文件
deploy/.env
manifest.txt
```

### 备份

```bash
cd deploy
sudo ./backup.sh
```

默认输出：

```text
/var/backups/zhonghui/zhonghui-YYYYmmdd-HHMMSS.tar.gz
```

可自定义目录和保留数量：

```bash
sudo BACKUP_DIR=/data/backups KEEP=14 ./backup.sh
```

### 恢复

```bash
cd deploy
sudo ./restore.sh --latest
```

或指定文件：

```bash
sudo ./restore.sh /var/backups/zhonghui/zhonghui-20261117-193000.tar.gz
```

选项：

```text
--latest        使用最新备份
--yes           跳过确认
--restore-env   用备份中的 env 覆盖当前 deploy/.env
--no-rebuild    不自动重新生成静态站
```

恢复脚本会：

1. 停止 `cms` / `builder`；
2. 用 `pg_restore` 恢复数据库；
3. 恢复媒体卷；
4. 按需恢复 `.env`；
5. 启动服务；
6. 重新生成静态站。

> 跨服务器恢复时，`deploy/.env` 中的 `POSTGRES_USER`、`POSTGRES_DB`、`POSTGRES_PASSWORD` 应与备份来源一致。新服务器建议先复制 env 再执行 `install.sh --skip-seed`，否则数据库角色密码可能不匹配。

## 回滚

```bash
docker compose exec nginx sh
ls /srv/site                 # 查看 releases
ln -sfn ./20261024-120000 /srv/site/current
```

## 注意

- `PAYLOAD_SECRET` 必须与已有数据一致，否则后台会话失效。
- 宿主机 Nginx 已占用 80/443；不要再把容器 nginx 映射到宿主机 80。
- `seed:init` 使用 `NODE_ENV=development` 完成首次 Payload schema 创建，CMS 正常启动使用生产模式。
- 每次发布都会全量构建（站点规模小，秒级）。

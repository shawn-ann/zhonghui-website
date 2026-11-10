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
sudo ./install.sh --install-docker
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

## 本地 Compose 模拟（不连生产域名）

```bash
docker compose -f docker-compose.local.yml up -d
```

- 静态站：`http://www.localhost:8080/`
- 后台：`http://admin.localhost:8080/admin`

本地不经过宿主机 Nginx，也不使用证书。

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

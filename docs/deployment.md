# 中惠 CMS 部署文档

本文档描述从「后台编辑 → 发布 → 构建静态站 → Nginx 上线」的完整方案，以及本地 Compose 模拟方式。

当前状态：

- 本地 Compose 模拟已跑通（构建、原子切换、静态访问、后台发布）。
- 生产 Dockerfile / Compose / Nginx 配置已准备，**尚未在真实服务器验证**。
- 生产环境按「同一台服务器 + Docker Compose」设计。

---

## 1. 部署拓扑

前后端使用独立子域名，静态站与 CMS 解耦：

```
www.zhonghui.com      → Nginx 静态目录 /srv/site/current
                        （软链到某次 release）

admin.zhonghui.com    → Nginx 反代 cms:3000
                        （Next.js + Payload 后台/API/预览）

zhonghui.com          → 301 到 www

Docker Compose（同一台服务器）:
  postgres   持久化数据库
  cms        Next/Payload，提供 /admin /api /preview
  nginx      静态站点 + 反向代理
```

静态站完全独立：`/assets`、`/assets/media` 都来自 release，不依赖 CMS 运行时。

---

## 2. 目录与关键文件

```
cms/
  Dockerfile                生产镜像（next build + next start）
  scripts/seed-home.ts      首页种子数据
  src/generate/cli.ts       静态构建入口
  src/generate/release.ts   release 目录 + 原子软链
  src/build/manager.ts      构建触发/状态/日志/锁
  media/                    后台媒体文件（持久化）
  releases/                 每次构建的静态产物（持久化）
    <timestamp>/
    current -> ./<timestamp>
  dist -> releases/<timestamp>   本地预览/兼容软链

deploy/
  docker-compose.yml        生产 Compose
  docker-compose.local.yml  本地模拟 Compose
  nginx/zhonghui.conf       生产 Nginx
  nginx/zhonghui.local.conf 本地 Nginx
  .env.example              环境变量示例
  README.md                 简版说明
```

---

## 3. 发布闭环

后台点击「发布」后：

1. 保存并发布 Payload 数据（写入 Postgres）。
2. 前端调用 `POST /api/rebuild`（需要登录）。
3. CMS 容器内启动 `tsx src/generate/cli.ts`。
4. 生成到 `releases/<timestamp>/`。
5. 成功后原子切换：
   - `releases/current -> ./<timestamp>`
   - `cms/dist -> releases/<timestamp>`
6. Nginx 始终读取 `releases/current`，无需 reload。
7. 失败时删除半成品，旧 release 继续在线。

构建状态：

- `GET /api/rebuild`：`idle / building / success / error`
- 状态文件：`releases/.build-status.json`
- 日志：`releases/.build.log`
- 后台顶栏显示：构建中 / 构建成功 · 时间 / 构建失败 · 原因
- 构建中禁止重复发布；保留最近 5 个 release（`SITE_KEEP_RELEASES`）。

---

## 4. 本地 Compose 模拟（已验证）

### 4.1 启动

```bash
cd deploy
docker compose -f docker-compose.local.yml up -d
```

本地 Compose 的特点：

- CMS 使用 `node:22-bookworm-slim`，绑定挂载源码，执行 `npm run dev`。
- 复用宿主机现有 Postgres（`host.docker.internal:5432`），保留现有页面与账号。
- 媒体和 releases 直接绑定到宿主机 `cms/`，构建结果可直接检查。
- 首次启动会在命名卷中执行 `npm ci`（约 1–2 分钟）。
- Nginx 监听 8080。

访问：

- 静态站：`http://www.localhost:8080/`
- 后台：`http://admin.localhost:8080/admin`
- 账号：`admin@zhonghui.local / zhonghui1234`

Chrome 会自动把 `*.localhost` 解析到 127.0.0.1。若浏览器不支持，可加：

```
127.0.0.1 www.localhost admin.localhost
```

### 4.2 验证发布

1. 打开 `http://admin.localhost:8080/admin` 登录。
2. 进入页面编辑，点「发布」。
3. 顶栏出现「构建中…」，首次约 1–2 分钟（Payload schema pull 较慢）。
4. 成功后检查宿主机：

```bash
ls -l cms/releases/current cms/dist
cat cms/releases/.build-status.json
```

5. 刷新 `http://www.localhost:8080/`，内容应为最新发布版本。

### 4.3 停止 / 恢复本机开发

```bash
cd deploy
docker compose -f docker-compose.local.yml down

# 之后可恢复宿主机开发服务器
cd ../cms
npm run dev
```

如果依赖发生变化（package.json / lockfile），本地容器需要重建依赖卷：

```bash
docker compose -f docker-compose.local.yml down -v   # 会删除 node_modules/.next 卷
docker compose -f docker-compose.local.yml up -d
```

注意：`-v` 不会删除绑定的 `cms/media`、`cms/releases`。

---

## 5. 生产部署（待执行）

### 5.1 服务器准备

- 安装 Docker / Docker Compose。
- DNS 指向同一台服务器：
  - `www.zhonghui.com`
  - `admin.zhonghui.com`
  - `zhonghui.com`（裸域 301）
- 开放 80/443。

### 5.2 配置环境变量

```bash
cd deploy
cp .env.example .env
```

编辑 `.env`：

```
PAYLOAD_SECRET=请替换为随机长字符串
POSTGRES_USER=zhonghui
POSTGRES_PASSWORD=请替换
POSTGRES_DB=zhonghui_cms
```

`PAYLOAD_SECRET` 必须与首次初始化时一致，否则后台会话失效。

### 5.3 启动

```bash
docker compose up -d --build
```

生产 Compose：

- `postgres`：数据卷 `pgdata`
- `cms`：Dockerfile 构建，`next start`
- `nginx`：80 端口；静态目录 `/srv/site/current`；admin 反代

首次启动后：

1. 打开 `http://admin.zhonghui.com/admin` 创建管理员。
2. 在编辑器中点「发布」，生成第一个 release。
3. 确认 `https://www.zhonghui.com/` 可访问。

### 5.4 TLS

证书就绪后：

- 修改 `deploy/nginx/zhonghui.conf`，启用底部 443 server。
- 挂载证书目录到 `/etc/nginx/certs`。
- 将 80 端口改为 301 到 https。
- `docker compose restart nginx`。

生产 Dockerfile 目前未实际构建验证；正式上线前需先在服务器执行一次完整构建并检查后台/静态站。

---

## 6. 回滚

所有历史 release 都保留在：

```
cms/releases/<timestamp>/
cms/releases/current -> ./<timestamp>
```

生产环境回滚：

```bash
docker compose exec nginx sh
ls /srv/site
ln -sfn ./20261024-120000 /srv/site/current
```

（本地环境直接在宿主机 `cms/releases/` 改软链即可。）

回滚是原子操作，不需要重启 Nginx。

---

## 7. 数据与持久化

生产 Compose 卷：

- `pgdata`：Postgres 数据
- `cms-media`：后台上传的媒体
- `site-releases`：静态站 release

本地 Compose：

- 数据库使用宿主机现有 Postgres
- `cms/media`、`cms/releases` 直接绑定宿主机

备份建议：

```bash
docker compose exec postgres pg_dump -U zhonghui zhonghui_cms > backup.sql
docker run --rm -v zhonghui_cms-media:/data -v "$PWD":/backup alpine \
  tar czf /backup/media.tgz -C /data .
```

---

## 8. 安全建议

- `admin.zhonghui.com` 建议增加 IP 白名单或 VPN：

```nginx
location / {
    allow 203.0.113.10;
    deny all;
    proxy_pass http://cms:3000;
}
```

- 强制 HTTPS，后台 Cookie 不要跨到静态站。
- `PAYLOAD_SECRET`、数据库密码只放在服务器 `.env`，不要提交仓库。
- 定期备份数据库和媒体目录。
- 构建接口 `/api/rebuild` 已要求登录；不要额外暴露 CMS 端口到公网。

---

## 9. 常见问题

**静态站 404 / 空目录**
- `releases/current` 不存在：先点「发布」或执行 `npm run generate`。
- Nginx 读取的卷没有挂载正确。

**发布后一直「构建中」**
- 首次构建较慢（Payload schema pull）。
- 查看 `releases/.build.log`、`releases/.build-status.json`。
- 检查容器是否能访问数据库（`DATABASE_URL`）。

**构建失败：npm ci lock 不一致**
- 在 `cms` 下执行 `npm install` 同步 lockfile，再重新构建。
- 本仓库已补上 `yaml` devDependency，当前 `npm ci` 正常。

**Docker 拉镜像 EOF**
- Docker Desktop → Settings → Resources → Proxies 使用 system 模式（或可用镜像加速器）。
- 验证：`docker pull nginx:1.27-alpine`。

**后台跳到登录页**
- 不同域名（127.0.0.1 / admin.localhost / admin.zhonghui.com）Cookie 不共享，需在当前域名重新登录。

**8080 / 3001 端口被占用**
- 修改 `deploy/docker-compose.local.yml` 的端口映射。

**媒体 404**
- 静态站只复制被页面引用的媒体；确认媒体已上传且页面已重新发布。
- 本地检查 `cms/media` 绑定；生产检查 `cms-media` 卷。

---

## 10. 当前验证记录

本地 Compose：

- `www.localhost:8080/` 返回 200，包含「学生分享」。
- `admin.localhost:8080/admin` 返回 200。
- 后台发布 → 顶栏「构建中…」→「构建成功 · 12:46:26」。
- 生成 `releases/20261024-044621`，`current` 与 `dist` 原子切换。
- `/assets/style.css`、`/assets/media/...` 均 200。
- 旧 release 保留，构建失败不会影响线上版本。

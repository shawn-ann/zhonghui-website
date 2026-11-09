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
www.zhonghui.com / admin.zhonghui.com
  ↓ 80 / 443（宿主机 Nginx，负责证书和自动续期）
宿主机 Nginx
  ↓ proxy_pass 127.0.0.1:8080
Docker 内 Nginx
  ├─ www.zhonghui.com   → 静态目录 /srv/site/current
  └─ admin.zhonghui.com → cms:3000（Next/Payload）
zhonghui.com → 301 到 www

Docker Compose（同一台服务器）:
  postgres   持久化数据库
  cms        Next/Payload，提供 /admin /api /preview
  builder    常驻静态构建服务
  nginx      容器内静态站 + 反向代理，仅绑定 127.0.0.1:8080
```

宿主机 Nginx 负责 TLS；容器内 Nginx 只处理 HTTP。静态站 `/assets`、`/assets/media` 都来自 release，不依赖 CMS 运行时。

---

## 2. 目录与关键文件

```
cms/
  Dockerfile                生产镜像（next build + next start）
  seed/                     初始化配置与媒体（npm run seed:init 导入）
  src/generate/cli.ts       静态构建入口
  src/generate/release.ts   release 目录 + 原子软链
  src/build/manager.ts      构建触发/状态/日志/锁
  src/build/worker.ts       常驻构建服务（单次初始化 Payload）
  media/                    后台媒体文件（持久化）
  releases/                 每次构建的静态产物（持久化）
    <timestamp>/
    current -> ./<timestamp>
  dist -> releases/<timestamp>   本地预览/兼容软链

deploy/
  docker-compose.yml        生产 Compose
  docker-compose.local.yml  本地模拟 Compose
  install.sh                应用容器一键部署脚本
  setup-host-nginx.sh       宿主机 Nginx + Certbot + 自动续期脚本
  nginx/host-zhonghui.conf  宿主机 Nginx 域名配置模板
  nginx/zhonghui.conf       容器内 Nginx 配置
  nginx/zhonghui.local.conf 本地 Nginx
  .env.example              环境变量示例
  README.md                 简版说明
```

---

## 3. 发布闭环

后台点击「发布」后：

1. 保存并发布 Payload 数据（写入 Postgres）。
2. 前端调用 `POST /api/rebuild`（需要登录）。
3. CMS 通过 `BUILDER_URL` 请求常驻 `builder` 服务；builder 复用已初始化的 Payload。
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
- 后台按钮显示：发布中… / 构建中…；成功后按钮旁显示构建成功时间
- 构建中禁止重复发布；保留最近 5 个 release（`SITE_KEEP_RELEASES`）。

### 站点配置生效

菜单、站点设置（Logo/页脚/版权/语言）保存后不会自动上线。
在「页面」列表点击「重建站点」，或调用 `POST /api/rebuild`，生成新的 release 后生效。

### 构建性能

页面渲染本身只有几十毫秒，耗时主要在 Payload 初始化和每次新进程加载模块。

已做的优化：

- 构建进程强制 `NODE_ENV=production`，跳过 dev 模式 schema 检查。
- 生成器用 esbuild 预编译为 `generator/generate.mjs`，运行时直接 `node` 执行，避免 tsx 冷启动。
- 常驻 `builder` 服务启动时初始化一次 Payload，并监听 `:4000`；发布时只做「读数据 + 渲染 + 切换 release」。
- 构建管理器设置 `BUILDER_URL` 时走 builder，否则本地回退到预编译生成器/tsx。
- Dockerfile 在镜像构建时执行 `npm run build:generator`。
- 构建日志包含 `payload-init`、`load-data`、`build-release` 耗时。

本地实测（Docker Desktop）：

- 首次构建约 25–30s（文件缓存冷）。
- 后续构建约 10–12s。
- 其中 Payload 初始化 0.3–0.6s、读取数据 0.5–1.3s、渲染+写文件+媒体约 2s；其余为 Node 加载模块。

生产环境（Linux 本地磁盘 + `next start` + 同网络 Postgres）预计更快。

本地修改了生成器/worker/渲染代码后，需要重新执行：

```bash
cd cms
npm run build:generator
docker compose -f deploy/docker-compose.local.yml restart builder
```

正式镜像重新构建时会自动执行该步骤。

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
- `builder` 服务复用同一源码/node_modules，启动时预热 Payload。
- 本地 Compose 依赖 `generator/builder.mjs`；首次使用或修改 worker 后先在 `cms` 执行 `npm run build:generator`。
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
NEXT_PUBLIC_SITE_URL=https://www.zhonghui.com
```

`PAYLOAD_SECRET` 必须与首次初始化时一致，否则后台会话失效。`NEXT_PUBLIC_SITE_URL` 用于后台「查看网站」链接，必须指向前台域名。

### 5.3 初始化数据并启动

新环境先导入当前站点配置和媒体，再启动 CMS：

```bash
# 推荐：自动构建镜像、启动数据库、导入 seed、生成静态站并启动容器
sudo ./install.sh --install-docker

# 已有数据库时跳过 seed
sudo ./install.sh --skip-seed
```

`seed:init` 会使用 `NODE_ENV=development` 完成首次 Payload schema 创建，然后生成 `releases/current`。

生产 Compose：

- `postgres`：数据卷 `pgdata`
- `cms`：Dockerfile 构建，`next start`
- `builder`：常驻构建服务
- `nginx`：仅绑定 `127.0.0.1:8080`；静态目录 `/srv/site/current`；admin 反代 cms

首次启动后：

1. 打开 `https://admin.zhonghui.com/admin` 创建管理员（种子不包含用户）。
2. 静态站已由 `seed:init` 生成，确认 `https://www.zhonghui.com/` 可访问。
3. 后续在后台修改并发布即可。

### 5.4 TLS 与自动续期

宿主机 Nginx 负责 80/443、证书和续期；容器内 Nginx 不挂载证书。

```bash
sudo DOMAIN=www.zhonghui.com \
     ADMIN_DOMAIN=admin.zhonghui.com \
     EMAIL=ops@example.com \
     ./setup-host-nginx.sh
```

脚本会：

- 写入 `deploy/nginx/host-zhonghui.conf` 到宿主机 `/etc/nginx/conf.d/zhonghui.conf`；
- 用 Certbot webroot 方式签发 `www` + `admin` 证书；
- 安装续期后 reload Nginx 的 deploy hook；
- 启用 `certbot.timer`。

检查：

```bash
sudo certbot renew --dry-run
systemctl status certbot.timer
```

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

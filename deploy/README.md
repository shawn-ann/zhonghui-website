# 部署说明（同一台服务器）

完整文档见 [`docs/deployment.md`](../docs/deployment.md)。本文为快速速查。

## 结构

```
deploy/
  docker-compose.yml
  nginx/zhonghui.conf
cms/
  Dockerfile
```

- `www.zhonghui.com` → Nginx 静态目录 `/srv/site/current`（软链到某个 release）
- `admin.zhonghui.com` → 反代 `cms:3000`（Next + Payload）
- 后台「发布」→ 在 `cms` 容器内构建 → 写入 `/app/releases/<时间戳>/` → 原子切换 `releases/current`

## 首次启动

```bash
cd deploy
cp .env.example .env        # 填写 PAYLOAD_SECRET
docker compose up -d --build
```

DNS：
- `www` / `admin` / 裸域 → 同一台服务器 IP
- 裸域 301 到 `www`

首次进入 `https://admin.zhonghui.com/admin` 创建管理员，然后在页面编辑器点「发布」生成首个 release。

## 本地 Compose 模拟（不连服务器）

```bash
cd deploy
docker compose -f docker-compose.local.yml up -d
```

- 静态站：`http://www.localhost:8080/`
- 后台：`http://admin.localhost:8080/admin`
- 使用宿主机现有 Postgres（`host.docker.internal:5432`）与本地页面数据。
- `cms` 容器首次启动会在命名卷里执行 `npm ci`（约 1–2 分钟）。
- 后台「发布」会在容器内构建，写入宿主机 `cms/releases`；Nginx 通过绑定挂载读取。

停止：`docker compose -f docker-compose.local.yml down`
（如需恢复宿主 `npm run dev`，先执行上面的 down。）

## 本地 / 手工构建

```bash
cd cms
npm run generate            # 写入 releases/<时间戳>，并切换 dist / releases/current
```

本地预览：`./scripts/start.sh preview`

## 回滚

```bash
docker compose exec nginx sh
ls /srv/site                 # 查看 releases
ln -sfn ./20261024-120000 /srv/site/current
```

## TLS

先确保 HTTP 可用，再按 `nginx/zhonghui.conf` 底部注释启用 443，并挂载证书。

## 注意

- `PAYLOAD_SECRET` 必须与已有数据一致，否则后台会话失效。
- 构建依赖 `cms` 镜像内的 `tsx` 与源码；当前 Dockerfile 保留全部依赖和源码。
- 每次发布都会全量构建（站点规模小，秒级）。

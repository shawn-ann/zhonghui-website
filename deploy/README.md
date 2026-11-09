# 部署说明（同一台服务器）

完整文档见 [`docs/deployment.md`](../docs/deployment.md)。

## 结构

```text
用户
  ↓ 80 / 443（宿主机 Nginx，负责证书）
宿主机 Nginx
  ↓ proxy_pass 127.0.0.1:8080
Docker 内 Nginx
  ├─ www.zhonghui.com  → 静态站 /srv/site/current
  └─ admin.zhonghui.com → cms:3000

Docker Compose：
  postgres / builder / cms / nginx
```

- 宿主机 Nginx 配置：`deploy/nginx/host-zhonghui.conf`
- 容器内 Nginx 配置：`deploy/nginx/zhonghui.conf`
- 宿主机 Nginx 只转发到 `127.0.0.1:8080`，不直接接触 Docker 网络。
- 后台地址仍为 `https://admin.zhonghui.com/admin`。

## 首次部署

```bash
cd deploy

# 1. 安装/更新宿主机 Nginx + 申请证书 + 配置自动续期（需要 root）
sudo DOMAIN=www.zhonghui.com \
     ADMIN_DOMAIN=admin.zhonghui.com \
     EMAIL=ops@example.com \
     ./setup-host-nginx.sh

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

首次打开 `https://admin.zhonghui.com/admin` 创建管理员账号。

已有数据库时不要重复导入：

```bash
sudo ./install.sh --skip-seed
```

## 证书自动续期

`setup-host-nginx.sh` 会：

- 安装 Certbot；
- 用 webroot 方式为 `www` + `admin` 签发证书；
- 写入续期后 reload Nginx 的 hook；
- 启用 `certbot.timer`。

手动检查：

```bash
sudo certbot renew --dry-run
systemctl status certbot.timer
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

# cms — 中惠文化官网后台 CMS

Payload 3.90.2 + PostgreSQL + Next 16 的后台，配一个纯 TypeScript 的**静态生成器**：
在后台配置页面与内容，点生成后输出纯静态 HTML 到 `cms/dist/`。

> 设计与计划：`../docs/superpowers/specs/2026-10-14-cms-design.md`、`../docs/superpowers/plans/2026-10-14-cms-p1-foundation.md`
> 当前进度：**P1 地基**（Pages/Media/Users + text/image 区块 + 组合页静态生成）。

## 环境要求

- Node.js **>= 20.9**（Next 16 要求）
- npm
- Docker（本地跑 PostgreSQL）
- TypeScript 5.7 / Vitest 4（随依赖安装）

## 快速开始

### 1. 启动 PostgreSQL（Docker）

```bash
docker run -d --name zhonghui-postgres \
  -e POSTGRES_USER=zhonghui \
  -e POSTGRES_PASSWORD=zhonghui_pw \
  -e POSTGRES_DB=zhonghui_cms \
  -p 5432:5432 postgres:16

# 等待就绪（出现 "database system is ready" 即可）
docker logs -f zhonghui-postgres
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

`.env`：

```
DATABASE_URL=postgres://zhonghui:zhonghui_pw@127.0.0.1:5432/zhonghui_cms
PAYLOAD_SECRET=dev-secret-change-me
```

> `PAYLOAD_SECRET` 与 `DATABASE_URL` 缺失时启动会**直接报错**（fail-fast）。
> `.env` 已被 `.gitignore` 忽略，请勿提交。

### 3. 安装并启动后台

```bash
npm install
npm run dev
```

打开 http://localhost:3000/admin ，首次访问会引导创建管理员账号。

### 4. 生成静态站点

在后台发布至少一个页面（`route` 以 `/` 开头，状态设为"已发布"），然后：

```bash
npm run generate
# Generated N pages -> .../cms/dist
```

产物在 `cms/dist/`（`index.html`、`assets/style.css` 等），可直接作为纯静态站点部署。
**草稿（draft）页面不会被生成。**

本地预览产物：

```bash
cd dist && python3 -m http.server 8331 --bind 127.0.0.1
# 打开 http://127.0.0.1:8331/
```

## 常用命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务器（后台 `/admin`） |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产构建 |
| `npm run generate` | 读取已发布 Pages，生成静态站点到 `dist/` |
| `npm test` | 运行 Vitest 测试 |
| `npm run test:watch` | Vitest 监听模式 |
| `npm run typecheck` | TypeScript 类型检查（`tsc --noEmit`） |
| `npm run generate:types` | 由 Payload 生成 `src/payload-types.ts` |
| `npm run generate:importmap` | 重新生成 Payload admin importMap |
| `npm run payload` | Payload CLI 透传 |

> 本项目**未配置 lint**；用 `npm run typecheck` + `npm test` 作为静态检查与测试。

## 目录结构

```
cms/
├─ src/
│  ├─ collections/     # Users / Media / Pages 集合定义
│  ├─ blocks/          # 区块定义：Text / Image
│  ├─ render/          # 纯渲染模块（无 Payload 依赖，可单测）
│  │  ├─ primitives.ts # esc / bgStyle / safeUrl
│  │  ├─ shell.ts      # 区块外壳
│  │  ├─ components.ts # 区块渲染器（text/image）
│  │  ├─ layout.ts     # 整页 HTML（head + main）
│  │  └─ styles/       # base.css
│  ├─ generate/        # 静态生成
│  │  ├─ route.ts      # 路由 → 文件路径
│  │  ├─ buildSite.ts  # 数据 → 文件映射
│  │  ├─ writeSite.ts  # 写盘
│  │  ├─ loadSiteData.ts # 读取 Payload 已发布页
│  │  └─ cli.ts        # `npm run generate` 入口
│  └─ payload.config.ts
└─ dist/               # 生成产物（gitignore）
```

## 安全约定

- 公开站点为**纯静态**；动态面仅后台与（后续的）预览。
- 渲染层统一转义（`esc`）并对链接/资源做协议白名单（`safeUrl`），防止属性注入与 `javascript:`/`data:` 注入。
- 生成器拒绝含 `..` 的路由，`writeSite` 二次校验不越出输出目录。
- 上传 MIME 限制为 `jpeg/png/webp/gif`，**不含 SVG**。
- 环境变量缺失即启动失败。

## 已知限制（P1）

- 图片区块的媒体文件**尚未**导出到 `dist/`、也**未重写路径**（`image` 暂时指向 Payload API URL）。静态媒体导出留待 **P2**。
- 页面状态用普通 `status` 字段（draft/published），尚未接入 Payload 原生 Drafts + 预览（计划 **P5**）。
- 导航/页脚/菜单/主题令牌尚未接入（计划 **P2–P4**）。

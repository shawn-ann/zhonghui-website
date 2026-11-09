# cms — 中惠文化官网后台 CMS

Payload 3.90.2 + PostgreSQL + Next 16 的后台，配一个纯 TypeScript 的**静态生成器**：
在后台配置页面、文章、菜单与站点设置，发布后自动生成纯静态站点，输出到 `cms/releases/`。

> 设计与历史计划：`../docs/superpowers/specs/`、`../docs/superpowers/plans/`
> 当前定位：**Demo / 交付演示**，用于展示后台编辑、发布、自动重建和静态站生成能力。

## 环境要求

- Node.js **>= 20.9**（Next 16 要求）
- npm
- Docker（本地跑 PostgreSQL 与构建服务）
- TypeScript 5.7 / Vitest 4（随依赖安装）

## 一键脚本

`scripts/start.sh` 会按需自动：启动 Docker/PostgreSQL 容器、从 `.env.example` 生成 `.env`、安装依赖。

```bash
./scripts/start.sh            # 启动后台开发服务器 → http://localhost:3000/admin
./scripts/start.sh preview    # 生成静态站点并预览
./scripts/start.sh stop       # 停止 dev / preview 服务（PostgreSQL 容器保持运行）
```

> 停止数据库容器：`docker stop zhonghui-postgres`。

## 快速开始

### 1. 启动 PostgreSQL（Docker）

```bash
docker run -d --name zhonghui-postgres \
  -e POSTGRES_USER=zhonghui \
  -e POSTGRES_PASSWORD=zhonghui_pw \
  -e POSTGRES_DB=zhonghui_cms \
  -p 5432:5432 postgres:16
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

`.env`：

```env
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

在后台发布页面或文章后，系统会防抖约 4 秒自动重建；也可以手动执行：

```bash
npm run generate
# Generated N pages -> cms/releases/<timestamp>
```

- 生成结果在 `cms/releases/<timestamp>/`，并通过 `cms/releases/current` 软链指向最新版本；
- 草稿内容不会进入静态站；
- 后台保存已发布内容、分类、菜单或站点设置会自动触发重建，侧栏显示发布状态。

## 常用命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务器（后台 `/admin`） |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产构建 |
| `npm run generate` | 构建生成器并输出静态站到 `releases/` |
| `npm run build:generator` | 仅构建静态生成器；修改渲染器/区块后需要执行并重启 builder |
| `npm test` | 运行 Vitest 测试 |
| `npm run test:watch` | Vitest 监听模式 |
| `npm run typecheck` | TypeScript 类型检查（`tsc --noEmit`） |
| `npm run generate:types` | 由 Payload 生成 `src/payload-types.ts` |
| `npm run generate:importmap` | 重新生成 Payload admin importMap |

> 本项目**未配置 lint**；用 `npm run typecheck` + `npm test` 作为静态检查与测试。

## 目录结构

```text
cms/
├─ src/
│  ├─ collections/     # Users / Media / Pages / Cases / CaseCategories / CaseRedirects
│  ├─ blocks/          # Payload 区块定义
│  ├─ editor/          # 自定义可视化编辑器、属性面板、富文本控件
│  ├─ render/          # 共享渲染模块（静态 HTML、富文本、样式）
│  ├─ site/            # React 渲染层（页面、文章、导航、页脚）
│  ├─ generate/        # 读取已发布数据并生成静态站
│  └─ payload.config.ts
├─ scripts/            # 启动、生成器构建、种子与维护脚本
├─ generator/          # 静态生成器 bundle
└─ releases/           # 每次生成的静态站版本（gitignore）
```

## 安全约定

- 公开站点为**纯静态**；动态面仅后台。
- 渲染层统一转义，并对链接/资源做协议白名单（`safeUrl`），防止属性注入与 `javascript:` / `data:` 注入。
- 生成器拒绝含 `..` 的路由，写盘时二次校验不越出输出目录。
- 媒体库允许 `jpeg/png/webp/gif/svg`。SVG 通过 `<img>` 引用，脚本不会在页面中执行；仍应只上传可信来源的 SVG。
- 环境变量缺失即启动失败。

## 当前状态与限制

已实现：

- 页面可视化编辑器、结构树、属性面板、媒体库、富文本（颜色/对齐/图片/图集）；
- 页面、文章、分类、菜单、站点设置；
- 已发布内容自动重建、发布状态展示；
- 静态媒体导出、`releases/` 版本切换；
- 全量 Vitest 测试与 TypeScript 检查。

当前限制（按 Demo 范围）：

- 生产环境 Docker/Nginx/HTTPS 仍在 `../deploy/` 中准备，**未在真实服务器验证**；
- 不做 SEO 基础文件（`robots.txt`、`sitemap.xml`）和 SEO 字段；
- 不做旧 URL 重定向；旧版静态页面已归档到仓库根目录 `../legacy/`；
- 未接入生产级监控、备份与权限细化。

后续上线初始化脚本会负责导出当前页面配置与图片，替代历史迁移脚本。

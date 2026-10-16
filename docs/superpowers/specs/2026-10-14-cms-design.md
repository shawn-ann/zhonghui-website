# 中惠文化官网 — 后端配置 CMS 设计文档

> 日期：2026-10-14
> 状态：待评审
> 关联：`index.html`（现有 demo）、`docs/design-system.md`、`中惠门户网站架构文档.md`

---

## 1. 背景与目标

### 1.1 背景

现有站点为**静态 HTML + 内联 `pageConfig`** 的 demo（见 `index.html`）。页面的导航、页脚、区块内容都由一个模拟"后端返回"的配置对象驱动，通过 `renderers` 渲染。该 demo 仅用于展示，内容全部硬编码在 HTML 内。

现状问题：
- 内容改动需改代码，运营无法自助维护。
- 各页面复制了整份 CSS / 配置 / 渲染逻辑，重复严重。
- 原线上站点为 PHP，存在安全隐患（老旧组件、未打补丁等），希望更换技术方案并**大幅缩小动态攻击面**。

### 1.2 目标

构建一套**后端 CMS**，让非技术运营能够：
- 自由搭建页面（配置菜单、菜单对应的页面、页面内区块与布局）。
- 配置全局主题样式（品牌色、字体、圆角等）。
- 发布学员案例等集合内容，列表页/详情页自动生成。
- 通过草稿 + 预览确认后再发布。

技术上：
- **公开站点输出纯静态 HTML**，攻击面趋近于零；动态部分只剩受保护的后台与预览。
- 支持中/英两个**独立单语实例**，导航栏互相跳转。

### 1.3 非目标（本期不做）

- 站内实时切换语言的字段级 i18n（改为两个独立实例）。
- 多人协作与角色权限（仅一个管理员账号）。
- 版本回滚（暂不做）。
- 评论、表单提交、电商等业务功能。
- 无限深度的可视化拖拽搭建（支持嵌套但 UI 引导浅层）。

---

## 2. 技术选型（已定）

| 项 | 选择 |
|---|---|
| 后端 / CMS | **Node.js + Payload CMS（v3，TypeScript）** |
| 数据库 | **PostgreSQL** |
| 后台 UI | Payload 自带 Admin（React） |
| 公开站点 | 静态生成的 HTML/CSS/JS |
| 反向代理 | Nginx |
| 进程守护 | systemd 或 pm2 |
| 部署 | 每语言实例独立部署（独立库、独立服务器/目录） |

**选型理由**：Payload 的 **Blocks 字段**原生支持"区块库 + 自由拼页 + 嵌套"，Media / Drafts / Preview / Access / Local API 全内置，支持 PostgreSQL（Payload 无官方 MySQL 适配器），与现有前端同语言（JS/TS），发布钩子天然适配静态生成。方案对比详见附录 A。

---

## 3. 总体架构

```
┌───────────────────── 单语言实例（服务器）──────────────────────┐
│  Nginx                                                          │
│   ├─ /            → 静态目录 dist/（纯 HTML/CSS/JS/图片）         │
│   ├─ /admin, /api → 反代 → Payload（Node，仅管理员）              │
│   └─ /preview     → 反代 → Payload（草稿动态预览）                │
│                                                                  │
│  Payload (Node) ◄──► PostgreSQL（本地，不对外）                   │
│  Payload (Node) ──发布──► 静态生成器 ──写入──► dist/              │
└──────────────────────────────────────────────────────────────────┘
        ▲
        │  中文站 与 英文站 各自一套（独立库、独立部署）
        │  导航栏语言项 = 一个配了完整 URL 的菜单项，指向对端站点
```

**关键点**
- 公开站点是**纯静态文件**，无运行时数据库查询。
- 动态面只有后台与预览，经 Nginx 反代，可加 IP 白名单 / 登录限流 / HTTPS。
- 渲染逻辑**一套共享模块**同时服务「静态生成」与「预览」。

---

## 4. 数据模型（Payload 集合与全局）

### 4.1 Collections

#### Pages（组合页）
自由搭建的页面（首页、关于、案例列表页、专题页……）。

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | text | 后台显示名 |
| `route` | text | 前台路由，唯一，如 `/about/`、`/cases/` |
| `blocks` | blocks | 页面内容：容器/内容组件的有序列表（可嵌套） |
| `seo` | group | `title` / `description` / `ogImage` |
| `status` | select | `draft` / `published`（Payload drafts） |

#### ContentTypes（内容类型定义）
让"案例""资讯"成为**可配置的类型**，而非写死两种。

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | text | 显示名，如"案例" |
| `slug` | text | 用于详情路由，如 `cases` |
| `fields` | array | 定义该类型条目的字段（name/label/type/required…） |
| `detailTemplate` | select | 详情页模板：`cover-body` / `cover-gallery-body` / … |
| `categories` | relationship | 关联该类型的分类 |

#### Entries（内容条目）
一条条案例/资讯。

| 字段 | 类型 | 说明 |
|---|---|---|
| `contentType` | relationship | 所属 ContentType |
| `title` | text | 标题 |
| `slug` | text | 详情路由的一部分，唯一（按类型内） |
| `category` | relationship | 分类 |
| `cover` | upload | 封面图 |
| `body` | richText | 正文 |
| `gallery` | array(upload) | 图集 |
| `publishedAt` | date | 发布时间 |
| `status` | select | `draft` / `published` |

> 条目字段由 ContentType.fields 动态定义（本期可先以固定字段实现 `cover/body/gallery/category`，通用自定义字段列为后续增强）。

#### Categories（分类）
| 字段 | 类型 | 说明 |
|---|---|---|
| `name` / `slug` | text | 名称 / 路由片段 |
| `contentType` | relationship | 所属类型 |

#### Media（媒体）
Payload uploads 集合；图片落本地磁盘（或对象存储），供页面与条目引用。

#### Users（账号）
仅一个管理员，强密码。

### 4.2 Globals

#### Menu（导航菜单）
有序菜单项列表，**不区分类型**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `items` | array | 菜单项 |
| `items[].label` | text | 显示文字 |
| `items[].link` | text | **内部路由**（`/cases/`）或**完整 URL**（`https://en.example.com/`） |
| `items[].children` | array | 子项（有则渲染为下拉），结构同上 |

- 语言切换 = 一个 `link` 为完整 URL 的普通菜单项。
- 当前页高亮：生成器按当前 `route` 与 `link` 匹配，加 `.active`。

#### ThemeSettings（主题令牌，对应"C 档"）
| 字段 | 类型 | 说明 |
|---|---|---|
| `accent` | text/color | 主强调色（现有 `--accent`） |
| `deepColor` | text/color | 标题色（现有 `--deep-blue`） |
| `linkColor` | text/color | 链接色（现有 `--bright-blue`） |
| `lightBg` | text/color | 浅底色（现有 `--light-blue`） |
| `textColor` | text/color | 正文字色（现有 `--dark-text`） |
| `fontFamily` | select | 字体族预设 |
| `radius` | text | 圆角 |
| `favicon` | upload | 站点图标 |

> 命名沿用现有历史变量，改令牌 → 重新发布 → 全站统一变色（等价于现在改 `:root`）。

#### SiteSettings（站点设置）
| 字段 | 类型 | 说明 |
|---|---|---|
| `logo` | upload | 导航 Logo |
| `footerLogo` | upload | 页脚 Logo |
| `address` / `phone` / `email` | text | 页脚信息 |
| `qrcodes` | array | 页脚二维码（标题 + 图） |
| `copyright` | text | 版权/备案 |
| `languageLink` | text | 对端语言站完整 URL |

---

## 5. 组件系统（区块库）

页面 `blocks` 为**有序、可嵌套**的组件树。组件分两类：

### 5.1 布局容器（layout）

| 组件 | 说明 | 主要配置 |
|---|---|---|
| **grid** | 网格布局容器。**列数 × 行数**，每格为一个"槽"，槽内可放多个子组件 | `columns`(1–4)、`rows`、`bg`、`alt` |

- 容器内可再放容器（技术不限制），**UI 引导浅层使用**。
- 每格（槽）可放**多个**子组件（如：先图片，再标题，再描述）。

### 5.2 内容组件（content）

| 组件 | 说明 | 主要配置 |
|---|---|---|
| **banner** | 顶部横幅，两种变体：`整图`（整张背景图+居中文字）/ `左右`（左文字+右图+装饰图） | 变体、标题、副标题、图、装饰图 |
| **image** | 单图（上传） | 图片、链接 |
| **text** | 文本 | 内容、层级(标题/正文)、对齐 |
| **imageText** | 图上文下卡片（图片+标题+描述） | 图、标题、描述、链接 |
| **button** | 链接按钮 | 文字、link、样式 |
| **richtext** | 富文本正文 | 段落/标题/列表/链接/内嵌图 |
| **gallery** | 图集 | 多图、排列方式 |
| **slider** | 图片轮播（沿用"中惠印记"Swiper 效果） | 图片数组、背景 |
| **collectionList** | **从集合自动取内容**：选 ContentType + 分类过滤 → 渲染列表 | 见下 |

### 5.3 collectionList（集合列表）配置

| 配置 | 说明 |
|---|---|
| 源 ContentType | 选择从哪个内容类型取 |
| 分类过滤 | 全部 / 指定分类 |
| 展示方向 | `横排`（每行 N 列） / `竖排`（每行 1 列） |
| 列数 | 1–4 |
| 每页行数 | 如 3 / 10 / 20 |
| 卡片样式 | 图上文下 / 图左文右 … |
| 分页 | 开 / 关 |
| 背景 | `bg` / `alt` |

### 5.4 通用选项（所有顶层区块）

- `bg`：背景图 / 纯色 / 渐变（对应现有 `bgStyle`）。
- `alt`：浅粉底回退（对应 `.section-alt`）。
- 现有"区块背景交替规则"（图/粉交替）由运营手动设置，或后续加"自动交替"开关（见开放问题）。

### 5.5 组件 ↔ 现有 demo 映射

| 现有 `pageConfig` 块 | 新组件 |
|---|---|
| `banner` | `banner`（split→左右，centered→整图） |
| `project-grid` | `grid` + 槽内 `imageText` |
| `advantage-grid` | `grid` + 槽内 `image`(上传图标) + `text` |
| `memory-slider` | `slider` |
| `story-list` | `collectionList` |

---

## 6. 菜单与路由

### 6.1 前台菜单（运营可配）
- 由 **Menu Global** 定义，发布后渲染进静态 HTML 的顶部导航。
- 菜单项：`{ label, link, children[] }`；`link` 可为内部路由或完整 URL。
- 有 `children` → 下拉（对应现有 `.dropdown`）。
- 当前路由高亮 `.active`；语言项为完整 URL 的菜单项。

### 6.2 前台路由（由内容派生）
| 页面类型 | 路由 | 产物 |
|---|---|---|
| 组合页 | `Pages.route`（如 `/about/`） | `dist/about/index.html` |
| 列表页 | 页面 route（如 `/cases/`） | `dist/cases/index.html` + `dist/cases/page/N/index.html` |
| 详情页 | `<ContentType.slug>/<Entry.slug>/` | `dist/cases/xiaocao/index.html` |

- 后台做 **slug/route 唯一性与冲突校验**。
- `collectionList` 的分页在生成时产出多页静态 HTML。

### 6.3 后台菜单（开发固定，运营不可配）
Payload Admin 侧边栏，随数据模型生成：
```
仪表盘 · 页面 · 内容(案例/资讯) · 分类 · 媒体库 · 菜单 · 主题 · 站点设置 · [发布站点]
```

---

## 7. 渲染与静态生成

### 7.1 共享渲染模块
把现有 `renderers` / `shell` / `bgStyle` 抽成**独立共享模块**，改为**递归渲染**：容器组件渲染其子组件，内容组件产出 HTML。同一套函数用于：
- **静态生成**（发布时）
- **预览**（请求时，草稿数据）

### 7.2 发布流程
```
1. 读取该站点全部已发布数据（Pages / Entries / Menu / Theme / SiteSettings）
2. 生成主题令牌 → 拼进 <style> 的 :root
3. 逐页渲染：
   - 组合页        → dist/<route>/index.html
   - 列表页        → dist/<route>/index.html + dist/<route>/page/N/index.html
   - 条目详情页    → dist/<ContentType>/<slug>/index.html
4. 复制媒体到 dist/assets/，重写图片路径
5. 产出 sitemap.xml / robots.txt
6. 完成 → 静态文件即为线上站点
```

- 触发方式：后台「发布站点」按钮调用 Node 生成器。站点小，**整站重建**即可（秒级）；后续可增量化。
- CSS：现有样式为基底 + 组件样式；主题令牌单独生成 `:root` 段注入。
- JS：仅少量交互（下拉菜单、Swiper）。

### 7.3 产物结构
```
dist/
├─ index.html
├─ about/index.html
├─ cases/index.html
├─ cases/page/2/index.html
├─ cases/xiaocao/index.html
├─ sitemap.xml
└─ assets/  (style.css, main.js, images/…)
```

---

## 8. 草稿与预览

- Pages、Entries 均支持 `draft / published`（Payload Drafts）。
- 编辑默认存草稿，不影响线上。
- 后台「预览」→ `/preview?route=/cases/`，用**同一渲染模块 + 草稿数据**动态返回 HTML，不入 `dist/`。
- 确认后点「发布站点」→ 触发静态重建。

---

## 9. 后台界面（运营视角）

```
登录
 └ 仪表盘
    ├ 页面       新建/编辑 · 区块搭建(拖拽排序/嵌套) · 预览 · 发布
    ├ 内容       案例/资讯：列表 + 编辑 + 分类
    ├ 媒体库     上传 / 复用
    ├ 菜单       菜单项（label/link/children）
    ├ 主题       颜色/字体/圆角/图标
    ├ 站点设置   Logo/页脚/二维码/版权/语言链接
    └ [发布站点] 触发静态生成
```

- 单账号、无角色区分。
- 无回滚（本期）。

---

## 10. 安全设计

针对原 PHP 站的安全痛点，核心策略是**最小化动态面**：

- **公开站点=纯静态**：无动态攻击面。
- **后台与预览**：经 Nginx 反代，HTTPS；可加 **IP 白名单**、**登录限流**；`/admin` 可改为非默认路径。
- **数据库**：PostgreSQL 仅监听本地，最小权限账号；连接密钥走环境变量。
- **上传校验**：限制 MIME 与文件大小；**禁止上传 SVG**（防 XSS），或强制净化。
- **响应头**：由 Nginx 统一设置安全头（HSTS、X-Content-Type-Options 等）。

---

## 11. 部署与运维

- 服务器：Node(Payload) + PostgreSQL + Nginx；`systemd`/`pm2` 常驻 Node。
- 部署命令：`npm ci && npm run build` → `npm run generate`（产出 `dist/`）。
- 中/英两个实例部署相同，仅数据库与 `SiteSettings.languageLink` 不同。
- 备份：`pg_dump` + 媒体目录定期备份。

---

## 12. 成功标准

1. 运营**无需改代码**即可新增/编辑页面、增删排序区块（含嵌套）、配置菜单与主题。
2. 发布学员案例后，列表页与详情页**自动生成静态 HTML**，分页正常。
3. 中/英站各自独立部署，导航语言项可跳转对端。
4. 公开站点为纯静态；后台可经 HTTPS + IP 白名单访问。
5. 现有 demo 页面的视觉（配色/布局）在 CMS 生成后可 1:1 复现。

---

## 13. 实施分期（建议）

项目较大，建议分阶段落地，每阶段可独立验证：

| 阶段 | 内容 | 里程碑 |
|---|---|---|
| P1 地基 | Payload + PostgreSQL 接入；Pages / Media / Users；共享渲染模块抽离；最小静态生成器（组合页） | 首页可由配置生成 |
| P2 组件系统 | grid 容器 + 内容组件（banner/image/text/imageText/richtext/slider）；嵌套渲染 | 首页 1:1 复现 |
| P3 集合 | ContentTypes / Entries / Categories；collectionList + 分页；详情模板 | 案例列表/详情自动生成 |
| P4 站点配置 | Menu / ThemeSettings / SiteSettings；主题令牌注入；菜单高亮；语言链接 | 全站可配 |
| P5 工作流与安全 | 草稿/预览；发布按钮；Nginx 反代/HTTPS/限流/上传校验；部署脚本 | 上线就绪 |

---

## 14. 开放问题

1. **区块背景自动交替**：是否需要一个"自动图/粉交替"开关，还是由运营手动设 `bg`？（现有规则见 `docs/design-system.md` 3.1）
2. **ContentType 自定义字段**：本期是否要真正支持"自定义字段定义"，还是先固定 `cover/body/gallery/category` 四种？
3. **编辑器富文本边界**：`richtext` 允许的 HTML 范围（防注入）。
4. **路由改名后的重定向**：本期不做版本回滚，是否需要一个简单 301 重定向表？（默认不做）

---

## 附录 A：方案对比（选型依据）

| 维度 | 方案1 Node + Payload（选中） | 方案2 Python + Wagtail | 方案3 自研轻量后台 |
|---|---|---|---|
| 区块拼页/嵌套 | Blocks 字段原生支持 | StreamField 最成熟 | 全部自写 |
| 后台/媒体/草稿/预览 | 全内置 | 全内置 | 全自写，工期最长、易出安全坑 |
| PostgreSQL | 支持 | 支持 | 视实现 |
| 与现有前端同语言 | ✅ JS/TS | ❌ 两套语言 | ✅ |
| 静态生成 | Local API + 发布钩子，复用现有 renderers | 需自定义导出命令 | 需自写 |

方案 3 表面简单，实则最危险，恰是要规避的方向；方案 2 极稳但静态导出需自写且前后端两语言；故选方案 1。

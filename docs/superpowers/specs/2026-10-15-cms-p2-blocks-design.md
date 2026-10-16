# 中惠文化 CMS — P2 区块系统设计文档

> 日期：2026-10-15
> 状态：待评审
> 父设计：`docs/superpowers/specs/2026-10-14-cms-design.md`（§5 组件系统、§7 渲染与生成）
> 前置：P1 地基已交付（`cms/`，Payload 3.90.2 + PostgreSQL，Pages/Media/Users，text/image 区块，静态生成）

---

## 1. 目标与范围

### 1.1 目标
让**前台页面丰富起来**：实现完整区块库 + 嵌套渲染 + 静态媒体导出 + 固定模板的导航/页脚，使 CMS 生成的静态页在观感上接近现有 `index.html` 首页。

### 1.2 范围（本阶段）
- 完整区块库：`grid`（容器）+ `banner` / `image` / `text` / `imageText` / `button` / `richtext` / `gallery` / `slider`。
- 嵌套渲染（两层容器）。
- 静态媒体导出（复制到 `dist/assets/media/` 并重写 URL）。
- 固定模板导航栏 + 页脚（内容先写死常量）。
- 样式从 `index.html` 移植（玫红主题）。

### 1.3 范围外（后续阶段）
- `collectionList` 与集合内容（案例/资讯）→ **P3**。
- 菜单/主题/站点设置的**后台配置化** → **P4**。
- 草稿预览、发布按钮、Nginx/安全部署 → **P5**。
- 超过两层的容器嵌套。

### 1.4 已定决策
| 决策 | 结论 |
|---|---|
| 导航/页脚 | P2 用**固定模板**（常量）；P4 再配置化 |
| 富文本 | Payload 自带 **Lexical** + 官方 HTML 序列化器 |
| 媒体导出 | **复制到 dist**（纯静态），重写 URL |
| 嵌套建模 | **Payload 原生嵌套 blocks**，上限两层 |
| 主题令牌 | P2 **静态**（固定玫红色值）；配置化留 P4 |

---

## 2. 数据模型

### 2.1 Pages.blocks 扩展
`Pages.blocks` 从 `[TextBlock, ImageBlock]` 扩展为 P2 区块集合。区块定义集中在 `cms/src/blocks/*.ts`，用**工厂函数**避免重复（如 `makeGrid(cellBlocks)`）。

### 2.2 嵌套策略（两层）
- **页面层 blocks**：`[grid, banner, text, image, imageText, button, richtext, gallery, slider]`
- **`grid` 的槽**：`cells: [{ components: blocks[] }]`，可放内容组件**或**一个内层 `grid`。
- **内层 grid**（`gridInner`）：其槽只放内容组件，防止无限递归。
- 更深层不支持。

---

## 3. 区块规格（字段）

**通用**：每个区块都含 `bg`（text：背景图路径 / 纯色 / 渐变）、`alt`（checkbox：浅粉底）——沿用 P1 `shell` / `bgStyle`。

| 区块 | 字段 |
|---|---|
| **banner** | `variant`(select: `split` / `centered`)、`title`(text)、`sub`(text)、`image`(upload→media)、`pattern`(upload→media，可选)、`bg`、`alt` |
| **grid** | `columns`(number 1–4，默认 3)、`gap`(select 预设)、`cells`(array：每格 `{ components: blocks[] }`)、`bg`、`alt` |
| **image** | `media`(upload→media，required)、`altText`(text)、`link`(text)、`bg`、`alt` |
| **text** | `title`(text)、`body`(textarea，required)、`align`(select left/center)、`bg`、`alt` |
| **imageText** | `media`(upload)、`title`(text)、`desc`(textarea)、`link`(text)、`bg`、`alt` |
| **button** | `label`(text)、`link`(text)、`style`(select primary/outline)、`bg`、`alt` |
| **richtext** | `content`(richText / Lexical)、`bg`、`alt` |
| **gallery** | `images`(array of upload→media)、`columns`(1–4)、`bg`、`alt` |
| **slider** | `images`(array of upload→media)、`bg` |

**区块使用示例**
- "项目一览"：`grid`(3 列) + 每格 `imageText`。
- "中惠优势"：`grid`(4 列) + 每格 `image`(图标图) + `text`。
- "中惠印记"：`slider`。
- 图标不再用固定图标集，改为**上传图片**。

---

## 4. 渲染

- `Block` 类型改为**递归联合**；`renderBlock` 递归：容器渲染子组件，内容组件产 HTML。
- 区块渲染函数与样式**从现有 `index.html` 移植**（玫红主题，1:1 观感）。
- `richtext`：用 `@payloadcms/richtext-lexical` 的 HTML 序列化器把 Lexical JSON → HTML。
- 沿用 P1 的转义/URL 白名单（`esc` / `safeUrl` / `bgStyle`），所有文本与链接均经净化。

---

## 5. 静态媒体导出

- **生成时扫描**页面区块中引用的媒体（media 字段）→ 收集文件名。
- 从 `cms/media/<filename>` **复制**到 `dist/assets/media/<filename>`。
- 生成 HTML 时把 `/api/media/file/<name>` **重写**为 `/assets/media/<name>`。
- **站点级静态资源**（导航 Logo、页脚背景、装饰图案、favicon）放 `cms/static/`，生成时复制到 `dist/assets/`。
- 产物可**独立部署**（不依赖 CMS 运行时）。

---

## 6. 固定导航 / 页脚

- 新增 `cms/src/render/styles/nav.ts`、`footer.ts`：产出与 `index.html` 一致的 header / footer HTML（玫红主题，含 `中文 | EN` 语言项占位）。
- 菜单项与页脚内容先写成**集中常量**（便于 P4 替换为 Menu/SiteSettings 数据）。
- `renderPage` 输出完整结构：`header + main + footer`。

---

## 7. CSS / 主题边界

- 把 `index.html` 的完整样式移植进 `cms/src/render/styles/base.css`（`:root` 令牌 + 组件样式 + 区块背景交替规则）。
- P2 主题令牌为**静态值**（固定玫红）；后台可改主题属 P4。

---

## 8. 测试

延续 P1 的 vitest 方式（纯函数单测）：
- 每个区块渲染器：断言关键 HTML / 属性 / 转义。
- 嵌套：`grid` 渲染其槽内子组件（含内层 grid）→ 递归正确。
- `richtext`：Lexical JSON → HTML 正确，且不产生危险标签/属性。
- 媒体导出：URL 重写规则 + 复制清单正确。
- `buildSite`：完整页面（含 nav/footer）产出；`tsc --noEmit` 无错误。

---

## 9. P2 验收

- 在后台按现有 `index.html` 搭建一版"首页"配置（banner + grid 项目一览 + grid 中惠优势 + slider 中惠印记 …）。
- `npm run generate` → `dist/index.html`：
  - 含**导航栏与页脚**；
  - 区块布局与现有首页**观感一致**（玫红、背景交替）；
  - 图片来自 `dist/assets/media/`，路径正确、可离线打开。
- 用 Playwright 实测 / 截图佐证。

---

## 10. 已知取舍

- 容器嵌套上限**两层**。
- 主题令牌**静态**（P4 配置化）。
- 导航/页脚内容**固定**（改文案需改常量，P4 后可视化）。

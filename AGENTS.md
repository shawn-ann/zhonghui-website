# AGENTS.md

本文件为在此仓库中工作的 AI/开发者提供约定与速查。

## 项目简介

中惠文化门户网站 —— **Payload CMS + 静态生成** 的官网。
后台在 `cms/` 中配置页面、文章、菜单与站点设置，发布后由静态生成器输出到 `cms/releases/`。

## 关键文件

| 文件 | 说明 |
|---|---|
| `cms/` | Payload CMS、编辑器、渲染层与静态生成器 |
| `cms/src/render/styles/base.css` | 正式站配色、设计令牌与基础样式 |
| `img/` | 旧版原型与迁移脚本使用的图片素材 |
| `legacy/` | 旧版静态 HTML 原型（存档，不参与正式构建） |
| `docs/content-components.md` | **内容组件规则 / 放置关系 / 新增组件检查清单** |
| `docs/design-system.md` | **配色 / 设计令牌说明** |
| `docs/superpowers/specs/`、`docs/superpowers/plans/` | 设计文档与实现计划 |
| `中惠门户网站架构文档.md` | 站点整体架构（栏目、内容模型） |

正式站点由 `cms/` 生成；旧版页面统一放在 `legacy/`，不再维护。

## 本地预览与验证

```bash
# 后台（Docker）
# http://admin.localhost:8080/admin
# 静态站
# http://127.0.0.1:8080/
# 旧版原型（可选）
python3 -m http.server 8321 --bind 127.0.0.1
# http://127.0.0.1:8321/legacy/index.html
```

- 验证用 Playwright（`opencode.json` 已配 `@playwright/mcp`）。**Playwright 会拦截 `file://`，必须走 http 服务。**
- 改完组件/样式后重建静态站；若样式未更新，用带随机参数的 URL（如 `?v=2`）强制重载。

## 发布与自动构建

- 保存已发布页面/文章、分类、菜单或站点设置后，后台会在约 4 秒防抖后**自动重建**静态站；侧栏底部显示发布状态，可点「发布」手动兜底。
- 草稿保存不触发重建（静态站只包含已发布内容）。
- 批量脚本修改数据时设置 `DISABLE_AUTO_REBUILD=1`，避免触发构建。
- 修改区块/渲染器代码后需 `npm run build:generator` 并重启 builder 容器，构建服务才会加载新代码。

## 架构约定（务必遵循）

- **配置驱动**：页面由 CMS 的区块数组驱动，每块 `{ blockType, ...fields }`。
- **共享渲染层**：`cms/src/site/` 与 `cms/src/render/` 负责 React 渲染和静态 HTML 输出，编辑器预览与生成站复用同一套组件。
- **Banner 变体**：`variant` 选 `split`（左文右图，默认）或 `centered`（居中 + 全幅背景）。
- **富文本**：内容、文字颜色、段落对齐都在富文本编辑器内维护；不要新增区块级文字颜色字段。
- **图标**：通过媒体库上传 SVG，颜色优先由 CSS `currentColor` / `--accent` 控制。

## 设计令牌与配色（重要）

- **颜色集中在 `cms/src/render/styles/base.css` 的 `:root` 变量**，组件用 `var(--x)` 引用。**不要在组件里写死颜色**（`--accent` 例外用途见下）。
- 主题：**玫红主调**。核心令牌：`--deep-blue #8A0E4B`（标题）、`--bright-blue #C2185B`（文字链接）、`--accent #E60039`（图标/强调）、`--light-blue #FFF1F6`（浅底）、`--dark-text #5A4A52` / `--gray-blue #7C6B73`（暖玫灰正文）。
- **图标 / 强调统一走 `--accent`**：改这一个变量，图标描边、圆环、标签一并变色。
- 完整色板、区块背景、对比度、字体规范见 **`docs/design-system.md`**；改配色时**同步更新该文档**。
- 变量名（如 `--deep-blue`）沿用历史命名，值已是玫色系；不要因名字误解其用途。

## 布局标准（定版）

- **基准宽度 1200px**：全站各页的 `.container` 与 `.footer-grid` 一律 `max-width: 1200px`（`padding: 0 24px`），保证左右边距一致。
- **同一页面内** `.container` 与 `.footer-grid` 宽度必须相同。
- **文章详情页**（case-detail）：外层容器 1200px 使菜单/页脚对齐，正文用内层窄容器（约 820px）约束阅读宽度。
- 正式站点由 CMS 生成；旧版原型页已归档到 `legacy/`，不再维护。详见 `docs/design-system.md` 第 7 节。

## 区块背景交替规则（定版）

- **Banner 之下的区块背景交替**：第 1 块用**背景图** `img/yinji-bg.jpg`，第 2 块用**浅粉底** `#FFF1F6`（`.section-alt`），第 3 块背景图……依次交替，直到页脚。
- **页脚不参与**（固定玫红渐变）。
- 背景图区块：标题白字（`.title-on-image`），文字内容用白卡/白面板承托。
- 详见 `docs/design-system.md` 第 3.1 节。

## Git / 推送

- 分支：特性开发在 `feat/*` 分支（如 `feat/unified-section-background`）。
- **推送 GitHub 需经本地代理**（直连 SSL 会失败）：
  ```bash
  git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push
  ```
- `.gitignore` 已忽略：`*.pptx`、报价文档、`.playwright-mcp/`、`.superpowers/`、根目录各类调试截图（`*-*.png`）。

## 工作流

- 涉及新功能/视觉设计：先 `brainstorming`（可用可视化伴侣）→ 写 spec → `writing-plans` → 按任务实现。
- 配色/视觉这类需"看效果"的问题，优先用 Playwright 实测（读计算样式/几何），必要时生成整页截图对比。

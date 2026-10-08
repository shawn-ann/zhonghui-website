# AGENTS.md

本文件为在此仓库中工作的 AI/开发者提供约定与速查。

## 项目简介

中惠文化门户网站 —— **静态 HTML + 配置驱动** 的官网（无构建、无框架、无测试运行器）。
主页面 `index.html` 用一个内联的 `pageConfig`（模拟后端返回）驱动 `renderers` 逐块渲染。

## 关键文件

| 文件 | 说明 |
|---|---|
| `index.html` | 首页，包含全部 CSS、`pageConfig`、`bgStyle`/`shell` 工具、`renderers`、渲染入口 |
| `img/` | 图片素材（logo、背景图、项目图、banner 装饰 SVG 等） |
| `docs/design-system.md` | **配色 / 设计令牌的唯一权威来源** |
| `docs/superpowers/specs/`、`docs/superpowers/plans/` | 设计文档与实现计划 |
| `中惠门户网站架构文档.md` | 站点整体架构（栏目、内容模型） |

其它多页 `about.html` / `news.html` / `cases.html` / `contact.html` / `project-swt.html` 等**尚未同步**首页的新配色/菜单/页脚，属独立任务。

## 本地预览与验证

```bash
python3 -m http.server 8321 --bind 127.0.0.1
# 打开 http://127.0.0.1:8321/index.html
```

- 验证用 Playwright（`opencode.json` 已配 `@playwright/mcp`）。**Playwright 会拦截 `file://`，必须走 http 服务。**
- 改完 `index.html` 后刷新页面；若样式未更新，用带随机参数的 URL（如 `?v=2`）强制重载。

## 架构约定（务必遵循）

- **配置驱动**：页面由 `pageConfig.blocks` 数组驱动，每块 `{ type, data, options }`。
- **统一外壳**：所有区块经 `shell(b, innerHtml)` 产出 `<section>`；背景（图/纯色/渐变）走 `options.bg`（`bgStyle`）；浅底回退 `options.alt` → `.section-alt`。
- **Banner 变体**：`options.layout` 选 `"split"`（左文右图，默认）或 `"centered"`（居中+全幅背景）。
- **区块渲染器**：`renderers` 对象，每个 `type` 一个函数，只产出内容 HTML，外壳交给 `shell`。
- **图标**：中惠优势图标为**内联 SVG**（`advIcons` 映射 + `stroke="currentColor"`），颜色由 `--accent` 控制，不要用烘焙颜色的图片。

## 设计令牌与配色（重要）

- **颜色集中在 `index.html` 的 `:root` 变量**，组件用 `var(--x)` 引用。**不要在组件里写死颜色**（`--accent` 例外用途见下）。
- 主题：**玫红主调**。核心令牌：`--deep-blue #8A0E4B`（标题）、`--bright-blue #C2185B`（文字链接）、`--accent #E60039`（图标/强调）、`--light-blue #FFF1F6`（浅底）、`--dark-text #5A4A52` / `--gray-blue #7C6B73`（暖玫灰正文）。
- **图标 / 强调统一走 `--accent`**：改这一个变量，图标描边、圆环、标签一并变色。
- 完整色板、区块背景、对比度、字体规范见 **`docs/design-system.md`**；改配色时**同步更新该文档**。
- 变量名（如 `--deep-blue`）沿用历史命名，值已是玫色系；不要因名字误解其用途。

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

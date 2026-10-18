# React 统一渲染层实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 静态生成、预览、编辑器画布共用一套 React 渲染组件；画布不再整页重载。

**Architecture:** `src/site/` 提供 `SiteDocument`/`SiteBody`/block 组件；静态与预览用 `renderToStaticMarkup`，编辑器用 `createPortal` 挂进只创建一次的 iframe。

**Tech Stack:** React 19、Next 16、Vitest、renderToStaticMarkup。

---

### Task 1: 站点工具与导航/页脚组件

**Files:**
- Create: `cms/src/site/assets.ts`
- Create: `cms/src/site/nav.tsx`
- Create: `cms/src/site/footer.tsx`

- [ ] 迁移 `NAV_ITEMS`、`LANG_LINK`、`LOGO_SRC`、页脚常量。
- [ ] `SiteNav({ activeRoute })` 输出与 `renderNav` 等价 JSX（含 active、dropdown、caret）。
- [ ] `SiteFooter()` 输出与 `renderFooter` 等价 JSX。
- [ ] 测试：`renderToStaticMarkup(<SiteNav activeRoute="/about/" />)` 含 active、子菜单；页脚含地址/电话。

### Task 2: block 组件

**Files:**
- Create: `cms/src/site/BlockView.tsx`
- Create: `cms/src/site/blocks/*.tsx`
- Create: `cms/src/site/bg.ts`

- [ ] `bgCss(bg)` 返回 `{background}` 或 `{backgroundImage, backgroundSize, backgroundPosition}`。
- [ ] 逐块迁移：section/grid/banner/heading/text/image/imageText/iconCard/button/richtext/gallery/slider。
- [ ] `TopBlock`：section 原样；其他包 `.section` + `section-alt`。
- [ ] 保留 `data-bid`、`data-field`；richtext 用 `dangerouslySetInnerHTML`。
- [ ] 测试：逐块 `renderToStaticMarkup` 断言关键 class/href/data-field。

### Task 3: 文档与静态生成切换

**Files:**
- Create: `cms/src/site/SiteDocument.tsx`
- Modify: `cms/src/render/document.ts`
- Modify: `cms/src/render/layout.ts`

- [ ] `SiteDocument` 输出 `html/head/body`，head 资源与现有一致（外部 / 内联两种模式）。
- [ ] `renderDocument` 改为 `<!DOCTYPE html> + renderToStaticMarkup(<SiteDocument/>)`；`disableLinks` 保留。
- [ ] `renderPage` 复用 `renderDocument`。
- [ ] 运行现有 `src/render/__tests__` 并修正仅由空白差异导致的断言。
- [ ] `npx tsc --noEmit && npm test`。

### Task 4: 画布 portal

**Files:**
- Modify: `cms/src/editor/Canvas.tsx`

- [ ] `srcDoc` 改为常量（head 资源 + `#site-root`），不再依赖 `doc`。
- [ ] `onLoad` 获取 `#site-root`，`createPortal(<SiteBody page={doc}/>, root)`。
- [ ] `main#page` 上事件委托：click 选中、dblclick 内联编辑、dragstart/dragover/drop。
- [ ] 顶层 `draggable` + `data-idx` 由 effect 维护；选中态 effect 切换 `.ed-selected`。
- [ ] 移除 `handleLoad` 中的重绑与全量 `scrollToSelected`；仅在 `selectedId` 变化时滚动。
- [ ] 测试：`canvas.test.tsx` 保持 iframe/宽度/样式断言。

### Task 5: Swiper / 导航初始化幂等

**Files:**
- Modify: `cms/src/render/styles/main.js`

- [ ] `initSliders` 用 `el.__swiperReady` 防重复；`initNav` 用 `__navReady` 防重复。
- [ ] 暴露 `window.__zhSiteInit = init`。
- [ ] Canvas portal commit 后调用 `iframe.contentWindow.__zhSiteInit?.()`。

### Task 6: 清理旧渲染器

**Files:**
- Delete: `cms/src/render/blocks/*.ts`、`cms/src/render/nav.ts`、`cms/src/render/footer.ts`、`cms/src/render/shell.ts`、`cms/src/render/wrap.ts`
- Delete: 对应 `src/render/__tests__/*.test.ts`（由 site 测试替代）

- [ ] 确认无引用后删除；保留 `types.ts`、`richText.ts`、`document.ts`、`layout.ts`、`primitives.ts`。
- [ ] `npm test && npx tsc --noEmit`。

### Task 7: 验证

- [ ] Playwright：记录 iframe `load` 次数与 `scrollY`；添加分栏 / 子组件排序 / 改属性后不重载、不归零。
- [ ] Playwright：选中、双击改字、拖入分栏/网格、顶层排序正常。
- [ ] 静态生成输出抽查首页。

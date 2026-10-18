# React 统一渲染层设计

日期：2026-10-17

## 背景

编辑器画布目前把 `renderDocument()` 生成的整页 HTML 反复赋给 `<iframe srcDoc>`。
任何 `doc` 变化（添加分栏、排序、改属性）都会触发 iframe 整页重载：闪白、Swiper 重置、
滚动从顶部回跳。长期方案是把渲染层统一为 React 组件：

- 编辑器：iframe 只创建一次，用 `createPortal` 把同一套组件挂进 iframe；
- 静态生成 / 独立预览：用 `renderToStaticMarkup` 输出同一套组件。

做到「一份渲染，两处使用」，更新走 React diff，不再重载。

## 目标

1. 新增 `cms/src/site/` React 渲染层，取代 `src/render/blocks/*` 字符串渲染器。
2. 静态生成、`/preview/pages/:id`、编辑器画布共用组件。
3. 编辑器 iframe 不再随 `doc` 变化重载；滚动与 Swiper 状态保持。
4. 保留 `data-bid` / `data-field`，编辑交互改为 React/DOM 事件委托。
5. 输出与现网静态页面视觉一致。

## 非目标

- 不改动内容模型、Payload 字段、现有 CSS。
- 不引入第三方 DOM diff 库。
- 不改变静态生成的文件路由与资源路径。

## 架构

```
pageDoc ──► <SiteBody page /> ──► 静态生成 renderToStaticMarkup
                              └─► 预览页 SSR（附加 disableLinks 脚本）
                              └─► 编辑器 createPortal 到 iframe #site-root
```

### 组件

- `SiteDocument`：`<html><head>…</head><body><SiteBody/></body>`。
- `SiteBody`：`<SiteNav/> + <main id="page"> + <SiteFooter/>`。
- `SiteNav` / `SiteFooter`：现有 `nav.ts` / `footer.ts` 的 JSX 版本。
- `BlockView`：按 `type` 分发。
- `SectionView` / `GridCells` / `BannerView` / `HeadingView` / `TextView` /
  `ImageView` / `ImageTextView` / `IconCardView` / `ButtonView` / `RichTextView` /
  `GalleryView` / `SliderView`。
- `TopBlock`：顶层分栏直接渲染；非分栏（历史数据兜底）包 `.section` 外壳。

### 样式与工具

- `bgCss(bg)`：把现有 `bgDecl` 语义转换为 `React.CSSProperties`。
- `safeUrl()`、`esc()`、`NAV_ITEMS`、页脚常量从现有模块复用。
- 不使用 `dangerouslySetInnerHTML`，仅 `richtext` 的已消毒 HTML 例外。

### 静态生成

- `renderPage(page)` = `<!DOCTYPE html>` + `renderToStaticMarkup(<SiteDocument …/>)`。
- `renderDocument(page, assets)` 保持现有签名，内部改走 React SSR；
  `disableLinks` 仍追加链接拦截脚本。

### 预览页

- Next Route Handler 禁止导入 `react-dom/server`，因此预览改为 Server Component
  页面 `(frontend)/preview/pages/[id]/page.tsx`，直接渲染 `<SiteBody/>`。
- `(frontend)/layout.tsx` 提供 head 资源；Swiper/导航脚本由客户端
  `SiteScripts` 在水合后加载，避免 SSR DOM 被提前修改导致 hydration mismatch。
- 链接拦截改在 `SiteScripts` 的水合副作用中注册（仅预览）。

### 编辑器

- iframe `srcDoc` 常量，仅含 head 资源（`style.css`、Swiper、画布样式）与
  `<div id="site-root"></div>`。
- `onLoad` 后取 `#site-root`，`createPortal(<SiteBody page={doc}/>, root)`。
- `main#page` 上做事件委托：
  - click → 选中最近的 `[data-bid]`；
  - dblclick `[data-field]` → contenteditable 内联编辑，blur 提交；
  - dragstart/dragover/drop → 顶层排序 + 组件落入 section/grid（复用
    `resolveDropTarget` / `resolveDropContainer`）。
- 选中态：effect 在 `doc`/`selectedId` 变化后切换 `.ed-selected`。
- 滚动：仅在 `selectedId` 变化时 `scrollToSelected`，不再在重载后执行。
- 顶层块 `draggable=true`，不随 `doc` 重载重绑。
- Swiper / 移动导航：`main.js` 暴露幂等 `window.__zhSiteInit()`，
  portal commit 后调用。

## 分阶段

- A：React 组件 + 静态/预览 SSR；画布暂沿用字符串 `renderDocument`，测试保证输出一致。
- B：画布 portal + 事件委托，移除 `srcDoc` 更新与 `handleLoad` 重绑。
- C：删除旧字符串渲染器与旧测试，更新文档。

## 验收

- 添加分栏、子组件排序、属性修改时 iframe 不重载：`load` 计数不变、`scrollY` 不归零。
- 画布选中、双击改字、拖入分栏/网格、顶层排序均正常。
- 静态生成输出视觉一致；`npm test` 全绿、`tsc` 无错误。

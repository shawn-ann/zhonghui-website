# 网格空状态设计（A+D）

日期：2026-10-18

## 目标

新增网格后，在编辑器画布中立即可见，并能直观看到列数/间距；同时提供就近的添加入口。
仅编辑器可见，静态生成与独立预览不输出占位元素。

## 交互

- **空网格**：按列数渲染一整行虚线单元格（最小高度 120px），底部提示「网格 · N 列 · 暂无组件」。
- **非空网格**：正常渲染子组件，并把**最后一行补满**：占位格数 = `(列数 - 子组件数 % 列数) % 列数`。
- 底部提示「网格 · N 列」+「从右侧添加组件」（不做可点击按钮）。
- 点击空单元格或底部添加按钮：选中网格（右侧属性面板出现组件选择器），再从右侧添加。
- 仅在编辑器渲染：`SiteBody/Block/Section/Grid` 透传 `editor` 布尔值；静态/预览默认 false。

## 代码

- `src/site/SiteDocument.tsx`：`SiteBody({ page, editor })`。
- `src/site/blocks.tsx`：`TopBlock`/`blockNode`/`SectionView`/`GridView` 透传 `editor`；`GridView` 渲染占位与提示。
- `src/editor/Canvas.tsx`：portal 传 `editor`；`CANVAS_STYLE` 增加空状态样式。
- 测试：空网格 editor=true 输出 N 个占位；editor=false 不输出；非空网格输出提示但不输出占位。

# 子组件添加入口重构设计

日期：2026-10-18

## 背景

左侧组件库依赖跨 iframe 拖拽，容易拖错层级/拖到分栏外；右侧添加子组件只有下拉名称，不够直观。
本次收敛为两层结构，并把组件添加统一到右侧可视化选择器。

## 规则

- **分栏（section）** 直接子组件：标题、网格、图集、横幅、轮播、富文本。
- **网格（grid）** 直接子组件：标题、文本、图片、图文卡片、图标卡片、按钮。
- 旧数据不强制迁移；仅新增入口按新规则限制。

## 交互

### 左侧
- 删除组件库（`Palette`），左栏只保留结构树并占满高度。
- 分栏新增仍用结构树的「＋ 分栏」。

### 右侧
- 选中分栏/网格时，在「子组件」列表下方显示「添加组件」缩略图卡片选择器。
- 仅显示 `allowedChildTypes(container.type)` 中的组件。
- 点击卡片：追加到容器末尾 → 自动选中新组件 → 右侧切换到其属性。
- 选中内容组件或未选中时，不显示选择器。

### 画布
- 移除组件拖放（`text/x-block`）与落点高亮。
- 保留分栏顶层拖动排序。
- 子组件顺序继续用结构树/属性面板的 ↑↓。

## 数据与代码

- `cms/src/blocks/index.ts`：`sectionChildren` 收敛为标题/网格/图集/横幅/轮播/富文本。
- `cms/src/blocks/Grid.ts`：grid 子组件收敛为标题/文本/图片/图文/图标/按钮；保留 `GridInner` 定义以兼容历史数据，但编辑器不再提供嵌套网格。
- `cms/src/editor/blocks.ts`：`SECTION_CHILD_TYPES` / `GRID_CHILD_TYPES` 与 `allowedChildTypes` 同步；删除 `PAGE_BLOCKS`、`CONTAINER_CHILD_TYPES`。
- 新增 `cms/src/editor/AddChildPicker.tsx`：缩略图卡片选择器（复用原组件库缩略图）。
- `PropertyPanel`：用选择器替换“下拉 + 添加”，移除下拉状态。
- `PageEditor`：`onAddChild` 预生成 id、`insertInto` 后 `setSelectedId`；移除 `Palette`。
- `Canvas`：移除 `onAddInto`、`resolveDropTarget`/`resolveDropContainer`、`text/x-block` 监听；删除 `dropTarget.ts` 与其测试。

## 验收

- 左侧无组件库；分栏/网格右侧出现对应缩略图选择器。
- 分栏只能看到 6 项，网格只能看到 6 项（不含富文本/图集/轮播/横幅/网格）。
- 点击添加后组件出现在末尾并被选中。
- 画布仍可拖动分栏排序；组件拖放不再生效。
- 全量测试 + `tsc` 通过。

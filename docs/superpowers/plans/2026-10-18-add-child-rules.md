# 子组件添加入口重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 收敛分层规则，删除左侧组件库，改为右侧缩略图卡片添加子组件。

**Architecture:** 编辑器与 Payload 同步收敛允许的子组件类型；`AddChildPicker` 复用缩略图提供可视化添加；画布移除组件拖放，仅保留分栏排序。

**Tech Stack:** React、Payload、Vitest。

---

### Task 1: 规则收敛

**Files:**
- Modify: `cms/src/editor/blocks.ts`
- Modify: `cms/src/blocks/index.ts`
- Modify: `cms/src/blocks/Grid.ts`

- [ ] 编辑器新增：
  ```ts
  export const SECTION_CHILD_TYPES = ['heading', 'grid', 'gallery', 'banner', 'slider', 'richtext']
  export const GRID_CHILD_TYPES = ['heading', 'text', 'image', 'imageText', 'iconCard', 'button']
  ```
  `allowedChildTypes` 返回对应数组；删除 `CONTENT_TYPES`、`PAGE_BLOCKS`、`CONTAINER_CHILD_TYPES`。
- [ ] Payload `sectionChildren = [HeadingBlock, Grid, GalleryBlock, BannerBlock, SliderBlock, RichTextBlock]`。
- [ ] Payload grid children = `[HeadingBlock, TextBlock, ImageBlock, ImageTextBlock, ButtonBlock, IconCardBlock]`，保留 `GridInner` 定义（历史数据兼容），但不放入编辑器允许项。
- [ ] 更新 `blocks-meta.test.ts` 断言两组允许项。

### Task 2: 缩略图选择器

**Files:**
- Create: `cms/src/editor/AddChildPicker.tsx`
- Modify: `cms/src/editor/PropertyPanel.tsx`
- Delete: `cms/src/editor/Palette.tsx`
- Delete: `cms/src/editor/__tests__/palette.test.tsx`

- [ ] 从 `Palette.tsx` 迁移 `THUMBS` 到 `AddChildPicker.tsx`。
- [ ] `AddChildPicker({ types, onAdd })` 渲染两列缩略图按钮，标题「添加组件」。
- [ ] `PropertyPanel` 容器分支底部用 `<AddChildPicker types={allowed} onAdd={onAddChild} />` 替换下拉 + 添加；删除 `addType` 状态与相关控件。
- [ ] 测试：分栏显示 6 项、网格显示 6 项、点击回调类型正确。

### Task 3: 添加后选中

**Files:**
- Modify: `cms/src/editor/PageEditor.tsx`

- [ ] `onAddChild`：`const block = { ...BLOCKS[type].defaults(), _id: newId() }`，`update(insertInto(...))` 后 `setSelectedId(block._id)`。
- [ ] 移除 `Palette` 导入与渲染；左栏仅 `<StructureTree/>`。

### Task 4: 画布清理

**Files:**
- Modify: `cms/src/editor/Canvas.tsx`
- Delete: `cms/src/editor/dropTarget.ts`
- Delete: `cms/src/editor/__tests__/dropTarget.test.ts`
- Modify: `cms/src/editor/editor.css`

- [ ] 移除 `onAddInto` prop、`resolveDrop*` 导入、所有 `text/x-block` 的 dragover/drop 监听与 `ed-drop-zone` 样式。
- [ ] 保留顶层 `draggable` 与 `text/x-reorder` 排序。
- [ ] 删除 `PageEditor` 传入的 `onAddInto`。
- [ ] `tsc` 与测试通过。

### Task 5: 验证

- [ ] `npm test`、`npx tsc --noEmit`。
- [ ] Playwright：左栏无组件库；选中分栏/网格出现对应缩略图；点击添加后末尾新增且被选中；分栏可拖动排序。

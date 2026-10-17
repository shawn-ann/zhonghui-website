# 编辑器：结构树 + 明显选中 + 子组件管理 设计文档

> 日期：2026-10-16
> 状态：待评审
> 前置：E2 画布编辑器 + 分栏/标题（分支 `feat/cms-p1`）
> 关联：`docs/superpowers/specs/2026-10-16-visual-editor-design.md`

---

## 1. 背景与问题

当前编辑器：
- **选中不明显**：仅 `2px` 同色描边（`Canvas.tsx` `.ed-selected`），在背景图/深色/密集内容上难辨整块边界。
- **内层元素不直观**：所有 `[data-bid]` 点击即选中且 `stopPropagation`，想选外层容器只能点空白边；没有整页层级视图。
- **不能指定位置添加**：组件库/面板添加均为追加；无层级浏览。

目标：加**左侧结构树**导航、**明显选中高亮**、并明确"由组件自身面板管理其子组件"。

## 2. 组件分类（正式化）

- **layout（布局容器）**：`section`、`grid`。可在其面板增删/排序子组件。
- **content（内容组件）**：`heading`、`text`、`image`、`imageText`、`button`、`richtext`、`gallery`、`slider`。叶子。
- **放置规则**：
  - `section.children` = content + `grid`（不含 `section`/`banner`）。
  - `grid` 的单元格 = content。
  - **`section` 不可嵌套 `section`**。
- **统一常量**：`LAYOUT_TYPES`、`CONTENT_TYPES`，驱动组件库、结构树、面板可选项（取代零散的 `CONTAINER_CHILD_TYPES`）。

## 3. 左侧"结构"面板

- 位于组件库下方（或与其并列的折叠区），展示当前页整棵块树：
  - 树形缩进：`section › heading / grid › imageText …`。
  - 每节点：**类型标签** + **摘要**（heading/text 取标题/正文前若干字；image 取 alt；grid/section 取类型名）。
  - layout 节点可**展开/折叠**。
- **点击节点 → 选中**：同步画布高亮与右侧属性面板。
- **hover 显示 ✕ 删除**（调用按路径删除）。
- **不负责插入**（插入在右侧面板）。
- 无选中时显示"未选中"。

## 4. 画布选中高亮（更明显）

- **选中**：`outline: 3px solid #1E6FFF`（`outline-offset:-3px`）+ **半透明高亮底色** `rgba(30,111,255,.08)` + **左上角类型标签**（蓝底白字，如「分栏 / 网格 / 图文卡片」）。
- **悬停**：`outline: 2px dashed #1E6FFF` 预览（不改变选中）。
- **颜色说明**：选蓝色因与站点玫粉主色互补，在浅/粉/深底都醒目（避免玫红描边与玫粉背景混淆）。
- 点击画布内块 → 选中该块；选祖先用左树。
- 实现：继续用注入 iframe 的 CSS 类（`.ed-selected` / `.ed-hover`）；类型标签用父级 overlay（复用现有 toolbar 定位，除以缩放比）。

## 5. 右侧属性面板

- 编辑选中项字段（现有通用控件）。
- 若选中 **layout**：显示**子组件列表**：
  - 每项：名称 + `↑↓`（同级排序）+ `✕`（删除）。
  - **添加子组件**：选择类型（受放置规则限制）→ **追加到末尾**。
- 内容组件：仅字段。

## 6. 交互流程

1. **选**：左树点选 或 画布点选 → 高亮 + 右面板联动。
2. **增**：选中容器 → 右面板选类型 → 添加（末尾）。
3. **删**：左树 ✕ 或 右面板 ✕（按路径删除，含嵌套）。
4. **排序**：右面板 ↑↓。
5. **改**：右面板字段 / 画布双击内联改字。

## 7. 实现要点

- 复用已有的路径工具（`state.ts` 的 `findPath/getAtPath/updateAtPath/removeAtPath/insertInto/blockChildren/childPath/moveChild`）与 `data-bid`。
- 结构树由 `EditorDoc.blocks` 递归渲染（纯展示 + 选中/删除回调）；布局节点展开状态本地维护。
- `CONTAINER_CHILD_TYPES` 收敛为基于 `LAYOUT_TYPES/CONTENT_TYPES` 的规则函数 `allowedChildTypes(parentType)`。
- 选中标签与删除工具条共用 overlay 几何（考虑 `scale`）。

## 8. 测试与验收

- 单测：`allowedChildTypes` 规则；结构树递归渲染/选中/删除回调；摘要文案函数。
- 组件测试：选中某节点 → 右面板显示对应字段；容器 → 子项列表可增删排序。
- 端到端：选中 section → 画布高亮明显（含标签）→ 左树显示层级 → 面板添加 heading（末尾）→ ↑↓ 调整 → 删除。
- `npm test` + `tsc` 绿。

## 9. 范围外

- 画布/树内**拖拽**（insert 到任意位置）——后续。
- `grid` 多单元格分别管理（仍按第一 cell 处理）。
- 菜单/主题配置化、汉化、集合（父设既有阶段）。
- 选中时"压暗其余区域"的聚光效果（未采用）。

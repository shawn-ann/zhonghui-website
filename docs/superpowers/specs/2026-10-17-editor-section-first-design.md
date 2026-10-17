# 编辑器「分栏优先」结构设计

日期：2026-10-17

## 背景

当前编辑器允许任意组件拖到页面顶层，导致内容散落在分栏之外，站点结构混乱。
实际首页数据（`cms/scripts/seed-home.ts`）已经是「顶层只有分栏，banner/内容都在分栏内」。
本次将编辑器收敛为该结构：**顶层只允许分栏，组件只能放进分栏或 grid**。

## 目标

1. 结构树增加「页面根目录」，分栏作为其子节点。
2. 组件库只保留拖拽，不再支持点击添加。
3. 组件只能拖入 `section` / `grid` 容器。
4. 历史数据一次性迁移为分栏优先结构，不做运行时兼容。

## 非目标

- 不实现画布内跨容器拖拽排序（组件仍通过属性面板上下移动）。
- 不做运行时 normalize / 旧数据兼容层。
- 不改变 grid 的列数、间距等既有能力。

## 交互设计

### 结构树

- 顶部显示「页面根目录」节点，展示分栏数量。
- 分栏作为根目录的子节点显示，原有层级（分栏 → grid → 组件）保持不变。
- 点击根目录：清空区块选中，属性面板显示“未选中”。
- 「＋ 添加分栏」：
  - 根目录选中或未选中任何区块 → 追加到根目录末尾。
  - 选中分栏或其内部组件 → 插入到该组件所属的**顶层分栏之后**。
- 分栏的 ↑ / ↓ 排序、删除、展开/折叠保持现状。

### 组件库

- 去掉点击添加（移除 `onAdd`）。
- 组件卡片仅可拖拽（`text/x-block`）。
- 左栏顺序调整为：结构树在上（占满剩余高度、可滚动），组件库在下（限高 45%）。

### 画布拖拽

- 拖动组件时，所有 `section` / `grid` 显示蓝色虚线落点（`ed-drop-zone`）。
- 落点规则：
  - 落在容器本身 → 追加到该容器子节点末尾。
  - 落在容器内某个组件上 → 插入到该组件之后（同父级）。
  - 落在顶层非分栏块、导航、页脚、页面空白 → 不接收。
- 拖入前校验 `allowedChildTypes(container.type)`；不允许的类型静默忽略。
- 分栏顶层排序（`text/x-reorder`）保持现状，仅对顶层分栏生效。

## 数据迁移

- 一次性脚本 `cms/scripts/normalize-pages.ts`。
- 对每个页面：顶层非 `section` 块包进新分栏：
  - `banner` → 新分栏 `paddingY: 'none'`；其余 → `'md'`。
  - 原块的 `bg` / `alt` 移到新分栏上。
  - 原块 `_id` 保留，新分栏生成新 id。
- 脚本执行后数据即符合新结构；代码中不保留兼容逻辑。
- 当前库（page 6）顶层已全是分栏，脚本预计 0 变更。

## 代码边界

- `cms/src/editor/dropTarget.ts`（新增）：纯函数 `resolveDropTarget(blocks, targetId, type)`，返回 `{ parentId, index } | null`。
- `cms/src/editor/StructureTree.tsx`：根目录节点、添加分栏语义。
- `cms/src/editor/Palette.tsx`：移除点击添加。
- `cms/src/editor/Canvas.tsx`：容器落点监听、高亮、调用 `onAddInto`。
- `cms/src/editor/PageEditor.tsx`：左栏顺序、`onAddInto`、`addSection` 插入位置。
- `cms/src/editor/editor.css`：左栏样式、`ed-drop-zone`、根目录行。
- `cms/scripts/normalize-pages.ts`（新增）：一次性迁移。

## 验收

- 组件库点击无反应；拖拽只能落入分栏/grid。
- 根目录下添加分栏 → 末尾；选中分栏添加 → 其后。
- 拖到分栏空白 → 追加；拖到组件上 → 插到其后。
- 顶层无法新增/放入非分栏组件。
- `npm test` 全绿，`npx tsc --noEmit` 无错误。

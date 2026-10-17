# 编辑器「分栏优先」实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 顶层只允许分栏，组件只能拖入 section/grid；结构树增加根目录；历史数据一次性迁移。

**Architecture:** 新增纯函数 `resolveDropTarget` 决定拖放落位；结构树增加根节点并调整添加分栏的插入索引；组件库移除点击；画布对容器挂 drop 监听。

**Tech Stack:** Next 16 / React / Payload 3 / Vitest。

---

### Task 1: 落点解析纯函数

**Files:**
- Create: `cms/src/editor/dropTarget.ts`
- Test: `cms/src/editor/__tests__/dropTarget.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, it, expect } from 'vitest'
import { resolveDropTarget } from '../dropTarget'
import type { Block } from '../types'

const blocks: Block[] = [
  { type: 'section', _id: 's1', children: [
    { type: 'heading', _id: 'h1', title: 'A' },
    { type: 'grid', _id: 'g1', columns: 3, children: [
      { type: 'text', _id: 't1', body: 'x' },
    ] },
  ] },
]

describe('resolveDropTarget', () => {
  it('appends into a container', () => {
    expect(resolveDropTarget(blocks, 's1', 'text')).toEqual({ parentId: 's1', index: 2 })
    expect(resolveDropTarget(blocks, 'g1', 'text')).toEqual({ parentId: 'g1', index: 1 })
  })
  it('inserts after a content block in its parent', () => {
    expect(resolveDropTarget(blocks, 'h1', 'text')).toEqual({ parentId: 's1', index: 1 })
    expect(resolveDropTarget(blocks, 't1', 'image')).toEqual({ parentId: 'g1', index: 1 })
  })
  it('rejects top-level non-container and disallowed types', () => {
    const legacy: Block[] = [{ type: 'text', _id: 'top', body: 'x' }]
    expect(resolveDropTarget(legacy, 'top', 'text')).toBeNull()
    expect(resolveDropTarget(blocks, 'g1', 'section')).toBeNull()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `cd cms && npx vitest run src/editor/__tests__/dropTarget.test.ts`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现**

```ts
import { allowedChildTypes, isLayout } from './blocks'
import { findPath, getAtPath, blockChildren } from './state'
import type { Block } from './types'

export function resolveDropTarget(
  blocks: Block[],
  targetId: string,
  type: Block['type'],
): { parentId: string; index: number } | null {
  const path = findPath(blocks, targetId)
  if (!path) return null
  const target = getAtPath(blocks, path)
  if (!target) return null

  if (isLayout(target.type)) {
    if (!allowedChildTypes(target.type).includes(type)) return null
    return { parentId: target._id!, index: blockChildren(target).length }
  }

  if (path.length < 2) return null
  const parent = getAtPath(blocks, path.slice(0, -1))
  if (!parent || !isLayout(parent.type)) return null
  if (!allowedChildTypes(parent.type).includes(type)) return null
  return { parentId: parent._id!, index: path[path.length - 1] + 1 }
}
```

- [ ] **Step 4: 运行通过**

Run: `cd cms && npx vitest run src/editor/__tests__/dropTarget.test.ts`

- [ ] **Step 5: 提交**

```bash
git add cms/src/editor/dropTarget.ts cms/src/editor/__tests__/dropTarget.test.ts
git commit -m "feat(editor): add resolveDropTarget for container-only drops"
```

### Task 2: 结构树根目录与添加分栏

**Files:**
- Modify: `cms/src/editor/StructureTree.tsx`
- Modify: `cms/src/editor/__tests__/structure-tree.test.tsx`

- [ ] **Step 1: 更新测试**：根目录渲染、点击根目录触发 `onSelectRoot`、顶层分栏缩进后仍可上移。
- [ ] **Step 2: 实现**
  - 新增 props：`onSelectRoot?: () => void`。
  - 渲染根行（`ed-tree-root`），`!selectedId` 时高亮；点击调用 `onSelectRoot`。
  - 顶层分栏 `depth={1}`，`Node` 内 `isTop = depth === 1`。
  - 删除行仍不可用于根目录。
- [ ] **Step 3: 运行** `npx vitest run src/editor/__tests__/structure-tree.test.tsx`
- [ ] **Step 4: 提交** `feat(editor): add page root node to structure tree`

### Task 3: 组件库仅拖拽

**Files:**
- Modify: `cms/src/editor/Palette.tsx`
- Modify: `cms/src/editor/__tests__/palette.test.tsx`
- Modify: `cms/src/editor/PageEditor.tsx`

- [ ] **Step 1: 测试**：卡片带 `draggable`；点击不触发任何回调（移除 onAdd 后编译即保证）。
- [ ] **Step 2: 实现**
  - `Palette` 移除 `onAdd` prop 和 `onClick`，保留 `onDragStart` 设置 `text/x-block`。
  - `PageEditor` 移除 `onAdd`，左栏改为 `<StructureTree/>` 在上、`<Palette/>` 在下。
- [ ] **Step 3: 运行** `npx vitest run src/editor/__tests__/palette.test.tsx`
- [ ] **Step 4: 提交** `feat(editor): palette drag-only; structure tree above palette`

### Task 4: 画布只接受容器落点

**Files:**
- Modify: `cms/src/editor/Canvas.tsx`
- Modify: `cms/src/editor/PageEditor.tsx`
- Modify: `cms/src/editor/editor.css`

- [ ] **Step 1: Canvas 新增** `onAddInto?: (parentId: string, type: Block['type'], index: number) => void`。
- [ ] **Step 2: 在 `handleLoad` 中** 对所有 `[data-bid]` 挂 `dragenter/dragover/dragleave/drop`（仅 `text/x-block`）：
  - 用 `resolveDropTarget(doc.blocks, id, type)` 判定；有效时给容器加 `ed-drop-zone`。
  - drop 时 `preventDefault` + `stopPropagation`，调用 `onAddInto`，清除高亮。
  - iframe 内 `dragend` 清除全部高亮。
- [ ] **Step 3: 顶层监听**保留 `text/x-reorder`，移除旧的 `text/x-block` 顶层新增。
- [ ] **Step 4: PageEditor `onAddInto`**：`findPath` → `insertInto(doc.blocks, parentPath, {...defaults, _id:newId()}, index)`，并选中新块。
- [ ] **Step 5: CSS**：`.ed-drop-zone`、根行、左栏顺序（tree flex 1 + border-bottom；palette max-height 45% + border-top）。
- [ ] **Step 6: 运行** `npx tsc --noEmit && npm test`
- [ ] **Step 7: 提交** `feat(editor): restrict component drops to section/grid containers`

### Task 5: 添加分栏插入位置

**Files:**
- Modify: `cms/src/editor/PageEditor.tsx`

- [ ] **Step 1: 实现** `addSection`：`index = selectedPath ? selectedPath[0] + 1 : doc.blocks.length`，用 `addBlock` 插入。
- [ ] **Step 2: 行为验证**：选中分栏/内部组件 → 其后；根目录/未选中 → 末尾。
- [ ] **Step 3: 提交** `feat(editor): insert new section after selected section`

### Task 6: 历史数据一次性迁移

**Files:**
- Create: `cms/scripts/normalize-pages.ts`

- [ ] **Step 1: 实现脚本**：读取所有页面；顶层非 `section` 块包进新分栏（banner → `paddingY:none`，其余 `md`；`bg/alt` 上移），`payload.update` 写回。
- [ ] **Step 2: 运行** `cd cms && npx tsx scripts/normalize-pages.ts`；无旧数据时输出 0 变更。
- [ ] **Step 3: 提交** `chore(cms): add one-off page block normalization script`

### Task 7: 全量验证

- [ ] `cd cms && npm test`
- [ ] `cd cms && npx tsc --noEmit`
- [ ] Playwright：拖拽组件入分栏/ grid；拖到顶层无反应；根目录/选中分栏添加分栏位置正确。

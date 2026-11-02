# 编辑器：结构树 + 明显选中 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给画布编辑器加**左侧结构树**（层级浏览/选中/删除）、**明显的蓝色选中高亮**（描边+高亮底+类型标签+悬停虚线），并明确"右面板管理子组件（末尾追加+排序）"。

**Architecture:** 以 `LAYOUT_TYPES`/`CONTENT_TYPES` 正式区分容器与内容；新增 `StructureTree` 组件（基于 `EditorDoc.blocks` 递归渲染，纯展示 + 回调）；`Canvas` 增强选中样式与悬停；`PageEditor` 组合 `组件库 + 结构树 | 画布 | 属性面板`。

**Tech Stack:** React 19、TypeScript、Vitest + Testing Library（jsdom）。

**前置：** E2 编辑器 + 分栏/标题（分支 `feat/cms-p1`，116 tests 绿）。
**设计依据：** `docs/superpowers/specs/2026-10-16-editor-structure-tree-design.md`。
**工作目录：** 相对 `cms/`。

---

## Task 1: 组件分类常量 + 允许规则 + 摘要

**Files:** `src/editor/blocks.ts`, `src/editor/PropertyPanel.tsx`, `src/editor/__tests__/blocks-meta.test.ts`

- [ ] **Step 1: 在 `src/editor/blocks.ts` 增加**
```ts
export const LAYOUT_TYPES = ['section', 'grid'] as const
export const CONTENT_TYPES = [
  'heading', 'text', 'image', 'imageText', 'button', 'richtext', 'gallery', 'slider',
] as const

export function isLayout(type: Block['type']): boolean {
  return (LAYOUT_TYPES as readonly string[]).includes(type)
}

/** 依据放置规则返回某容器允许的子组件类型。 */
export function allowedChildTypes(parent: Block['type']): Block['type'][] {
  if (parent === 'section') return [...CONTENT_TYPES, 'grid'] as Block['type'][]
  if (parent === 'grid') return [...CONTENT_TYPES] as Block['type'][]
  return []
}

/** 结构树节点摘要。 */
export function blockSummary(b: Block): string {
  switch (b.type) {
    case 'heading': return b.title || '标题'
    case 'text': return b.title || b.body || '文本'
    case 'image': return b.altText || '图片'
    case 'imageText': return b.title || '图文卡片'
    case 'button': return b.label || '按钮'
    case 'gallery': return `图集 · ${b.images.length} 张`
    case 'slider': return `轮播 · ${b.images.length} 张`
    case 'grid': return `网格 · ${b.columns} 列`
    case 'section': return '分栏'
    case 'banner': return b.title || '横幅'
    case 'richtext': return '富文本'
    default: return b.type
  }
}
```
截断摘要到 ~12 字（`blockSummary` 后 `.slice(0,12)` 由调用方做）。

- [ ] **Step 2: `PropertyPanel` 改用 `allowedChildTypes`**
把 `const allowed = isContainer ? CONTAINER_CHILD_TYPES[block.type] : []` 改为：
```ts
const allowed = isLayout(block.type) ? allowedChildTypes(block.type) : []
```
（可移除对 `CONTAINER_CHILD_TYPES` 的依赖；若其他地方仍用，保留导出。）

- [ ] **Step 3: 测试 `src/editor/__tests__/blocks-meta.test.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { isLayout, allowedChildTypes, blockSummary } from '../blocks'

describe('component categories', () => {
  it('classifies layout vs content', () => {
    expect(isLayout('section')).toBe(true)
    expect(isLayout('grid')).toBe(true)
    expect(isLayout('image')).toBe(false)
  })
  it('allowed children: section = content + grid; grid = content', () => {
    expect(allowedChildTypes('section')).toContain('grid')
    expect(allowedChildTypes('section')).toContain('heading')
    expect(allowedChildTypes('grid')).not.toContain('section')
    expect(allowedChildTypes('grid')).not.toContain('grid')
    expect(allowedChildTypes('image')).toEqual([])
  })
  it('summary for text/heading', () => {
    expect(blockSummary({ type: 'heading', title: '项目一览' } as any)).toBe('项目一览')
    expect(blockSummary({ type: 'grid', columns: 3 } as any)).toContain('3')
  })
})
```

- [ ] **Step 4: 运行 + 提交**
`npm test && npx tsc --noEmit`
```bash
git add src/editor/blocks.ts src/editor/PropertyPanel.tsx src/editor/__tests__/blocks-meta.test.ts
git commit -m "feat(editor): component categories + allowed child types + summaries"
```

---

## Task 2: 结构树组件

**Files:** `src/editor/StructureTree.tsx`, `src/editor/__tests__/structure-tree.test.tsx`, `src/editor/editor.css`

- [ ] **Step 1: 实现 `src/editor/StructureTree.tsx`**
```tsx
'use client'
import React, { useState } from 'react'
import { BLOCKS, blockSummary, isLayout } from './blocks'
import { blockChildren } from './state'
import type { Block } from './types'

function Node({
  block, depth, selectedId, onSelect, onDelete, expanded, toggle,
}: {
  block: Block
  depth: number
  selectedId?: string
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  expanded: Set<string>
  toggle: (id: string) => void
}) {
  const id = block._id || ''
  const layout = isLayout(block.type)
  const children = layout ? blockChildren(block) : []
  const open = expanded.has(id)
  const label = BLOCKS[block.type]?.label ?? block.type
  const summary = (blockSummary(block) || '').slice(0, 12)
  return (
    <div>
      <div
        className={`ed-tree-row${selectedId === id ? ' is-selected' : ''}`}
        style={{ paddingLeft: 6 + depth * 14 }}
        onClick={() => id && onSelect(id)}
      >
        {layout && children.length > 0 ? (
          <button className="ed-tree-caret" onClick={(e) => { e.stopPropagation(); id && toggle(id) }}>{open ? '▾' : '▸'}</button>
        ) : <span className="ed-tree-caret" />}
        <span className="ed-tree-label">{label}</span>
        {summary ? <span className="ed-tree-summary">{summary}</span> : null}
        <button className="ed-tree-del" title="删除" onClick={(e) => { e.stopPropagation(); id && onDelete(id) }}>✕</button>
      </div>
      {layout && open ? children.map((c) => (
        <Node key={c._id} block={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} onDelete={onDelete} expanded={expanded} toggle={toggle} />
      )) : null}
    </div>
  )
}

export default function StructureTree({
  blocks, selectedId, onSelect, onDelete,
}: {
  blocks: Block[]
  selectedId?: string
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(blocks.map((b) => b._id || '')))
  const toggle = (id: string) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  return (
    <div className="ed-tree">
      <div className="ed-label">结构</div>
      {blocks.length === 0 ? <p className="ed-muted">暂无区块</p> : null}
      {blocks.map((b) => (
        <Node key={b._id} block={b} depth={0} selectedId={selectedId} onSelect={onSelect} onDelete={onDelete} expanded={expanded} toggle={toggle} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: `editor.css` 追加**
```css
.ed-tree { padding: 8px; border-top: 1px solid #eee; overflow: auto; }
.ed-tree-row { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 4px; cursor: pointer; font-size: 12px; }
.ed-tree-row:hover { background: #f4f4f4; }
.ed-tree-row.is-selected { background: #e7f0ff; box-shadow: inset 3px 0 0 #1E6FFF; }
.ed-tree-caret { width: 14px; background: none; border: 0; cursor: pointer; color: #888; padding: 0; }
.ed-tree-label { color: #333; }
.ed-tree-summary { color: #aaa; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ed-tree-del { margin-left: auto; border: 0; background: none; color: #bbb; cursor: pointer; }
.ed-tree-row:hover .ed-tree-del { color: #E60039; }
```
（`ed-tree` 高度/滚动由父布局控制；见 Task 4。）

- [ ] **Step 3: 测试 `structure-tree.test.tsx`**
```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StructureTree from '../StructureTree'

const blocks: any[] = [
  { type: 'section', _id: 's1', padding: 'md', children: [
    { type: 'heading', _id: 'h1', title: '项目一览' },
    { type: 'grid', _id: 'g1', columns: 3, cells: [{ components: [{ type: 'imageText', _id: 'i1', media: '', title: '美国 AuPair' }] }] },
  ] },
]

describe('StructureTree', () => {
  it('renders hierarchy with summaries', () => {
    render(<StructureTree blocks={blocks} onSelect={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('项目一览')).toBeTruthy()
    expect(screen.getByText('美国 AuPair')).toBeTruthy()
  })
  it('selects on click and deletes via ✕', () => {
    const onSelect = vi.fn(); const onDelete = vi.fn()
    render(<StructureTree blocks={blocks} onSelect={onSelect} onDelete={onDelete} />)
    fireEvent.click(screen.getByText('项目一览'))
    expect(onSelect).toHaveBeenCalled()
    const delBtns = screen.getAllByTitle('删除')
    fireEvent.click(delBtns[0])
    expect(onDelete).toHaveBeenCalled()
  })
})
```

- [ ] **Step 4: 运行 + 提交**
```bash
git add src/editor/StructureTree.tsx src/editor/editor.css src/editor/__tests__/structure-tree.test.tsx
git commit -m "feat(editor): structure tree (hierarchy select + delete)"
```

---

## Task 3: 画布选中高亮（蓝）+ 悬停虚线 + 类型标签

**Files:** `src/editor/Canvas.tsx`, `src/editor/editor.css`, `src/editor/__tests__/canvas.test.tsx`

- [ ] **Step 1: 注入样式与悬停**
`Canvas.tsx` `handleLoad` 中把注入的样式改为：
```ts
s.textContent = `.ed-selected{outline:3px solid #1E6FFF;outline-offset:-3px;background:rgba(30,111,255,.08)} .ed-hover{outline:2px dashed #1E6FFF;outline-offset:-2px}`
```
并给所有 `[data-bid]` 加 hover：
```ts
el.addEventListener('mouseenter', () => { if (el.getAttribute('data-bid') !== selectedId) el.classList.add('ed-hover') })
el.addEventListener('mouseleave', () => el.classList.remove('ed-hover'))
```
（`applySelection` 仍 toggle `.ed-selected`。）

- [ ] **Step 2: 类型标签（父级 overlay）**
新增 prop `selectedLabel?: string`。当 `selectedId` 存在且有 `selectedLabel` 时，在选中块左上加标签（与删除工具条同一 overlay 定位）：
```tsx
{toolbar ? (
  <div className="ed-block-overlay" style={{ top: toolbar.top, left: toolbar.left }}>
    <span className="ed-block-badge">{selectedLabel || '区块'}</span>
    <button type="button" className="ed-block-del" onClick={deleteSelected}>删除</button>
  </div>
) : null}
```
（把原 `.ed-block-toolbar` 改为 `.ed-block-overlay`，含 badge + 删除。）

- [ ] **Step 3: `editor.css`**
```css
.ed-block-overlay { position: absolute; display: flex; gap: 6px; align-items: center; transform: translateY(-100%); }
.ed-block-badge { background: #1E6FFF; color: #fff; font-size: 10px; padding: 1px 8px; border-radius: 3px; }
.ed-block-del { background: #fff; border: 1px solid #1E6FFF; color: #1E6FFF; font-size: 10px; padding: 1px 8px; border-radius: 3px; cursor: pointer; }
```
（`.ed-canvas` 保持 `position: relative` 以承载 overlay。）

- [ ] **Step 4: 测试**
把注入样式抽成导出常量：
```ts
export const CANVAS_STYLE =
  '.ed-selected{outline:3px solid #1E6FFF;outline-offset:-3px;background:rgba(30,111,255,.08)}' +
  '.ed-hover{outline:2px dashed #1E6FFF;outline-offset:-2px}'
```
`handleLoad` 用 `s.textContent = CANVAS_STYLE`。测试：
```ts
import { CANVAS_STYLE } from '../Canvas'
it('canvas highlight uses blue + hover style', () => {
  expect(CANVAS_STYLE).toContain('#1E6FFF')
  expect(CANVAS_STYLE).toContain('ed-hover')
  expect(CANVAS_STYLE).toContain('rgba(30,111,255,.08)')
})
```
（RTL 仍保留"渲染出 iframe"的冒烟测试。）

- [ ] **Step 5: 运行 + 提交**
```bash
git add src/editor/Canvas.tsx src/editor/editor.css src/editor/__tests__/canvas.test.tsx
git commit -m "feat(editor): blue selection highlight + hover + block type badge"
```

---

## Task 4: PageEditor 布局接入结构树

**Files:** `src/editor/PageEditor.tsx`, `src/editor/editor.css`, `src/editor/TopBar.tsx`（无改）

- [ ] **Step 1: 左栏改为 组件库 + 结构树**
```tsx
<div className="ed-left">
  <Palette onAdd={...} />
  <StructureTree blocks={doc.blocks} selectedId={selectedId} onSelect={setSelectedId} onDelete={(id) => onDeleteById(id)} />
</div>
```
- `onDeleteById(id)`：用 `findPath(doc.blocks, id)` + `removeAtPath` 删除（已有 path 工具；PageEditor 现有 `onDelete` 接收 id，确认可复用）。
- 选中标签：`const selectedLabel = selected ? (BLOCKS[selected.type]?.label) : undefined`，传给 `<Canvas selectedLabel={selectedLabel} .../>`。

- [ ] **Step 2: `editor.css`**
```css
.ed-body { display: flex; height: calc(100vh - 160px); }
.ed-left { width: 250px; border-right: 1px solid #e5e5e5; display: flex; flex-direction: column; overflow: hidden; }
.ed-left .ed-palette { flex: 0 0 auto; }
.ed-left .ed-tree { flex: 1 1 auto; overflow: auto; }
```
（按现有 `.ed-body` 结构微调；确保中栏 `.ed-canvas-wrap` 正常占据剩余宽度。）

- [ ] **Step 3: 手动验证**
`bash scripts/start.sh dev` → 打开首页编辑器：
- 左栏出现"结构"树，层级正确；点标题节点 → 画布对应标题高亮（蓝色 3px + 高亮底 + "标题"标签）。
- hover 树节点显示 ✕；点 ✕ 删除对应块（画布更新）。
- 右面板仍可编辑 + 增删/排序子组件（末尾追加）。

- [ ] **Step 4: 运行 + 提交**
```bash
git add src/editor/PageEditor.tsx src/editor/editor.css
git commit -m "feat(editor): wire structure tree into editor layout"
```

---

## Task 5: 验收

- [ ] **Step 1:** `npm test && npx tsc --noEmit` 全绿。
- [ ] **Step 2:** Playwright：选中 `section` 与内部 `heading`，确认：
  - 选中明显（蓝 3px + 高亮底 + 类型标签）；
  - 结构树与选中同步；
  - 右面板添加 heading（末尾）+ ↑↓ + ✕；
  - hover 画布块显示蓝色虚线。
- [ ] **Step 3:** `git commit`（微调）`chore(cms): structure-tree acceptance fixes`

---

## 覆盖对照（spec → 计划）

| spec 章节 | 任务 |
|---|---|
| §2 组件分类 | Task 1 |
| §3 结构树 | Task 2, 4 |
| §4 选中高亮（蓝） | Task 3 |
| §5 右面板子组件 | Task 1（规则）+ 现有面板 |
| §6 交互流程 | Task 2–4 |
| §8 测试/验收 | 各任务 + Task 5 |

**范围外**：拖拽精确插入、grid 多单元格、聚光效果。

---

## 备注

- 选中色统一 `#1E6FFF`（与玫粉互补），CSS 常量集中在 `Canvas.tsx` 的 `CANVAS_STYLE` 便于调整。
- 结构树只读层级 + 选中/删除；插入在右面板（末尾追加，↑↓ 排序）。
- `grid` 子项仍按第一 cell 管理（沿用现状）。

# E2 可视化画布编辑器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用可视化画布编辑器**取代 Pages 的默认表单编辑**：组件库(缩略图)拖入画布、画布内选中/拖动/双击改字、右侧属性面板、媒体选择、保存草稿与发布。

**Architecture:** 编辑器是一个挂在 Payload Admin 的 **React 客户端视图**（覆盖 Pages 文档编辑视图）。画布 = `<iframe srcdoc>`，其内容由**同构渲染模块** `renderDocument` 从"编辑中的区块数据"即时产出；iframe 同源，父级直接操作 `contentDocument` 叠加选中框/手柄/内联编辑。数据经 **Payload REST API** 读写（草稿/发布）。渲染器补 `data-bid`/`data-field` 钩子供画布定位。

**Tech Stack:** Payload 3.90.2、Next 16、React 19、TypeScript、Vitest 4。

**前置：** E1 已交付（Drafts、`renderDocument`、`/assets/*`、预览路由）；P2 区块系统。分支 `feat/cms-editor`。
**设计依据：** `docs/superpowers/specs/2026-10-16-visual-editor-design.md`；UI 稿 `editor-ui.html`（会话 `3739-1792149090`）。
**参考文档：** Payload 自定义文档视图 https://payloadcms.com/docs/custom-components/document-views （覆盖 Edit 视图用集合 `admin.components.edit`）。

**工作目录：** 相对 `cms/`。

---

## 文件结构（本计划涉及）

```
cms/
├─ src/
│  ├─ render/
│  │  ├─ blocks/*.ts            # 增加 data-bid / data-field 钩子
│  │  ├─ shell.ts               # shell 支持 blockId
│  │  └─ document.ts            # renderDocument 支持 blockId 透传（可选）
│  ├─ editor/
│  │  ├─ types.ts               # EditorBlock / EditorState
│  │  ├─ state.ts               # 纯函数 reducer：增/删/改/排序/分配 id
│  │  ├─ api.ts                 # Payload REST 客户端：取草稿/存草稿/发布/媒体
│  │  ├─ blocks.ts              # 区块元数据（中文名/图标/缩略图/字段清单）
│  │  ├─ controls.tsx           # 通用属性控件（文本/多行/数字/下拉/开关/图片/链接/背景）
│  │  ├─ PropertyPanel.tsx      # 属性面板（用 controls + 每区块字段清单）
│  │  ├─ Palette.tsx            # 组件库（缩略图，可拖入）
│  │  ├─ Canvas.tsx             # iframe 画布 + srcdoc 组装 + 叠加编辑层
│  │  ├─ MediaModal.tsx         # 媒体选择弹窗（列表/上传）
│  │  ├─ TopBar.tsx             # 状态 + 保存草稿 + 发布 + 预览
│  │  └─ PageEditor.tsx         # 顶层：编排以上 + 数据加载/保存
│  └─ collections/Pages.ts      # 挂载自定义编辑视图
```

---

## Task 1: 渲染器加编辑钩子 `data-bid` / `data-field`

**Files:** `src/render/shell.ts`, `src/render/blocks/*.ts`, `src/render/types.ts`, 相关测试

- [ ] **Step 1: types 增加可选 `_id`**

在 `src/render/types.ts` 的 `BlockBase` 增加：
```ts
export interface BlockBase {
  bg?: string
  alt?: boolean
  /** 编辑器使用的稳定 id（生成时忽略）。 */
  _id?: string
}
```

- [ ] **Step 2: `shell` 支持 blockId**

`src/render/shell.ts`：
```ts
import { bgStyle } from './primitives'

export function shell(options: { bg?: string; alt?: boolean; id?: string }, inner: string): string {
  const style = bgStyle(options.bg)
  const cls = ['section']
  if (!style && options.alt) cls.push('section-alt')
  const idAttr = options.id ? ` data-bid="${options.id}"` : ''
  return `<section class="${cls.join(' ')}"${idAttr} ${style}>${inner}</section>`
}
```

- [ ] **Step 3: 各内容渲染器传 id + 标记可编辑字段**

- `text.ts`：`shell({ bg, alt, id: b._id }, ...)`；把标题/正文加 `data-field`：
  `${b.title ? `<h2 data-field="title">${esc(b.title)}</h2>` : ''}` 与 `<p data-field="body">${esc(b.body)}</p>`。
- `imageText.ts`：`<h3 data-field="title">`、`<p data-field="desc">`，shell 传 `id: b._id`。
- `button.ts`：`<a ... data-field="label">`（或 span），shell 传 id。
- `banner.ts`：`<h1 data-field="title">`、`<p class="sub" data-field="sub">`；section 加 `data-bid="${b._id||''}"`。
- `slider.ts`：section 加 `data-bid`。
- `grid.ts`：容器 section 加 `data-bid="${b._id||''}"`（子组件用各自 id）。

> 说明：属性名 `data-bid`/`data-field` 是编辑器与渲染的**约定**；生成静态页时它们无害。

- [ ] **Step 4: 更新/新增测试**

在现有各区块测试中补断言，例如：
```ts
it('emits data-bid and data-field hooks', () => {
  const html = renderBlock({ type: 'text', body: 'x', title: 't', _id: 'b1' })
  expect(html).toContain('data-bid="b1"')
  expect(html).toContain('data-field="body"')
  expect(html).toContain('data-field="title"')
})
```
（放 `src/render/__tests__/hooks.test.ts` 更清晰。）

- [ ] **Step 5: 运行 + 提交**

Run: `npm test && npx tsc --noEmit`
```bash
git add src/render
git commit -m "feat(render): editor hooks (data-bid/data-field)"
```

---

## Task 2: 编辑器状态（纯函数 reducer）

**Files:** `src/editor/types.ts`, `src/editor/state.ts`, `src/editor/__tests__/state.test.ts`

- [ ] **Step 1: 写失败测试 `src/editor/__tests__/state.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { addBlock, moveBlock, removeBlock, updateBlockField, ensureIds } from '../state'
import type { Block } from '../../render/types'

describe('editor state', () => {
  const t = (body: string, id?: string): Block => ({ type: 'text', body, _id: id })
  it('adds a block at index', () => {
    const blocks = [t('a'), t('b')]
    const out = addBlock(blocks, { type: 'text', body: 'new' }, 1)
    expect(out.map((b) => (b as any).body)).toEqual(['a', 'new', 'b'])
    expect((out[1] as any)._id).toBeTruthy()
  })
  it('moves a block', () => {
    const out = moveBlock([t('a', '1'), t('b', '2'), t('c', '3')], 0, 2)
    expect(out.map((b) => (b as any).body)).toEqual(['b', 'c', 'a'])
  })
  it('removes a block', () => {
    expect(removeBlock([t('a', '1'), t('b', '2')], 0).length).toBe(1)
  })
  it('updates a top-level field', () => {
    const out = updateBlockField([t('a', '1')], 0, 'body', 'A') as any[]
    expect(out[0].body).toBe('A')
  })
  it('ensureIds assigns ids where missing', () => {
    const out = ensureIds([t('a'), t('b')]) as any[]
    expect(out[0]._id).toBeTruthy()
    expect(out[1]._id).toBeTruthy()
  })
})
```

- [ ] **Step 2: 运行确认失败** → `npm test -- state`

- [ ] **Step 3: 实现 `src/editor/types.ts` + `src/editor/state.ts`**

`types.ts`：
```ts
import type { Block } from '../render/types'
export type { Block }
export interface EditorDoc {
  id: number | string
  title: string
  route: string
  seo?: { title?: string; description?: string }
  blocks: Block[]
  _status?: 'draft' | 'published'
}
```

`state.ts`（纯函数，返回新数组）：
```ts
import type { Block } from './types'

let seq = 0
export const newId = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`

export function ensureIds(blocks: Block[]): Block[] {
  return blocks.map((b) => (b._id ? b : { ...b, _id: newId() }))
}

export function addBlock(blocks: Block[], block: Block, index = blocks.length): Block[] {
  const next = blocks.slice()
  next.splice(index, 0, { ...block, _id: block._id ?? newId() })
  return next
}

export function moveBlock(blocks: Block[], from: number, to: number): Block[] {
  const next = blocks.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function removeBlock(blocks: Block[], index: number): Block[] {
  return blocks.filter((_, i) => i !== index)
}

export function updateBlockField(blocks: Block[], index: number, key: string, value: unknown): Block[] {
  const next = blocks.slice()
  next[index] = { ...next[index], [key]: value } as Block
  return next
}
```

- [ ] **Step 4: 运行确认通过 + 提交**

Run: `npm test -- state && npx tsc --noEmit`
```bash
git add src/editor/types.ts src/editor/state.ts src/editor/__tests__/state.test.ts
git commit -m "feat(editor): block state reducer"
```

---

## Task 3: Payload REST 客户端

**Files:** `src/editor/api.ts`, `src/editor/__tests__/api.test.ts`

- [ ] **Step 1: 写失败测试（用假 fetch）**

```ts
import { describe, it, expect, vi } from 'vitest'
import { getPage, savePage, publishPage, listMedia } from '../api'

describe('editor api', () => {
  it('getPage fetches draft', async () => {
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify({ doc: { id: 1, title: 'T', route: '/', blocks: [] } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const doc = await getPage(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/pages/1?draft=true')
    expect(doc.title).toBe('T')
  })
  it('savePage PATCHes', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await savePage(1, { title: 'T', route: '/', blocks: [] })
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH')
  })
  it('publishPage sets _status published', async () => {
    const fetchMock = vi.fn(async (_u: string, init: any) => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await publishPage(1, { title: 'T', route: '/', blocks: [] })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)._status).toBe('published')
  })
})
```

- [ ] **Step 2: 运行失败** → `npm test -- api`

- [ ] **Step 3: 实现 `src/editor/api.ts`**

```ts
import type { EditorDoc } from './types'

const json = { 'content-type': 'application/json' }

async function j(res: Response) {
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export async function getPage(id: number | string): Promise<EditorDoc> {
  const res = await fetch(`/api/pages/${id}?draft=true&depth=1`, { credentials: 'include' })
  const data = await j(res)
  return data.doc as EditorDoc
}

export async function savePage(id: number | string, data: Partial<EditorDoc>): Promise<void> {
  const body = { ...data, _status: 'draft' }
  await j(await fetch(`/api/pages/${id}?draft=true`, { method: 'PATCH', headers: json, credentials: 'include', body: JSON.stringify(body) }))
}

export async function publishPage(id: number | string, data: Partial<EditorDoc>): Promise<void> {
  const body = { ...data, _status: 'published' }
  await j(await fetch(`/api/pages/${id}`, { method: 'PATCH', headers: json, credentials: 'include', body: JSON.stringify(body) }))
}

export interface MediaItem { id: number | string; url?: string; alt?: string; filename?: string }
export async function listMedia(): Promise<MediaItem[]> {
  const data = await j(await fetch('/api/media?limit=100&depth=0', { credentials: 'include' }))
  return data.docs as MediaItem[]
}
export async function uploadMedia(file: File): Promise<MediaItem> {
  const form = new FormData()
  form.append('file', file)
  form.append('_payload', JSON.stringify({ alt: file.name }))
  const data = await j(await fetch('/api/media', { method: 'POST', credentials: 'include', body: form }))
  return data.doc as MediaItem
}
```

- [ ] **Step 4: 通过 + 提交**

Run: `npm test -- api && npx tsc --noEmit`
```bash
git add src/editor/api.ts src/editor/__tests__/api.test.ts
git commit -m "feat(editor): payload rest client (draft/publish/media)"
```

---

## Task 4: 区块元数据 + 组件库缩略图

**Files:** `src/editor/blocks.ts`, `src/editor/Palette.tsx`

- [ ] **Step 1: `src/editor/blocks.ts`**

导出每个区块类型的中文名、默认数据、字段清单（供属性面板）：
```ts
import type { Block } from './types'

export interface FieldDef { key: string; label: string; control: 'text'|'textarea'|'number'|'select'|'boolean'|'media'|'link'|'bg'; options?: {label:string;value:string}[] }
export interface BlockMeta { type: Block['type']; label: string; defaults: () => Block; fields: FieldDef[] }

const common: FieldDef[] = [
  { key: 'bg', label: '背景', control: 'bg' },
  { key: 'alt', label: '浅粉底', control: 'boolean' },
]

export const BLOCKS: Record<Block['type'], BlockMeta> = {
  banner: { type: 'banner', label: '横幅', defaults: () => ({ type: 'banner', variant: 'split' }), fields: [
    { key: 'title', label: '标题', control: 'text' }, { key: 'sub', label: '副标题', control: 'text' },
    { key: 'variant', label: '布局变体', control: 'select', options: [{label:'左右',value:'split'},{label:'整图',value:'centered'}] },
    { key: 'image', label: '配图', control: 'media' }, { key: 'pattern', label: '装饰图', control: 'media' }, ...common,
  ] },
  text: { type: 'text', label: '文本', defaults: () => ({ type: 'text', body: '' }), fields: [
    { key: 'title', label: '标题', control: 'text' }, { key: 'body', label: '正文', control: 'textarea' },
    { key: 'align', label: '对齐', control: 'select', options: [{label:'左',value:'left'},{label:'居中',value:'center'}] }, ...common,
  ] },
  image: { type: 'image', label: '图片', defaults: () => ({ type: 'image', media: '' }), fields: [
    { key: 'media', label: '图片', control: 'media' }, { key: 'altText', label: '替代文本', control: 'text' },
    { key: 'link', label: '链接', control: 'link' }, ...common,
  ] },
  imageText: { type: 'imageText', label: '图文卡片', defaults: () => ({ type: 'imageText', media: '' }), fields: [
    { key: 'media', label: '图片', control: 'media' }, { key: 'title', label: '标题', control: 'text' },
    { key: 'desc', label: '描述', control: 'textarea' }, { key: 'link', label: '链接', control: 'link' }, ...common,
  ] },
  button: { type: 'button', label: '按钮', defaults: () => ({ type: 'button', label: '', link: '' }), fields: [
    { key: 'label', label: '文字', control: 'text' }, { key: 'link', label: '链接', control: 'link' },
    { key: 'style', label: '样式', control: 'select', options: [{label:'实心',value:'primary'},{label:'描边',value:'outline'}] }, ...common,
  ] },
  richtext: { type: 'richtext', label: '富文本', defaults: () => ({ type: 'richtext', html: '' }), fields: [ ...common ] },
  gallery: { type: 'gallery', label: '图集', defaults: () => ({ type: 'gallery', images: [] }), fields: [
    { key: 'columns', label: '列数', control: 'number' }, ...common,
  ] },
  slider: { type: 'slider', label: '轮播', defaults: () => ({ type: 'slider', images: [] }), fields: [
    { key: 'bg', label: '背景', control: 'bg' },
  ] },
  grid: { type: 'grid', label: '网格', defaults: () => ({ type: 'grid', columns: 3, gap: 'md', cells: [{ components: [] }] }), fields: [
    { key: 'columns', label: '列数', control: 'number' }, { key: 'gap', label: '间距', control: 'select', options: [{label:'紧凑',value:'sm'},{label:'标准',value:'md'},{label:'宽松',value:'lg'}] }, ...common,
  ] },
}

export const PAGE_BLOCKS: Block['type'][] = ['grid','banner','text','image','imageText','button','richtext','gallery','slider']
```

- [ ] **Step 2: `src/editor/Palette.tsx`（缩略图 + 拖入）**

```tsx
'use client'
import React from 'react'
import { BLOCKS, PAGE_BLOCKS } from './blocks'
import type { Block } from './types'

const box: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 4 }
const line = (w: string): React.CSSProperties => ({ height: 5, width: w, background: '#ddd', borderRadius: 2, marginBottom: 4 })

const THUMBS: Record<Block['type'], React.ReactNode> = {
  banner: (
    <div style={{ display: 'flex', height: 44 }}>
      <div style={{ flex: 1, padding: 6 }}><div style={line('85%')} /><div style={line('70%')} /></div>
      <div style={{ width: '45%', background: 'linear-gradient(135deg,#C2185B,#8A0E4B)' }} />
    </div>
  ),
  text: <div style={{ height: 44, padding: 8 }}><div style={line('90%')} /><div style={line('75%')} /><div style={line('55%')} /></div>,
  image: <div style={{ ...box, background: 'linear-gradient(135deg,#c9d3de,#e6ebf1)', color: '#9aa7b4' }}>🖼</div>,
  imageText: (
    <div style={{ display: 'flex', height: 44 }}>
      <div style={{ width: '50%', background: 'linear-gradient(135deg,#e3c9d4,#f3e6ec)' }} />
      <div style={{ flex: 1, padding: 6 }}><div style={line('80%')} /><div style={line('95%')} /></div>
    </div>
  ),
  button: <div style={box}><span style={{ background: '#E60039', color: '#fff', fontSize: 10, padding: '4px 12px', borderRadius: 12 }}>按钮</span></div>,
  richtext: <div style={{ height: 44, padding: 8 }}><div style={{ ...line('55%'), background: '#a44' }} /><div style={line('90%')} /><div style={line('70%')} /></div>,
  gallery: (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, padding: 6, height: 44 }}>
      <div style={{ background: '#cbd5e0', borderRadius: 2 }} /><div style={{ background: '#cbd5e0', borderRadius: 2 }} />
      <div style={{ background: '#cbd5e0', borderRadius: 2 }} /><div style={{ background: '#cbd5e0', borderRadius: 2 }} />
    </div>
  ),
  slider: (
    <div style={{ ...box, background: '#3A0A22', position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: '44%', height: 38, background: '#C2185B', borderRadius: 3, zIndex: 2 }} />
    </div>
  ),
  grid: (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, padding: 6, height: 44 }}>
      <div style={{ background: '#f0e3ea', borderRadius: 2 }} /><div style={{ background: '#f0e3ea', borderRadius: 2 }} /><div style={{ background: '#f0e3ea', borderRadius: 2 }} />
    </div>
  ),
}

export default function Palette({ onAdd, onDragStartType }: { onAdd: (type: Block['type']) => void; onDragStartType?: (type: Block['type']) => void }) {
  return (
    <aside className="ed-palette">
      <div className="ed-label">组件（拖入画布）</div>
      <div className="ed-palette-grid">
        {PAGE_BLOCKS.map((t) => (
          <button
            key={t}
            className="ed-palette-item"
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/x-block', t); onDragStartType?.(t) }}
            onClick={() => onAdd(t)}
            title={`添加${BLOCKS[t].label}`}
          >
            <div className="ed-thumb">{THUMBS[t]}</div>
            <div className="ed-thumb-label">{BLOCKS[t].label}</div>
          </button>
        ))}
      </div>
    </aside>
  )
}
```
> 缩略图全部用内联样式 div 复刻画布观感（对齐 UI 稿），无需图片资源。

- [ ] **Step 3: 测试 `src/editor/__tests__/palette.test.tsx`**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Palette from '../Palette'
import { PAGE_BLOCKS, BLOCKS } from '../blocks'

describe('Palette', () => {
  it('renders one thumbnail entry per page block, with Chinese labels', () => {
    render(<Palette onAdd={() => {}} />)
    expect(document.querySelectorAll('.ed-palette-item')).toHaveLength(PAGE_BLOCKS.length)
    for (const t of PAGE_BLOCKS) {
      expect(screen.getByTitle(`添加${BLOCKS[t].label}`)).toBeTruthy()
    }
  })
  it('calls onAdd on click', () => {
    const onAdd = vi.fn()
    render(<Palette onAdd={onAdd} />)
    fireEvent.click(screen.getByTitle('添加网格'))
    expect(onAdd).toHaveBeenCalledWith('grid')
  })
})
```
> 若未装 `@testing-library/react`，先 `npm i -D @testing-library/react @testing-library/dom @testing-library/jest-dom`；用文件顶部 `// @vitest-environment jsdom` 指定环境（`jsdom` 已在依赖中）。

- [ ] **Step 4: 通过 + 提交**

```bash
git add src/editor/blocks.ts src/editor/Palette.tsx src/editor/__tests__/palette.test.tsx package.json vitest.config.ts
git commit -m "feat(editor): block metadata + palette thumbnails"
```

---

## Task 5: 画布 iframe + 叠加编辑层

**Files:** `src/editor/Canvas.tsx`

- [ ] **Step 1: 实现 `src/editor/Canvas.tsx`**

要点：srcdoc 由 `renderDocument(doc, {mode:'external'})` 产出；同源；加载后绑定点击选中/双击改字；父级用绝对定位的 div 叠加选中框。

```tsx
'use client'
import React, { useEffect, useRef } from 'react'
import { renderDocument } from '../render/document'
import type { EditorDoc } from './types'

export default function Canvas({
  doc, selectedId, onSelect, onEditField,
}: {
  doc: EditorDoc
  selectedId?: string
  onSelect: (id: string) => void
  onEditField: (blockId: string, field: string, value: string) => void
}) {
  const ref = useRef<HTMLIFrameElement>(null)
  const html = renderDocument(doc, { mode: 'external' })

  useEffect(() => {
    const frame = ref.current
    if (!frame) return
    const bind = () => {
      const d = frame.contentDocument
      if (!d) return
      d.querySelectorAll('[data-bid]').forEach((el) => {
        el.addEventListener('click', (e) => { e.preventDefault(); onSelect(el.getAttribute('data-bid')!) })
      })
      d.querySelectorAll('[data-field]').forEach((el) => {
        el.addEventListener('dblclick', () => {
          const host = (el as HTMLElement).closest('[data-bid]')
          const id = host?.getAttribute('data-bid') || ''
          const field = el.getAttribute('data-field') || ''
          ;(el as HTMLElement).setAttribute('contenteditable', 'true')
          ;(el as HTMLElement).focus()
          const done = () => {
            ;(el as HTMLElement).removeAttribute('contenteditable')
            onEditField(id, field, (el as HTMLElement).innerText)
            el.removeEventListener('blur', done)
          }
          el.addEventListener('blur', done)
        })
      })
    }
    frame.addEventListener('load', bind)
    return () => frame.removeEventListener('load', bind)
  }, [html, onSelect, onEditField])

  return (
    <div className="ed-canvas">
      <iframe ref={ref} title="canvas" className="ed-canvas-frame" srcDoc={html} />
      {/* 选中框：可读取选中元素位置用叠加层绘制；MVP 也可仅用 inset 高亮 */}
    </div>
  )
}
```
> 说明：`srcDoc` 变化会重载 iframe；编辑提交后重渲。选中框在 MVP 可用 iframe 内 CSS 高亮 `[data-bid]` 选中项（由父级向 `contentDocument` 注入 class）实现，避免跨文档坐标计算。

- [ ] **Step 2: 测试（纯逻辑）**

把"注入选中样式"抽成一个纯函数便于测试：
```ts
export function highlightSelection(html: string, id?: string): string // 在选中元素的 section 加 style="outline:2px solid #E60039"
```
测试断言含 `outline` 与对应 `data-bid`。`Canvas` 组件本身用 RTL 做渲染冒烟（存在 iframe）。

- [ ] **Step 3: 通过 + 提交**

```bash
git add src/editor/Canvas.tsx src/editor/__tests__/canvas.test.tsx
git commit -m "feat(editor): canvas iframe + edit overlay"
```

---

## Task 6: 属性面板（通用控件 + 字段清单）

**Files:** `src/editor/controls.tsx`, `src/editor/MediaModal.tsx`, `src/editor/PropertyPanel.tsx`

- [ ] **Step 1: `controls.tsx`** 通用控件：`TextControl, TextAreaControl, NumberControl, SelectControl, BooleanControl, LinkControl, BgControl, MediaControl`

```tsx
'use client'
import React from 'react'

interface Base { label: string }
type V<T> = { value?: T; onChange: (v: T) => void }

export function TextControl({ label, value, onChange }: Base & V<string>) {
  return <label className="ed-ctl"><span>{label}</span><input value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>
}
export function TextAreaControl({ label, value, onChange }: Base & V<string>) {
  return <label className="ed-ctl"><span>{label}</span><textarea rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>
}
export function NumberControl({ label, value, onChange }: Base & V<number>) {
  return <label className="ed-ctl"><span>{label}</span><input type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} /></label>
}
export function SelectControl({ label, value, onChange, options }: Base & V<string> & { options: { label: string; value: string }[] }) {
  return (
    <label className="ed-ctl"><span>{label}</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}
export function BooleanControl({ label, value, onChange }: Base & V<boolean>) {
  return <label className="ed-ctl ed-ctl-inline"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /><span>{label}</span></label>
}
export function LinkControl({ label, value, onChange }: Base & V<string>) {
  return <label className="ed-ctl"><span>{label}</span><input placeholder="/path/ 或 https://…" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>
}
export function BgControl({ label, value, onChange }: Base & V<string>) {
  return <label className="ed-ctl"><span>{label}</span><input placeholder="图片路径 / 颜色 / 渐变" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>
}
export function MediaControl({ label, value, onChange, onPick }: Base & V<string> & { onPick: () => void }) {
  return (
    <div className="ed-ctl"><span>{label}</span>
      <div className="ed-media-row">
        {value ? <img className="ed-media-thumb" src={value} alt="" /> : null}
        <button type="button" onClick={onPick}>{value ? '更换' : '选择图片'}</button>
        {value ? <button type="button" onClick={() => onChange('')}>移除</button> : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `MediaModal.tsx`** 媒体选择弹窗（列表 `listMedia()` + 上传 `uploadMedia()`）。

- [ ] **Step 3: `PropertyPanel.tsx`** 依 `BLOCKS[type].fields` 渲染控件，`onChange` 回调更新对应字段；`media` 控件打开 `MediaModal`。

```tsx
'use client'
import React, { useState } from 'react'
import { BLOCKS } from './blocks'
import type { Block } from './types'
import { TextControl, TextAreaControl, NumberControl, SelectControl, BooleanControl, LinkControl, BgControl, MediaControl } from './controls'
import MediaModal from './MediaModal'

export default function PropertyPanel({
  block, onChange,
}: {
  block?: Block
  onChange: (key: string, value: unknown) => void
}) {
  const [mediaFor, setMediaFor] = useState<string | null>(null)
  if (!block) return <aside className="ed-props"><div className="ed-label">属性</div><p className="ed-muted">未选中区块</p></aside>
  const meta = BLOCKS[block.type]
  const b = block as Record<string, unknown>
  const val = (k: string) => b[k]

  return (
    <aside className="ed-props">
      <div className="ed-label">属性 · {meta.label}</div>
      {meta.fields.map((f) => {
        switch (f.control) {
          case 'text': return <TextControl key={f.key} label={f.label} value={val(f.key) as string} onChange={(v) => onChange(f.key, v)} />
          case 'textarea': return <TextAreaControl key={f.key} label={f.label} value={val(f.key) as string} onChange={(v) => onChange(f.key, v)} />
          case 'number': return <NumberControl key={f.key} label={f.label} value={val(f.key) as number} onChange={(v) => onChange(f.key, v)} />
          case 'select': return <SelectControl key={f.key} label={f.label} value={val(f.key) as string} options={f.options ?? []} onChange={(v) => onChange(f.key, v)} />
          case 'boolean': return <BooleanControl key={f.key} label={f.label} value={val(f.key) as boolean} onChange={(v) => onChange(f.key, v)} />
          case 'link': return <LinkControl key={f.key} label={f.label} value={val(f.key) as string} onChange={(v) => onChange(f.key, v)} />
          case 'bg': return <BgControl key={f.key} label={f.label} value={val(f.key) as string} onChange={(v) => onChange(f.key, v)} />
          case 'media': return <MediaControl key={f.key} label={f.label} value={val(f.key) as string} onPick={() => setMediaFor(f.key)} onChange={(v) => onChange(f.key, v)} />
        }
      })}
      {block.type === 'grid' ? (
        <div className="ed-grid-cells">
          <div className="ed-label">格与子组件（MVP）</div>
          {block.cells.map((c, i) => (
            <div key={i} className="ed-cell-row">格 {i + 1}：{c.components.length} 个子组件</div>
          ))}
          <p className="ed-muted">列数 {block.columns} · 间距 {block.gap}</p>
        </div>
      ) : null}
      {mediaFor ? (
        <MediaModal
          onClose={() => setMediaFor(null)}
          onSelect={(url) => { onChange(mediaFor, url); setMediaFor(null) }}
        />
      ) : null}
    </aside>
  )
}
```
> `MediaModal` 用 `listMedia()` 展示缩略图网格 + 上传按钮（`uploadMedia(file)`），选择后回传其 `url`。

- [ ] **Step 4: 测试 `src/editor/__tests__/property.test.tsx`**

渲染一个 `text` 区块，断言出现"标题/正文/对齐/背景/浅粉底"中文 label，且改"正文"触发 onChange。

- [ ] **Step 5: 提交**

```bash
git add src/editor/controls.tsx src/editor/MediaModal.tsx src/editor/PropertyPanel.tsx src/editor/__tests__/property.test.tsx
git commit -m "feat(editor): property panel (controls + field lists + media modal)"
```

---

## Task 7: 顶层编排 + 保存/发布 + 挂载到 Pages

**Files:** `src/editor/PageEditor.tsx`, `src/editor/TopBar.tsx`, `src/components/PageEditorView.tsx`, `src/collections/Pages.ts`

- [ ] **Step 1: `TopBar.tsx`**：页面标题、状态（草稿/已发布 · 未保存）、`预览`（打开 `/preview/pages/:id` 新标签）、`保存`、`发布`。

- [ ] **Step 2: `PageEditor.tsx`**：加载 `getPage(id)` → `ensureIds`；布局 `Palette | Canvas | PropertyPanel`；顶部 `TopBar`；编辑即更新 state 并**防抖保存**（`savePage`）；`发布` 调 `publishPage`；`添加区块`（点/拖）用 `addBlock`；选中/改字/排序/删除接 state 函数。

- [ ] **Step 3: 挂载到 Pages（覆盖默认编辑视图）**

参考 Payload 文档自定义文档视图，在 `src/collections/Pages.ts` 的 `admin.components.edit` 指定覆盖。优先用 `default`（替换 `/admin/collections/pages/:id` 视图）。示意（**以你所用 3.90.2 的实际类型/文档为准**）：
```ts
admin: {
  useAsTitle: 'title',
  defaultColumns: ['title', 'route', '_status'],
  components: {
    edit: {
      default: { Component: '/components/PageEditorView#PageEditorView' },
    },
  },
},
```
`src/components/PageEditorView.tsx`：读取路由参数得到页面 id，渲染 `<PageEditor id={id} />`；用 `'use client'`。
> 若 3.90.2 的覆盖点不同（如 `edit.root` 或需自定义路由），按官方文档调整；目标：**打开某页 → 直接进入画布编辑器**。实现后跑 `npm run generate:importmap` 注册自定义组件。

- [ ] **Step 4: 手动验证**

`bash scripts/start.sh dev` → `/admin/collections/pages` → 打开一页 → 应进入画布编辑器（左组件库/中画布/右属性）；输入标题/添加区块 → 画布即时更新；保存后刷新仍在。

- [ ] **Step 5: 提交**

```bash
git add src/editor src/components/PageEditorView.tsx src/collections/Pages.ts "src/app/(payload)/admin/importMap.js"
git commit -m "feat(editor): wire canvas editor as Pages edit view + save/publish"
```

---

## Task 8: 端到端验收

- [ ] **Step 1: 全量测试** → `npm test && npx tsc --noEmit` 全绿。

- [ ] **Step 2: Playwright 验收**
1. 登录 `/admin`，打开一个页面 → 画布编辑器出现。
2. 从组件库**拖入**"横幅"/点击添加 → 画布出现该区块。
3. **双击**标题改字 → 画布即时更新；**拖动**排序 → 顺序变化。
4. 选中区块 → 右侧属性面板显示对应中文字段；改"列数"等 → 画布更新。
5. `保存` → 刷新后保留（草稿）。
6. `发布` → `_status=published`；`npm run generate` 产出含该页的静态 HTML。

- [ ] **Step 3: 提交（微调）**

```bash
git add -A cms
git commit -m "chore(cms): e2 editor acceptance fixes"
```

---

## 覆盖对照（spec → 本计划）

| spec 章节 | 计划任务 |
|---|---|
| §3.1 Drafts | E1（已完成） |
| §3.2 同构渲染 | Task 5（画布用 `renderDocument`） |
| §3.3 画布 iframe 模型 | Task 5 |
| §3.5 覆盖 Pages Edit 视图 | Task 7 |
| §3.6 属性面板（C 方案） | Task 4, 6 |
| §3.7 保存/发布 | Task 3, 7 |
| §4 编辑体验（UI） | Task 4,5,6,7 |
| §5 组件级细节 | Task 1, 4 |
| §6 测试 | 各任务 TDD + Task 8 |

**范围外**：画布内**嵌套拖拽**（二阶段）；发布按钮端点化（E3）；汉化/集合/站点（父设）。

---

## 备注

- 渲染器新增的 `data-bid`/`data-field` 仅作编辑器定位，静态产出无害。
- 画布用 **external** 资源模式：`srcdoc` 继承父基准 URL，`/assets/*` 由 E1 的资源路由提供。
- Payload 自定义编辑视图的确切覆盖键以 **3.90.2 官方文档**为准；若 `default` 不可用，退用 `root` 或自定义路由 + 列表跳转，务必达成"打开页即画布"。
- React 组件测试需 jsdom 环境与 `@testing-library/react`（若未安装则加装）。

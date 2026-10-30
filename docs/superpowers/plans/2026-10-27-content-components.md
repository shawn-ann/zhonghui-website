# Content Components for About & Aupair Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 CMS 增加信息列表、图标列表、横向滚动容器和纵向容器，扩展现有网格/文本/图文卡片，并把「关于中惠」「美国互惠生」两页内容迁入后台。

**Architecture:** 新组件沿用现有 block 体系：Payload 字段定义 → `mapBlock` 转 PageDoc → React 渲染 → 编辑器属性面板。信息列表和图标列表使用新的通用重复项控件；横向滚动是布局容器，子项直接复用 `imageText`。迁移脚本通过 Payload Local API 幂等创建页面和媒体。

**Tech Stack:** Payload 3.90.2、Next.js 16、React 19、TypeScript、PostCSS/CSS、Vitest、Playwright、tsx

---

## 文件结构

**新建**

- `cms/src/blocks/InfoList.ts`
- `cms/src/blocks/IconList.ts`
- `cms/src/blocks/Hscroll.ts`
- `cms/src/components/admin/...` 不适用；编辑器控件在 `cms/src/editor/controls.tsx`
- `cms/src/editor/RepeaterControl.tsx`
- `cms/scripts/migrate-about-aupair.ts`
- `cms/src/static/icons/steps/*.svg`（9 个流程图标）
- 测试：`cms/src/render/__tests__/content-components.test.tsx`
- 测试：`cms/src/editor/__tests__/repeater.test.tsx`

**修改**

- `cms/src/render/types.ts`
- `cms/src/blocks/index.ts`
- `cms/src/generate/loadSiteData.ts`
- `cms/src/editor/blocks.ts`
- `cms/src/editor/types.ts`
- `cms/src/editor/state.ts`
- `cms/src/editor/PropertyPanel.tsx`
- `cms/src/editor/AddChildPicker.tsx`
- `cms/src/editor/editor.css`
- `cms/src/editor/map.ts`
- `cms/src/site/blocks.tsx`
- `cms/src/render/styles/base.css`
- `cms/src/render/styles/main.js`
- `cms/src/editor/__tests__/blocks-meta.test.ts`
- `cms/package.json`（可选脚本 `migrate:about-aupair`）

---

### Task 1: 扩展 Block 类型与现有组件字段

**Files:**
- Modify: `cms/src/render/types.ts`
- Modify: `cms/src/render/styles/base.css`
- Test: `cms/src/render/__tests__/content-components.test.tsx`

- [ ] **Step 1: 写失败测试**

Create `cms/src/render/__tests__/content-components.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { blockNode } from '../../site/blocks'
import type { GridBlock, ImageTextBlock, TextBlock, HscrollBlock, InfoListBlock, IconListBlock } from '../types'

const render = (b: any) => renderToStaticMarkup(blockNode(b)!)

describe('content component extensions', () => {
  it('applies text font size, weight and max width', () => {
    const b: TextBlock = {
      type: 'text', _id: 't', body: '正文', fontSize: 16, fontWeight: '600', maxWidth: 760,
      align: 'center',
    }
    const html = render(b)
    expect(html).toContain('font-size:16px')
    expect(html).toContain('font-weight:600')
    expect(html).toContain('max-width:760px')
  })

  it('renders grid column ratio for two columns', () => {
    const b: GridBlock = {
      type: 'grid', _id: 'g', columns: 2, columnRatio: 'leftNarrow', children: [],
    }
    expect(render(b)).toContain('grid-template-columns:0.9fr 1.4fr')
  })

  it('renders image text subtitle', () => {
    const b: ImageTextBlock = {
      type: 'imageText', _id: 'it', media: '/a.jpg', title: 'Lucy', subtitle: '创始人',
    }
    expect(render(b)).toContain('it-subtitle')
    expect(render(b)).toContain('创始人')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/ansh/Develop/ai_workspace/zhonghui-website/cms
npx vitest run src/render/__tests__/content-components.test.tsx
```

Expected: FAIL（类型字段和渲染不存在）。

- [ ] **Step 3: 扩展类型**

In `cms/src/render/types.ts` add fields to existing interfaces:

```ts
export interface GridBlock extends BlockBase {
  type: 'grid'
  columns: number
  gap?: string
  columnRatio?: 'equal' | 'leftNarrow' | 'leftWide'
  bgImage?: string
  bgColor?: string
  children: Block[]
}

export interface TextBlock extends BlockBase {
  type: 'text'
  title?: string
  body: string
  titleColor?: string
  bodyColor?: string
  align?: 'left' | 'center'
  padding?: number
  fontSize?: number
  fontWeight?: '400' | '600' | '700'
  maxWidth?: number
}

export interface ImageTextBlock extends BlockBase {
  type: 'imageText'
  media: string
  title?: string
  subtitle?: string
  subtitleColor?: string
  desc?: string
  titleColor?: string
  descColor?: string
  link?: string
  linkType?: 'none' | 'internal' | 'external'
  internalPageId?: string | number
  internalRoute?: string
  externalUrl?: string
  padding?: number
}
```

Add new interfaces and union entries (full definitions in Task 2):

```ts
export interface InfoListBlock extends BlockBase {
  type: 'infoList'
  items: { label?: string; desc: string }[]
  showDots: boolean
}

export interface IconListBlock extends BlockBase {
  type: 'iconList'
  items: { icon: string; title: string; desc?: string }[]
  iconPosition: 'left' | 'right' | 'alternate'
  iconColor?: string
}

export interface HscrollBlock extends BlockBase {
  type: 'hscroll'
  timeline: boolean
  children: Block[]
}
```

Append to `Block` union:

```ts
  | InfoListBlock
  | IconListBlock
  | HscrollBlock
```

- [ ] **Step 4: 扩展现有渲染**

In `cms/src/site/blocks.tsx`:

- `TextView`: add inline styles for font size/weight/max width.
- `GridView`: add `gridTemplateColumns` when `columns === 2` and `columnRatio !== 'equal'`.
- `ImageTextView`: render optional subtitle.

```tsx
const textStyle: CSSProperties = {
  ...(b.fontSize ? { fontSize: `${b.fontSize}px` } : {}),
  ...(b.fontWeight ? { fontWeight: b.fontWeight } : {}),
  ...(b.maxWidth ? { maxWidth: `${b.maxWidth}px`, margin: '0 auto' } : {}),
}
```

For grid:

```tsx
const ratioStyle =
  b.columns === 2 && b.columnRatio === 'leftNarrow'
    ? { gridTemplateColumns: '0.9fr 1.4fr' }
    : b.columns === 2 && b.columnRatio === 'leftWide'
      ? { gridTemplateColumns: '1.4fr 0.9fr' }
      : undefined
```

Pass `ratioStyle` to the `.grid` element's `style`.

For image text:

```tsx
{b.subtitle ? (
  <div className="it-subtitle" data-field="subtitle" style={b.subtitleColor ? { color: b.subtitleColor } : undefined}>
    {b.subtitle}
  </div>
) : null}
```

Add CSS:

```css
.image-text .it-subtitle { margin-top: 4px; color: #C07A39; font-size: 12px; font-weight: 600; }
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npx vitest run src/render/__tests__/content-components.test.tsx`

Expected: PASS（3 tests）。

- [ ] **Step 6: 提交**

```bash
git add src/render/types.ts src/site/blocks.tsx src/render/styles/base.css src/render/__tests__/content-components.test.tsx
git commit -m "feat(cms): extend grid, text and image card fields"
```

---

### Task 2: 新增信息列表、图标列表、横向滚动业务字段

**Files:**
- Create: `cms/src/blocks/InfoList.ts`
- Create: `cms/src/blocks/IconList.ts`
- Create: `cms/src/blocks/Hscroll.ts`
- Create: `cms/src/blocks/Stack.ts`（含背景图片、背景色、内边距、垂直间距）
- 网格扩展：`alignItems`；图片扩展：`aspectRatio`、`fit`
- Modify: `cms/src/blocks/index.ts`
- Modify: `cms/src/generate/loadSiteData.ts`
- Test: extend `cms/src/render/__tests__/content-components.test.tsx`

- [ ] **Step 1: 定义 Payload block**

`cms/src/blocks/InfoList.ts`:

```ts
import type { Block } from 'payload'

export const InfoListBlock: Block = {
  slug: 'infoList',
  labels: { singular: '信息列表', plural: '信息列表' },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'label', type: 'text', label: '标签（可选）' },
        { name: 'desc', type: 'textarea', label: '说明', required: true },
      ],
    },
    { name: 'showDots', type: 'checkbox', label: '显示圆点', defaultValue: true },
  ],
}
```

`cms/src/blocks/IconList.ts`:

```ts
import type { Block } from 'payload'

export const IconListBlock: Block = {
  slug: 'iconList',
  labels: { singular: '图标列表', plural: '图标列表' },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'icon', type: 'upload', relationTo: 'media', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'desc', type: 'textarea' },
      ],
    },
    {
      name: 'iconPosition',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: '图标居左', value: 'left' },
        { label: '图标居右', value: 'right' },
        { label: '左右交替', value: 'alternate' },
      ],
    },
    { name: 'iconColor', type: 'text', label: '图标颜色（可选）' },
  ],
}
```

`cms/src/blocks/Hscroll.ts`:

```ts
import type { Block } from 'payload'
import { ImageTextBlock } from './ImageText'

export const HscrollBlock: Block = {
  slug: 'hscroll',
  labels: { singular: '横向滚动', plural: '横向滚动' },
  fields: [
    { name: 'timeline', type: 'checkbox', label: '时间轴连接线', defaultValue: false },
    { name: 'children', type: 'blocks', blocks: [ImageTextBlock], labels: { singular: '卡片', plural: '卡片' } },
  ],
}
```

- [ ] **Step 2: 注册 block**

Modify `cms/src/blocks/index.ts`:

```ts
import { InfoListBlock } from './InfoList'
import { IconListBlock } from './IconList'
import { HscrollBlock } from './Hscroll'

export const sectionChildren: Block[] = [
  HeadingBlock, Grid, GalleryBlock, BannerBlock, SliderBlock, RichTextBlock,
  InfoListBlock, IconListBlock, HscrollBlock,
]

export const pageBlocks: Block[] = [
  SectionBlock, HeadingBlock, Grid, BannerBlock, TextBlock, ImageBlock,
  ImageTextBlock, ButtonBlock, RichTextBlock, GalleryBlock, SliderBlock,
  IconCardBlock, InfoListBlock, IconListBlock, HscrollBlock,
]
```

- [ ] **Step 3: 映射新 block**

In `cms/src/generate/loadSiteData.ts` add cases before `default`:

```ts
case 'infoList':
  return {
    type: 'infoList',
    items: arr<Record<string, any>>(raw.items).map((i) => ({
      label: i.label || undefined,
      desc: String(i.desc ?? ''),
    })),
    showDots: raw.showDots !== false,
  }
case 'iconList':
  return {
    type: 'iconList',
    items: arr<Record<string, any>>(raw.items).map((i) => ({
      icon: resolveMedia(i.icon),
      title: String(i.title ?? ''),
      desc: i.desc || undefined,
    })),
    iconPosition: ['left', 'right', 'alternate'].includes(raw.iconPosition) ? raw.iconPosition : 'left',
    iconColor: raw.iconColor || undefined,
  }
case 'hscroll':
  return {
    type: 'hscroll',
    timeline: raw.timeline === true,
    children: arr<Record<string, any>>(raw.children)
      .map((child) => mapBlock(child, resolveMedia, routes))
      .filter((x): x is Block => x !== null),
  }
```

- [ ] **Step 4: 写渲染测试**

Extend `content-components.test.tsx`:

```tsx
import type { InfoListBlock, IconListBlock, HscrollBlock } from '../types'

it('renders info list with and without dots', () => {
  const b: InfoListBlock = {
    type: 'infoList', _id: 'i', showDots: false,
    items: [{ label: '', desc: '说明一' }, { label: '食宿', desc: '免费' }],
  }
  const html = render(b)
  expect(html).toContain('info-item')
  expect(html).not.toContain('info-dot')
  expect(html).toContain('食宿')
})

it('renders icon list alternate and hscroll children', () => {
  const icon: IconListBlock = {
    type: 'iconList', _id: 'il', iconPosition: 'alternate',
    items: [{ icon: '/i.svg', title: '步骤', desc: '说明' }],
  }
  expect(render(icon)).toContain('icon-position-alternate')

  const rail: HscrollBlock = {
    type: 'hscroll', _id: 'h', timeline: true,
    children: [{ type: 'imageText', media: '/a.jpg', title: '2002', desc: '事件' }],
  }
  expect(render(rail)).toContain('hscroll-inner')
  expect(render(rail)).toContain('timeline')
})
```

- [ ] **Step 5: 提交**

```bash
git add src/blocks/InfoList.ts src/blocks/IconList.ts src/blocks/Hscroll.ts src/blocks/index.ts src/generate/loadSiteData.ts src/render/__tests__/content-components.test.tsx
git commit -m "feat(cms): add info list, icon list and hscroll blocks"
```

---

### Task 3: 编辑器元数据、默认值与子组件规则

**Files:**
- Modify: `cms/src/editor/blocks.ts`
- Modify: `cms/src/editor/types.ts`
- Modify: `cms/src/editor/state.ts`
- Modify: `cms/src/editor/AddChildPicker.tsx`
- Test: `cms/src/editor/__tests__/blocks-meta.test.ts`

- [ ] **Step 1: 扩大字段定义类型**

In `cms/src/editor/blocks.ts`:

```ts
export interface RepeaterItemField {
  key: string
  label: string
  control: 'text' | 'textarea' | 'media'
}

export interface FieldDef {
  key: string
  label: string
  control:
    | 'text' | 'textarea' | 'number' | 'select' | 'boolean'
    | 'media' | 'mediaList' | 'link' | 'pageLink' | 'bg'
    | 'color' | 'textColor' | 'gradient' | 'repeater'
  options?: { label: string; value: string }[]
  itemFields?: RepeaterItemField[]
  addLabel?: string
}
```

- [ ] **Step 2: 扩展现有组件字段**

`grid` metadata add:

```ts
{ key: 'columnRatio', label: '列宽比例', control: 'select', options: [
  { label: '等宽', value: 'equal' },
  { label: '左窄右宽', value: 'leftNarrow' },
  { label: '左宽右窄', value: 'leftWide' },
] },
```

`text` metadata add:

```ts
{ key: 'fontSize', label: '正文字号', control: 'number' },
{ key: 'fontWeight', label: '正文字重', control: 'select', options: [
  { label: '常规', value: '400' }, { label: '中等', value: '600' }, { label: '粗体', value: '700' },
] },
{ key: 'maxWidth', label: '最大宽度', control: 'number' },
```

`imageText` metadata add:

```ts
{ key: 'subtitle', label: '副标题', control: 'text' },
{ key: 'subtitleColor', label: '副标题颜色', control: 'textColor' },
```

- [ ] **Step 3: 注册新组件元数据**

```ts
infoList: {
  type: 'infoList', label: '信息列表',
  defaults: () => ({ type: 'infoList', showDots: true, items: [{ label: '标签', desc: '说明' }] }),
  fields: [
    { key: 'items', label: '条目', control: 'repeater', addLabel: '添加条目', itemFields: [
      { key: 'label', label: '标签（可选）', control: 'text' },
      { key: 'desc', label: '说明', control: 'textarea' },
    ] },
    { key: 'showDots', label: '显示圆点', control: 'boolean' },
  ],
},
iconList: {
  type: 'iconList', label: '图标列表',
  defaults: () => ({ type: 'iconList', iconPosition: 'left', items: [{ icon: '', title: '标题', desc: '说明' }] }),
  fields: [
    { key: 'items', label: '条目', control: 'repeater', addLabel: '添加条目', itemFields: [
      { key: 'icon', label: '图标', control: 'media' },
      { key: 'title', label: '标题', control: 'text' },
      { key: 'desc', label: '说明', control: 'textarea' },
    ] },
    { key: 'iconPosition', label: '图标位置', control: 'select', options: [
      { label: '居左', value: 'left' }, { label: '居右', value: 'right' }, { label: '左右交替', value: 'alternate' },
    ] },
    { key: 'iconColor', label: '图标颜色', control: 'color' },
  ],
},
hscroll: {
  type: 'hscroll', label: '横向滚动',
  defaults: () => ({ type: 'hscroll', timeline: false, children: [] }),
  fields: [{ key: 'timeline', label: '时间轴连接线', control: 'boolean' }],
},
```

- [ ] **Step 4: 更新布局规则**

In `cms/src/editor/blocks.ts`:

```ts
export const LAYOUT_TYPES = ['section', 'grid', 'hscroll'] as const
export const SECTION_CHILD_TYPES: Block['type'][] = [
  'heading', 'grid', 'gallery', 'banner', 'slider', 'richtext',
  'infoList', 'iconList', 'hscroll',
]
export const HSCROLL_CHILD_TYPES: Block['type'][] = ['imageText']

export function allowedChildTypes(parent: Block['type']): Block['type'][] {
  if (parent === 'section') return [...SECTION_CHILD_TYPES]
  if (parent === 'grid') return [...GRID_CHILD_TYPES]
  if (parent === 'hscroll') return [...HSCROLL_CHILD_TYPES]
  return []
}
```

Add block summaries:

```ts
case 'infoList': return `信息列表 · ${b.items.length} 条`
case 'iconList': return `图标列表 · ${b.items.length} 条`
case 'hscroll': return `横向滚动 · ${b.children?.length || 0} 张`
```

- [ ] **Step 5: 更新嵌套容器**

In `cms/src/editor/state.ts`:

```ts
function isContainer(b: Block): boolean {
  return b.type === 'section' || b.type === 'grid' || b.type === 'hscroll'
}
```

No other changes needed for `withKids`, path traversal and insertion.

In `cms/src/editor/map.ts`, update `withIds`:

```ts
if ((b.type === 'section' || b.type === 'grid' || b.type === 'hscroll') && Array.isArray(rawBlock?.children) && Array.isArray((b as any).children)) {
  ;(b as any).children = (b as any).children.map((child: Block, i: number) =>
    withIds(rawBlock.children[i], child),
  )
}
```

- [ ] **Step 6: 添加组件缩略图**

In `cms/src/editor/AddChildPicker.tsx`, add entries for `infoList`, `iconList`, `hscroll` to `THUMBS`:

```tsx
infoList: <div style={{ height: 44, padding: 7 }}><div style={line('90%')} /><div style={line('80%')} /><div style={line('88%')} /><div style={line('70%')} /></div>,
iconList: <div style={{ height: 44, display: 'flex', flexDirection: 'column', gap: 3, padding: 6 }}><div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #E60039' }} /><span style={{ ...line('50%'), margin: 0 }} /></div><div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #E60039' }} /><span style={{ ...line('60%'), margin: 0 }} /></div></div>,
hscroll: <div style={{ height: 44, display: 'flex', gap: 4, padding: 6 }}><div style={{ flex: 1, background: '#f0e3ea', borderRadius: 3 }} /><div style={{ flex: 1, background: '#f0e3ea', borderRadius: 3 }} /><div style={{ flex: 1, background: '#f0e3ea', borderRadius: 3 }} /></div>,
```

- [ ] **Step 7: 更新测试并提交**

Update `blocks-meta.test.ts` expected section children:

```ts
expect(allowedChildTypes('section')).toEqual([
  'heading', 'grid', 'gallery', 'banner', 'slider', 'richtext',
  'infoList', 'iconList', 'hscroll',
])
expect(allowedChildTypes('hscroll')).toEqual(['imageText'])
```

Run:

```bash
npx vitest run src/editor/__tests__/blocks-meta.test.ts
npx tsc --noEmit
```

Expected: PASS，类型检查通过。

Commit:

```bash
git add src/editor/blocks.ts src/editor/types.ts src/editor/state.ts src/editor/map.ts src/editor/AddChildPicker.tsx src/editor/__tests__/blocks-meta.test.ts
git commit -m "feat(editor): register content blocks and hscroll layout"
```

---

### Task 4: 通用重复项编辑器

**Files:**
- Create: `cms/src/editor/RepeaterControl.tsx`
- Modify: `cms/src/editor/PropertyPanel.tsx`
- Modify: `cms/src/editor/editor.css`
- Test: `cms/src/editor/__tests__/repeater.test.tsx`

- [ ] **Step 1: 写失败测试**

Create `cms/src/editor/__tests__/repeater.test.tsx`:

```tsx
// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RepeaterControl from '../RepeaterControl'

const field = {
  key: 'items', label: '条目', control: 'repeater' as const,
  addLabel: '添加条目',
  itemFields: [
    { key: 'label', label: '标签', control: 'text' as const },
    { key: 'desc', label: '说明', control: 'textarea' as const },
  ],
}

describe('RepeaterControl', () => {
  it('adds and removes items', () => {
    const onChange = vi.fn()
    render(<RepeaterControl field={field as any} value={[{ label: 'A', desc: 'B' }]} onChange={onChange} />)
    fireEvent.click(screen.getByText('添加条目'))
    expect(onChange).toHaveBeenCalledWith([{ label: 'A', desc: 'B' }, { label: '', desc: '' }])
    fireEvent.click(screen.getByTitle('删除条目 1'))
    expect(onChange).toHaveBeenLastCalledWith([{ label: '', desc: '' }])
  })

  it('moves items', () => {
    const onChange = vi.fn()
    render(<RepeaterControl field={field as any} value={[{ label: 'A' }, { label: 'B' }]} onChange={onChange} />)
    fireEvent.click(screen.getByTitle('下移条目 1'))
    expect(onChange).toHaveBeenCalledWith([{ label: 'B' }, { label: 'A' }])
  })
})
```

- [ ] **Step 2: 实现控件**

`cms/src/editor/RepeaterControl.tsx`:

```tsx
'use client'
import React, { useState } from 'react'
import type { FieldDef, RepeaterItemField } from './blocks'
import MediaModal from './MediaModal'
import type { MediaItem } from './api'

type Value = Record<string, unknown>[]

export default function RepeaterControl({
  field, value, onChange,
}: {
  field: Extract<FieldDef, { control: 'repeater' }>
  value: Value | undefined
  onChange: (value: Value) => void
}) {
  const items = Array.isArray(value) ? value : []
  const [mediaTarget, setMediaTarget] = useState<{ index: number; key: string } | null>(null)

  const update = (next: Value) => onChange(next)
  const setField = (index: number, key: string, next: unknown) => {
    update(items.map((item, i) => (i === index ? { ...item, [key]: next } : item)))
  }
  const add = () => update([...items, Object.fromEntries((field.itemFields || []).map((f) => [f.key, '']))])
  const remove = (index: number) => update(items.filter((_, i) => i !== index))
  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir
    if (to < 0 || to >= items.length) return
    const next = items.slice()
    const [item] = next.splice(index, 1)
    next.splice(to, 0, item)
    update(next)
  }

  const renderField = (f: RepeaterItemField, index: number) => {
    const raw = items[index]?.[f.key]
    if (f.control === 'text') {
      return <input value={String(raw ?? '')} onChange={(e) => setField(index, f.key, e.target.value)} placeholder={f.label} />
    }
    if (f.control === 'textarea') {
      return <textarea value={String(raw ?? '')} rows={2} onChange={(e) => setField(index, f.key, e.target.value)} placeholder={f.label} />
    }
    const url = String(raw ?? '')
    return (
      <div className="rep-media">
        {url ? <img src={url} alt="" /> : <span>未选择</span>}
        <button type="button" onClick={() => setMediaTarget({ index, key: f.key })}>选择图片</button>
        {url ? <button type="button" className="rep-danger" onClick={() => setField(index, f.key, '')}>移除</button> : null}
      </div>
    )
  }

  return (
    <div className="rep">
      <div className="ed-label">{field.label}</div>
      {items.map((_, index) => (
        <div className="rep-item" key={index}>
          <div className="rep-head">
            <span>#{index + 1}</span>
            <span className="rep-actions">
              <button type="button" disabled={index === 0} title={`上移条目 ${index}`} onClick={() => move(index, -1)}>↑</button>
              <button type="button" disabled={index === items.length - 1} title={`下移条目 ${index}`} onClick={() => move(index, 1)}>↓</button>
              <button type="button" className="rep-danger" title={`删除条目 ${index + 1}`} onClick={() => remove(index)}>删除</button>
            </span>
          </div>
          {(field.itemFields || []).map((f) => (
            <label className="rep-field" key={f.key}>
              <span>{f.label}</span>
              {renderField(f, index)}
            </label>
          ))}
        </div>
      ))}
      <button type="button" className="rep-add" onClick={add}>{field.addLabel || '添加条目'}</button>
      {mediaTarget ? (
        <MediaModal
          onClose={() => setMediaTarget(null)}
          onSelect={(item: MediaItem) => {
            setField(mediaTarget.index, mediaTarget.key, item.url || '')
            setMediaTarget(null)
          }}
        />
      ) : null}
    </div>
  )
}
```

- [ ] **Step 3: 接入属性面板**

In `PropertyPanel.tsx` import:

```tsx
import RepeaterControl from './RepeaterControl'
```

Add case:

```tsx
case 'repeater': return (
  <RepeaterControl
    key={f.key}
    field={f}
    value={val(f.key) as Record<string, unknown>[] | undefined}
    onChange={(v) => onChange(f.key, v)}
  />
)
```

- [ ] **Step 4: 添加样式**

Append to `cms/src/editor/editor.css`:

```css
.rep { margin-bottom: 14px; }
.rep-item { border: 1px solid #eee7ea; border-radius: 7px; padding: 9px; margin-bottom: 8px; background: #fdfbfc; }
.rep-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; color: #8a7c83; font-size: 11px; }
.rep-actions { display: flex; gap: 4px; }
.rep-actions button, .rep-media button { border: 1px solid #e2d5db; background: #fff; color: #5a4a52; border-radius: 4px; padding: 2px 7px; font-size: 11px; cursor: pointer; }
.rep-actions button:disabled { opacity: .35; cursor: default; }
.rep-actions .rep-danger, .rep-media .rep-danger { color: #b42318; }
.rep-field { display: flex; flex-direction: column; gap: 3px; margin-bottom: 6px; color: #7c6b73; font-size: 11px; }
.rep-field input, .rep-field textarea { width: 100%; border: 1px solid #e2d5db; border-radius: 5px; padding: 6px 8px; font: inherit; font-size: 12px; }
.rep-media { display: flex; align-items: center; gap: 6px; }
.rep-media img { width: 40px; height: 32px; object-fit: contain; border: 1px solid #eee; border-radius: 4px; }
.rep-media span { font-size: 11px; color: #a08b95; }
.rep-add { border: 0; background: none; color: #c2185b; font-size: 12px; padding: 4px 0; cursor: pointer; }
```

- [ ] **Step 5: 运行测试并提交**

```bash
npx vitest run src/editor/__tests__/repeater.test.tsx
npx tsc --noEmit
git add src/editor/RepeaterControl.tsx src/editor/PropertyPanel.tsx src/editor/editor.css src/editor/__tests__/repeater.test.tsx
git commit -m "feat(editor): add generic repeater control"
```

---

### Task 5: 渲染新组件

**Files:**
- Modify: `cms/src/site/blocks.tsx`
- Modify: `cms/src/render/styles/base.css`

- [ ] **Step 1: 添加 InfoListView / IconListView / HscrollView**

In `cms/src/site/blocks.tsx` import types:

```ts
import type {
  BannerBlock, Block, ButtonBlock, GalleryBlock, GridBlock, HeadingBlock,
  IconCardBlock, IconListBlock, ImageBlock, ImageTextBlock, InfoListBlock,
  HscrollBlock, RichTextBlock, SectionBlock, SliderBlock, TextBlock,
} from '../render/types'
```

Implement before `blockNode`:

```tsx
export function InfoListView({ b }: { b: InfoListBlock }) {
  return (
    <div className="container" data-bid={b._id}>
      <div className="info-list">
        {(b.items || []).map((item, i) => (
          <div className={`info-item${b.showDots === false ? ' no-dot' : ''}`} key={i}>
            {b.showDots === false ? null : <span className="info-dot" />}
            <div className="info-content">
              {item.label ? <b className="info-label">{item.label}</b> : null}
              <span className="info-desc">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function IconListView({ b }: { b: IconListBlock }) {
  const pos = b.iconPosition || 'left'
  return (
    <div className="container" data-bid={b._id}>
      <div className={`icon-list-block icon-position-${pos}`}>
        {(b.items || []).map((item, i) => {
          const right = pos === 'right' || (pos === 'alternate' && i % 2 === 1)
          const icon = safeUrl(item.icon)
          return (
            <div className={`icon-list-row${right ? ' is-right' : ''}`} key={i}>
              <div className="icon-list-node" aria-hidden="true">
                {icon ? (
                  b.iconColor ? (
                    <span className="icon-list-glyph" style={{ backgroundColor: b.iconColor, WebkitMaskImage: `url('${icon}')`, maskImage: `url('${icon}')` }} />
                  ) : <img src={icon} alt="" />
                ) : null}
              </div>
              <div className="icon-list-body">
                {item.title ? <h3>{item.title}</h3> : null}
                {item.desc ? <p>{item.desc}</p> : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function HscrollView({ b, editor = false }: { b: HscrollBlock; editor?: boolean }) {
  const children = b.children || []
  return (
    <div className="container" data-bid={b._id}>
      {editor && children.length === 0 ? (
        <div className="ed-empty-block ed-empty-wide"><span className="ed-empty-label">横向滚动</span><span className="ed-empty-tip">添加图文卡片</span></div>
      ) : (
        <div className={`hscroll${b.timeline ? ' timeline' : ''}`}>
          <div className="hscroll-viewport" tabIndex={0} aria-label="横向滚动，按住拖动查看更多">
            <div className="hscroll-inner">
              {children.map((child, i) => (
                <div className="hscroll-item" key={child._id ?? i}>{blockNode(child, editor)}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

Add cases in `blockNode`:

```tsx
case 'infoList': return <InfoListView b={b} />
case 'iconList': return <IconListView b={b} />
case 'hscroll': return <HscrollView b={b} editor={editor} />
```

- [ ] **Step 2: 添加 CSS**

Append to `cms/src/render/styles/base.css`:

```css
/* Info list */
.info-list { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 22px 26px; box-shadow: 0 6px 18px rgba(138,14,75,.05); }
.info-item { display: flex; gap: 12px; align-items: baseline; padding: 9px 0; font-size: 15px; line-height: 1.7; border-bottom: 1px solid #f7eff3; }
.info-item:last-child { border-bottom: 0; }
.info-item.no-dot { padding-left: 0; }
.info-dot { flex: 0 0 7px; width: 7px; height: 7px; border-radius: 50%; background: var(--accent); margin-top: 9px; }
.info-label { color: var(--deep-blue); }
.info-desc { color: var(--dark-text); }

/* Icon list */
.icon-list-block { display: grid; gap: 13px; }
.icon-list-row { display: grid; grid-template-columns: 62px 1fr; gap: 18px; align-items: center; background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 16px 22px; box-shadow: 0 5px 14px rgba(138,14,75,.04); }
.icon-list-row.is-right { grid-template-columns: 1fr 62px; }
.icon-list-row.is-right .icon-list-node { order: 2; justify-self: end; }
.icon-list-row.is-right .icon-list-body { order: 1; }
.icon-list-node { width: 58px; height: 58px; border-radius: 50%; background: var(--light-blue); color: var(--accent); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.icon-list-node img, .icon-list-glyph { width: 26px; height: 26px; object-fit: contain; display: block; }
.icon-list-glyph { -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; }
.icon-list-body h3 { color: var(--deep-blue); font-size: 17px; line-height: 1.4; }
.icon-list-body p { color: var(--gray-blue); font-size: 13.5px; line-height: 1.65; margin-top: 3px; }

/* Horizontal scroll */
.hscroll-viewport { overflow-x: auto; overflow-y: hidden; cursor: grab; scrollbar-width: none; padding: 4px 4px 16px; overscroll-behavior-x: contain; scroll-snap-type: x proximity; }
.hscroll-viewport::-webkit-scrollbar { display: none; }
.hscroll-viewport.is-dragging { cursor: grabbing; scroll-snap-type: none; user-select: none; }
.hscroll-inner { position: relative; display: flex; gap: 20px; width: max-content; }
.hscroll-inner::before { content: ''; position: absolute; left: 0; right: 0; top: 195px; height: 2px; background: linear-gradient(90deg, var(--accent), #f3d6e2); display: none; }
.hscroll.timeline .hscroll-inner::before { display: block; }
.hscroll-item { flex: 0 0 260px; scroll-snap-align: start; }
.hscroll-item .container { width: 100%; max-width: none; padding: 0; margin: 0; }
.hscroll-item .image-text { height: 100%; }
.hscroll-item .it-img { height: 195px; aspect-ratio: auto; }
.hscroll-item .it-img img { width: 100%; height: 100%; object-fit: cover; }
.hscroll-item .it-body { padding: 15px 18px 18px; }
.hscroll-item .it-body h3 { font-size: 22px; }

@media (max-width: 860px) {
  .icon-list-row, .icon-list-row.is-right { grid-template-columns: 52px 1fr; gap: 14px; padding: 14px 16px; }
  .icon-list-row.is-right .icon-list-node { order: 0; justify-self: start; }
  .icon-list-row.is-right .icon-list-body { order: 0; }
  .icon-list-node { width: 48px; height: 48px; }
  .icon-list-node img, .icon-list-glyph { width: 23px; height: 23px; }
  .hscroll-item { flex-basis: 240px; }
  .hscroll-inner::before { top: 180px; }
  .hscroll-item .it-img { height: 180px; }
  .info-list { padding: 18px; }
  .info-item { font-size: 14px; }
}
```

- [ ] **Step 3: 运行渲染测试并提交**

```bash
npx vitest run src/render/__tests__/content-components.test.tsx
npx tsc --noEmit
git add src/site/blocks.tsx src/render/styles/base.css
git commit -m "feat(cms): render info list, icon list and hscroll"
```

---

### Task 6: 横向拖动脚本

**Files:**
- Modify: `cms/src/render/styles/main.js`

- [ ] **Step 1: 添加初始化函数**

In `main.js` add before `init`:

```js
function initHScroll() {
  document.querySelectorAll('.hscroll-viewport').forEach(function (viewport) {
    if (viewport.__hscrollReady) return
    viewport.__hscrollReady = true
    var down = false
    var startX = 0
    var startScroll = 0

    viewport.addEventListener('mousedown', function (e) {
      down = true
      startX = e.pageX
      startScroll = viewport.scrollLeft
      viewport.classList.add('is-dragging')
      e.preventDefault()
    })
    window.addEventListener('mousemove', function (e) {
      if (!down) return
      viewport.scrollLeft = startScroll - (e.pageX - startX)
    })
    function end() {
      if (!down) return
      down = false
      viewport.classList.remove('is-dragging')
    }
    window.addEventListener('mouseup', end)
    window.addEventListener('blur', end)

    viewport.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        viewport.scrollBy({ left: 280, behavior: 'smooth' })
        e.preventDefault()
      }
      if (e.key === 'ArrowLeft') {
        viewport.scrollBy({ left: -280, behavior: 'smooth' })
        e.preventDefault()
      }
    })
  })
}

function init() { initSliders(); initNav(); initHScroll() }
```

- [ ] **Step 2: 验证**

在预览中打开带 `hscroll` 的页面，确认鼠标拖动、方向键、触摸横向滚动均可用。

- [ ] **Step 3: 提交**

```bash
git add src/render/styles/main.js
git commit -m "feat(site): add horizontal card drag scrolling"
```

---

### Task 7: 编辑器保存映射

**Files:**
- Modify: `cms/src/editor/map.ts`

- [ ] **Step 1: 序列化新字段**

In `serializeBlock` add cases:

```ts
case 'infoList':
  out.items = (b.items || []).map((i) => ({ label: i.label || '', desc: i.desc || '' }))
  out.showDots = b.showDots !== false
  break
case 'iconList':
  out.items = (b.items || [])
    .map((i) => ({ icon: resolveMediaId(i.icon, urlToId, raw?.items?.[0]?.icon), title: i.title, desc: i.desc || '' }))
    .filter((i) => i.icon != null)
  out.iconPosition = b.iconPosition || 'left'
  if (b.iconColor !== undefined) out.iconColor = b.iconColor
  break
case 'hscroll':
  out.timeline = b.timeline === true
  out.children = editorToPayloadBlocks(b.children || [], urlToId)
  break
```

Update existing cases:

```ts
case 'text':
  if (b.fontSize !== undefined) out.fontSize = b.fontSize
  if (b.fontWeight !== undefined) out.fontWeight = b.fontWeight
  if (b.maxWidth !== undefined) out.maxWidth = b.maxWidth
  // existing fields...
  break
case 'imageText':
  if (b.subtitle !== undefined) out.subtitle = b.subtitle
  if (b.subtitleColor !== undefined) out.subtitleColor = b.subtitleColor
  // existing fields...
  break
case 'grid':
  if (b.columnRatio !== undefined) out.columnRatio = b.columnRatio
  // existing fields...
  break
```

For `iconList` per-item media resolution, replace the simple map with index-aware:

```ts
out.items = (b.items || []).map((i, index) => ({
  icon: resolveMediaId(i.icon, urlToId, raw?.items?.[index]?.icon),
  title: i.title,
  desc: i.desc || '',
})).filter((i) => i.icon != null)
```

- [ ] **Step 2: 验证**

在编辑器创建以下结构并保存：

```text
分栏 → 横向滚动 → 图文卡片 ×2
信息列表（3 条）
图标列表（2 条，图片）
```

重新打开页面，确认结构和媒体 URL 未丢失。

- [ ] **Step 3: 提交**

```bash
git add src/editor/map.ts
git commit -m "feat(editor): persist content component fields"
```

---

### Task 8: 迁移两页内容与图标资产

**Files:**
- Create: `cms/src/static/icons/steps/*.svg`
- Create: `cms/scripts/migrate-about-aupair.ts`
- Modify: `cms/package.json`

- [ ] **Step 1: 创建流程图标 SVG**

Create `cms/src/static/icons/steps/` with 9 files using the path data from `aupair-usa.html`:

```text
compass.svg   → <circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2z"/>
mic.svg       → <rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>
contract.svg  → <path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>
folder.svg    → <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/><path d="M3 10h18"/>
home.svg      → <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8z"/><path d="M9 21v-6h6v6"/>
check.svg     → <circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>
passport.svg  → <rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 17h6"/>
stamp.svg     → <path d="M5 21h14M7 18h10v-2a3 3 0 0 0-2-2.8V10a3 3 0 0 0-6 0v3.2A3 3 0 0 0 7 16z"/>
plane.svg     → <path d="m3 11 18-8-8 18-2-8-8-2z"/>
```

Also create `cms/src/static/icons/layers.svg` and `star.svg` with the paths from `about.html` (`layers`, `star`).

Each file format:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#E60039" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">…</svg>
```

- [ ] **Step 2: 编写迁移脚本**

Create `scripts/migrate-about-aupair.ts` with:

- `payload` initialized from `@payload-config`.
- `ensureMedia(filename, filePath, alt)` querying by filename; upload if missing.
- `ensurePage(route, title, blocks)` querying by route; create or update as draft.
- Build block helpers:

```ts
const section = (children: any[], extra: Record<string, unknown> = {}) => ({
  blockType: 'section', paddingY: 'md', ...extra, children,
})
const heading = (title: string) => ({ blockType: 'heading', title, align: 'center' })
const text = (body: string, extra: Record<string, unknown> = {}) => ({
  blockType: 'text', body, align: 'center', ...extra,
})
const grid = (columns: number, children: any[], extra: Record<string, unknown> = {}) => ({
  blockType: 'grid', columns, ...extra, children,
})
const image = (mediaId: number | string) => ({ blockType: 'image', media: mediaId })
const imageText = (mediaId: number | string, title: string, desc: string, subtitle?: string) => ({
  blockType: 'imageText', media: mediaId, title, desc,
  ...(subtitle ? { subtitle } : {}),
})
const infoList = (items: { label?: string; desc: string }[], showDots = true) => ({
  blockType: 'infoList', items, showDots,
})
const iconList = (items: any[], iconPosition = 'left') => ({
  blockType: 'iconList', items, iconPosition,
})
const hscroll = (children: any[], timeline: boolean) => ({
  blockType: 'hscroll', timeline, children,
})
```

- Transcribe content from:
  - `about.html` lines 300–432
  - `aupair-usa.html` lines 169–276
- Map images by filename: `img/about-hero.jpg` → `ensureMedia('about-hero.jpg')`.
- Use routes `/about/`, `/aupair-usa/`; title「关于中惠」「美国互惠生」.
- Set `_status: 'draft'`.
- Icon list items use `ensureMedia('compass.svg', 'src/static/icons/steps/compass.svg')` etc.
- Log created/updated pages.

- [ ] **Step 3: 添加脚本命令**

In `cms/package.json` scripts:

```json
"migrate:about-aupair": "tsx scripts/migrate-about-aupair.ts"
```

- [ ] **Step 4: 运行迁移**

```bash
npm run migrate:about-aupair
npm run migrate:about-aupair
```

Expected:
- 第一次创建页面与缺失媒体；
- 第二次不重复创建；
- 两页均为草稿。

- [ ] **Step 5: 预览两页**

打开：
- `http://admin.localhost:8080/admin/collections/pages`，确认两个草稿；
- 进入页面编辑器，预览 `/preview/pages/<id>`。

Expected: 所有区块正常渲染，移动端无横向溢出。

- [ ] **Step 6: 提交**

```bash
git add src/static/icons/steps scripts/migrate-about-aupair.ts package.json
git commit -m "feat(scripts): migrate about and aupair pages"
```

---

### Task 9: 全量验证

**Files:** 无新增

- [ ] **Step 1: 生成 import map**

```bash
npm run generate:importmap
```

- [ ] **Step 2: 类型与测试**

```bash
npx tsc --noEmit
npm test -- --run
```

Expected: 全部通过。

- [ ] **Step 3: 编辑器回归**

逐项验证：

- 信息列表：增删、排序、圆点开关、标签留空。
- 图标列表：增删、排序、图片选择、图标位置。
- 横向滚动：添加图文卡片、拖动排序、预览滚动。
- 网格：两列列宽比例。
- 文本：字号、字重、最大宽度。
- 图文卡片：副标题。
- 旧首页组件：无样式/保存回归。

- [ ] **Step 4: 静态站回归**

发布两页并重建站点，确认：

- `/about/`、`/aupair-usa/` 输出；
- 横向滚动可拖动；
- 图片、图标、链接正确；
- 移动端布局正常。

- [ ] **Step 5: 提交收尾**

如发现修复，单独提交：

```bash
git add <files>
git commit -m "fix(cms): <具体问题>"
```

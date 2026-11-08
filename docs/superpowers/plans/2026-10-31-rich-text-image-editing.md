# 富文本图片与图集编辑 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让富文本中的单图可点击替换，图集可点击打开预选当前图片的多选弹窗并增删图片。

**Architecture:** 复用现有 `MediaModal`，增加初始选中图片和确认按钮文案能力；`ImageNode` / `ImageRowNode` 增加节点级写回方法，图片节点自己管理媒体弹窗状态。所有修改通过 `editor.update` 进入 Lexical 撤销历史，继续沿用现有保存、Canvas 和预览同步。

**Tech Stack:** Next 16、React 19、Lexical、Vitest、Testing Library、jsdom

---

## 文件结构

- `cms/src/editor/MediaModal.tsx`：支持预选图片、匹配媒体库、更新确认文案。
- `cms/src/editor/ImageNode.tsx`：单图点击打开替换弹窗，新增 `setImage`。
- `cms/src/editor/ImageRowNode.tsx`：图集点击图片打开整组编辑弹窗，新增 `setImages`。
- `cms/src/editor/editor.css`：图片按钮、焦点态、图集网格内按钮样式。
- `cms/src/editor/__tests__/media-modal.test.tsx`：媒体弹窗预选与确认顺序。
- `cms/src/editor/__tests__/image-nodes.test.tsx`：Lexical 节点数据更新。
- `docs/content-components.md`：补充富文本图片/图集编辑说明。

---

### Task 1: MediaModal 支持预选与更新文案

**Files:**
- Modify: `cms/src/editor/MediaModal.tsx`
- Test: `cms/src/editor/__tests__/media-modal.test.tsx`

- [ ] **Step 1: 写失败测试**

Create `cms/src/editor/__tests__/media-modal.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MediaModal from '../MediaModal'

vi.mock('../api', () => ({
  listMedia: vi.fn(async () => [
    { id: 1, url: '/a.jpg', alt: 'A' },
    { id: 2, url: '/b.jpg', alt: 'B' },
    { id: 3, url: '/c.jpg', alt: 'C' },
  ]),
  uploadMedia: vi.fn(),
}))

function imageButton(name: string) {
  return screen.getByAltText(name).closest('button') as HTMLButtonElement
}

describe('MediaModal', () => {
  it('preselects initial images and confirms in selection order', async () => {
    const onSelectMany = vi.fn()
    render(
      <MediaModal
        multiple
        title="编辑图集"
        initialImages={[{ src: '/b.jpg', alt: 'B' }]}
        confirmVerb="更新"
        onSelectMany={onSelectMany}
        onClose={() => {}}
      />,
    )

    await waitFor(() => expect(imageButton('B').className).toContain('is-selected'))
    expect(screen.getByText('更新 1 张')).toBeTruthy()

    fireEvent.click(imageButton('C'))
    expect(screen.getByText('更新 2 张')).toBeTruthy()
    fireEvent.click(screen.getByText('更新 2 张'))

    expect(onSelectMany).toHaveBeenCalledWith([
      expect.objectContaining({ url: '/b.jpg' }),
      expect.objectContaining({ url: '/c.jpg' }),
    ])
  })

  it('keeps initial images that are missing from the media library', async () => {
    render(
      <MediaModal
        multiple
        initialImages={[{ src: '/old.jpg', alt: 'Old' }]}
        confirmVerb="更新"
        onSelectMany={() => {}}
        onClose={() => {}}
      />,
    )

    await waitFor(() => expect(screen.getByAltText('Old')).toBeTruthy())
    expect(screen.getByText('更新 1 张')).toBeTruthy()
  })

  it('highlights the current image in single mode and selects a replacement', async () => {
    const onSelect = vi.fn()
    render(
      <MediaModal
        initialImages={[{ src: '/a.jpg', alt: 'A' }]}
        onSelect={onSelect}
        onClose={() => {}}
      />,
    )

    await waitFor(() => expect(imageButton('A').className).toContain('is-selected'))
    fireEvent.click(imageButton('B'))

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ url: '/b.jpg' }))
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/editor/__tests__/media-modal.test.tsx`

Expected: FAIL，`initialImages` / `confirmVerb` 未生效，更新文案仍为「插入」。

- [ ] **Step 3: 实现 MediaModal**

Replace `cms/src/editor/MediaModal.tsx` with:

```tsx
'use client'
import React, { useEffect, useRef, useState } from 'react'
import { listMedia, uploadMedia, type MediaItem } from './api'

type InitialImage = { src: string; alt?: string }

function toMediaItem(image: InitialImage): MediaItem {
  return { id: `url:${image.src}`, url: image.src, alt: image.alt || '' }
}

function sameMedia(a: MediaItem, b: MediaItem): boolean {
  if (a.url && b.url) return a.url === b.url
  return a.id === b.id
}

function initialItems(images?: InitialImage[]): MediaItem[] {
  const seen = new Set<string>()
  const items: MediaItem[] = []
  for (const image of images || []) {
    if (!image?.src || seen.has(image.src)) continue
    seen.add(image.src)
    items.push(toMediaItem(image))
  }
  return items
}

export default function MediaModal({
  onClose,
  onSelect,
  onSelectMany,
  multiple = false,
  title,
  initialImages,
  confirmVerb = '插入',
}: {
  onClose: () => void
  onSelect?: (item: MediaItem) => void
  onSelectMany?: (items: MediaItem[]) => void
  multiple?: boolean
  title?: string
  initialImages?: InitialImage[]
  confirmVerb?: string
}) {
  const [initial] = useState(() => initialItems(initialImages))
  const [items, setItems] = useState<MediaItem[]>(initial)
  const [selected, setSelected] = useState<MediaItem[]>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listMedia()
      .then((media) => {
        const missing = initial.filter((item) => !media.some((next) => next.url === item.url))
        setItems([...missing, ...media])
      })
      .catch(() => setItems(initial))
  }, [initial])

  const isSelected = (item: MediaItem) => selected.some((next) => sameMedia(next, item))

  const toggle = (item: MediaItem) => {
    setSelected((current) => {
      if (current.some((next) => sameMedia(next, item))) {
        return current.filter((next) => !sameMedia(next, item))
      }
      return [...current, item]
    })
  }

  const pick = (item: MediaItem) => {
    if (multiple) toggle(item)
    else onSelect?.(item)
  }

  const upload = async (f: File) => {
    setBusy(true)
    setError('')
    try {
      const m = await uploadMedia(f)
      setItems((s) => [m, ...s])
      if (multiple) {
        setSelected((current) => [...current, m])
      } else {
        onSelect?.(m)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败，请重试')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="ed-modal" onClick={onClose}>
      <div className="ed-modal-body" onClick={(e) => e.stopPropagation()}>
        <div className="ed-modal-head">
          <b>{title || (multiple ? '选择图片（可多选）' : '选择图片')}</b>
          <button type="button" onClick={onClose}>✕</button>
        </div>
        <div className="ed-modal-actions">
          <label className={`ed-upload-btn${busy ? ' is-busy' : ''}`}>
            <span>{busy ? '上传中…' : '上传'}</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              disabled={busy}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f) }}
            />
          </label>
          {error ? <span className="ed-modal-error">{error}</span> : null}
        </div>
        <div className="ed-media-grid">
          {items.map((m) => (m.url ? (
            <button
              type="button"
              key={m.id}
              className={isSelected(m) ? 'is-selected' : undefined}
              onClick={() => pick(m)}
            >
              <img src={m.url} alt={m.alt || ''} />
              {isSelected(m) ? <span className="ed-media-check">✓</span> : null}
            </button>
          ) : null))}
        </div>
        {multiple ? (
          <div className="ed-modal-footer">
            <button type="button" className="ed-modal-cancel" onClick={onClose}>取消</button>
            <button
              type="button"
              className="ed-modal-confirm"
              disabled={!selected.length}
              onClick={() => { onSelectMany?.(selected); onClose() }}
            >
              {confirmVerb} {selected.length} 张
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/editor/__tests__/media-modal.test.tsx`

Expected: PASS，3 个测试通过。

- [ ] **Step 5: 提交**

```bash
git add cms/src/editor/MediaModal.tsx cms/src/editor/__tests__/media-modal.test.tsx
git commit -m "feat(editor): preselect media in modal"
```

---

### Task 2: 单图点击替换

**Files:**
- Modify: `cms/src/editor/ImageNode.tsx`
- Modify: `cms/src/editor/editor.css`
- Test: `cms/src/editor/__tests__/image-nodes.test.tsx`

- [ ] **Step 1: 写失败测试**

Create `cms/src/editor/__tests__/image-nodes.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { createEditor, $getRoot } from 'lexical'
import { ImageNode } from '../ImageNode'

describe('rich text image nodes', () => {
  it('updates a single image without moving the node', () => {
    const editor = createEditor({ namespace: 'test', nodes: [ImageNode] })
    let node: ImageNode | undefined

    editor.update(() => {
      node = new ImageNode('/a.jpg', 'A')
      $getRoot().append(node)
      node.setImage('/b.jpg', 'B')
    })

    expect(node?.exportJSON()).toMatchObject({ type: 'rich-image', src: '/b.jpg', alt: 'B' })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/editor/__tests__/image-nodes.test.tsx`

Expected: FAIL，`setImage` 不存在。

- [ ] **Step 3: 实现 ImageNode 替换**

在 `cms/src/editor/ImageNode.tsx` 中：

1. 顶部增加导入：

```tsx
import { useState } from 'react'
import MediaModal from './MediaModal'
import type { MediaItem } from './api'
```

2. 将 `ImageView` 替换为：

```tsx
function ImageView({ nodeKey, src, alt }: { nodeKey: NodeKey; src: string; alt?: string }) {
  const [editor] = useLexicalComposerContext()
  const [picking, setPicking] = useState(false)

  const replace = (item: MediaItem) => {
    if (!item.url) return
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node instanceof ImageNode) node.setImage(item.url as string, item.alt || '')
    })
    setPicking(false)
  }

  return (
    <div className="rt-single-image" contentEditable={false}>
      <button
        type="button"
        className="rt-image-edit"
        title="点击更换图片"
        aria-label="更换图片"
        onClick={() => setPicking(true)}
      >
        <img src={src} alt={alt || ''} />
      </button>
      <button
        type="button"
        className="rt-image-row-delete"
        onClick={() => {
          editor.update(() => {
            const node = $getNodeByKey(nodeKey)
            if (node) node.remove()
          })
        }}
      >
        移除图片
      </button>
      {picking ? (
        <MediaModal
          title="更换图片"
          initialImages={[{ src, alt }]}
          onClose={() => setPicking(false)}
          onSelect={replace}
        />
      ) : null}
    </div>
  )
}
```

3. 在 `ImageNode` 类中、`exportJSON` 之前增加：

```tsx
  setImage(src: string, alt = ''): void {
    const writable = this.getWritable()
    writable.__src = src
    writable.__alt = alt
  }
```

- [ ] **Step 4: 增加按钮样式**

在 `cms/src/editor/editor.css` 的 `.rt-single-image` 规则附近增加：

```css
.rt-image-edit { display: block; width: 100%; padding: 0; border: 0; background: none; cursor: pointer; }
.rt-image-edit:focus-visible { outline: 2px solid #1e6fff; outline-offset: 2px; }
.rt-image-edit img { display: block; }
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npx vitest run src/editor/__tests__/image-nodes.test.tsx`

Expected: PASS，单图测试通过。

- [ ] **Step 6: 提交**

```bash
git add cms/src/editor/ImageNode.tsx cms/src/editor/editor.css cms/src/editor/__tests__/image-nodes.test.tsx
git commit -m "feat(editor): replace rich text images"
```

---

### Task 3: 图集点击整组编辑

**Files:**
- Modify: `cms/src/editor/ImageRowNode.tsx`
- Modify: `cms/src/editor/editor.css`
- Test: `cms/src/editor/__tests__/image-nodes.test.tsx`

- [ ] **Step 1: 追加图集失败测试**

在 `cms/src/editor/__tests__/image-nodes.test.tsx` 中补充：

```tsx
import { ImageRowNode } from '../ImageRowNode'
```

并在文件末尾的 `describe` 内追加：

```tsx
  it('updates all gallery images while keeping columns', () => {
    const editor = createEditor({ namespace: 'test', nodes: [ImageNode, ImageRowNode] })
    let node: ImageRowNode | undefined

    editor.update(() => {
      node = new ImageRowNode([{ src: '/a.jpg' }], 2)
      $getRoot().append(node)
      node.setImages([{ src: '/b.jpg', alt: 'B' }, { src: '/c.jpg', alt: 'C' }])
    })

    expect(node?.exportJSON()).toMatchObject({
      type: 'image-row',
      columns: 2,
      images: [{ src: '/b.jpg', alt: 'B' }, { src: '/c.jpg', alt: 'C' }],
    })
  })
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/editor/__tests__/image-nodes.test.tsx`

Expected: FAIL，`setImages` 不存在。

- [ ] **Step 3: 实现 ImageRowNode 写回方法**

在 `cms/src/editor/ImageRowNode.tsx` 中：

1. 顶部增加导入：

```tsx
import { useState } from 'react'
import MediaModal from './MediaModal'
import type { MediaItem } from './api'
```

2. 在 `ImageRowNode` 类中、`setColumns` 之前增加：

```tsx
  setImages(images: ImageRowItem[]): void {
    const writable = this.getWritable()
    writable.__images = images
  }
```

3. 将 `ImageRowView` 替换为：

```tsx
function ImageRowView({
  nodeKey,
  images,
  columns,
}: {
  nodeKey: NodeKey
  images: ImageRowItem[]
  columns: number
}) {
  const [editor] = useLexicalComposerContext()
  const [picking, setPicking] = useState(false)
  const cols = Math.min(4, Math.max(1, columns || 3))

  const updateColumns = (next: number) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node instanceof ImageRowNode) node.setColumns(next)
    })
  }

  const updateImages = (items: MediaItem[]) => {
    const next = items
      .filter((item) => item.url)
      .map((item) => ({ src: item.url as string, alt: item.alt || '' }))
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node instanceof ImageRowNode) node.setImages(next)
    })
    setPicking(false)
  }

  return (
    <div className="rt-image-row" contentEditable={false}>
      <div className={`rt-image-row-grid rt-image-row-grid-cols-${cols}`}>
        {images.map((image, index) => (
          <button
            type="button"
            className="rt-image-edit"
            key={`${image.src}-${index}`}
            title="点击编辑图集"
            aria-label={`编辑图集，第 ${index + 1} 张`}
            onClick={() => setPicking(true)}
          >
            <img src={image.src} alt={image.alt || ''} />
          </button>
        ))}
      </div>
      <div className="rt-image-row-tools">
        <label>
          列数
          <select value={cols} onChange={(e) => updateColumns(Number(e.target.value))}>
            {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value} 列</option>)}
          </select>
        </label>
        <button
          type="button"
          className="rt-image-row-delete"
          onClick={() => {
            editor.update(() => {
              const node = $getNodeByKey(nodeKey)
              if (node) node.remove()
            })
          }}
        >
          移除图集
        </button>
      </div>
      {picking ? (
        <MediaModal
          title="编辑图集"
          multiple
          initialImages={images}
          confirmVerb="更新"
          onClose={() => setPicking(false)}
          onSelectMany={updateImages}
        />
      ) : null}
    </div>
  )
}
```

- [ ] **Step 4: 调整图集网格按钮样式**

在 `cms/src/editor/editor.css` 中 `.rt-image-row-grid` 规则后增加：

```css
.rt-image-row-grid .rt-image-edit { min-width: 0; width: 100%; }
```

- [ ] **Step 5: 运行节点测试**

Run: `npx vitest run src/editor/__tests__/image-nodes.test.tsx`

Expected: PASS，单图和图集写回测试均通过。

- [ ] **Step 6: 手动验证交互**

启动/刷新后台，打开含富文本的页面（如 Page 50）：

1. 打开富文本编辑器，点击单图 → 出现媒体弹窗且当前图高亮；选择新图后 Canvas 更新。
2. 点击图集任意图片 → 出现多选弹窗且当前所有图片高亮；取消一张、再选一张，确认后图集数量和顺序更新。
3. 修改列数、删除图集仍正常。
4. 取消弹窗不修改内容；关闭富文本后保存，独立预览与 Canvas 一致。

- [ ] **Step 7: 提交**

```bash
git add cms/src/editor/ImageRowNode.tsx cms/src/editor/editor.css cms/src/editor/__tests__/image-nodes.test.tsx
git commit -m "feat(editor): edit rich text galleries"
```

---

### Task 4: 文档与整体验证

**Files:**
- Modify: `docs/content-components.md`

- [ ] **Step 1: 更新组件说明**

在 `docs/content-components.md` 的富文本说明中补充：

```md
- 点击富文本中的单图可打开单选媒体弹窗替换，当前图片自动预选。
- 点击图集内任意图片可打开多选媒体弹窗，当前图片自动预选；取消选中即删除，选择新图即追加，确认后整组更新。
- 图集列数通过工具条调整；删除整个图集使用「移除图集」。
```

- [ ] **Step 2: 运行完整验证**

Run:

```bash
cd cms
npx tsc --noEmit
npm test -- --run
npm run build:generator
```

Expected: TypeScript 无错误，全部测试通过，generator 构建成功。

- [ ] **Step 3: 提交**

```bash
git add docs/content-components.md
git commit -m "docs: document rich text image editing"
```

---

## 自检

- [x] 每个 spec 目标都有对应任务：单图替换、图集预选增删、取消语义、媒体库缺失图片保留、测试、文档。
- [x] 无 TBD / TODO / 占位实现。
- [x] 类型和命名一致：`initialImages`、`confirmVerb`、`setImage`、`setImages`。
- [x] 改动范围仅限富文本图片编辑，不涉及数据库迁移或静态转换器。

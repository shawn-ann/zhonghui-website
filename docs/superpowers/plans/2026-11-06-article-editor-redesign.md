# 文章编辑页重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把文章编辑页改成左侧写作、右侧属性的两栏界面，正文富文本内联编辑，并统一全系统时间为北京时间 `YYYY/MM/DD HH:mm:ss`。

**Architecture:** 保留 Payload 默认文档视图（草稿/发布/版本/校验不动），用 `admin-theme.css` 以 `.collection-edit--cases` 作用域改布局，配合三个字段组件（URL 前缀、1:1 封面、内联正文）。发布日期由 `beforeChange` 自动写入北京日期，列表按它倒序。

**Tech Stack:** Next.js 16.3.3、Payload 3.90.2、React 19、Lexical、Vitest 4、Playwright MCP。

**Spec:** `docs/superpowers/specs/2026-11-06-article-editor-redesign-design.md`

## Global Constraints

- 所有后台时间与日志使用北京时间、格式 `YYYY/MM/DD HH:mm:ss`（示例 `2026/01/01 12:12:30`）；时区统一 `Asia/Shanghai`。
- 文章表单只保留：分类、标题、URL、正文、封面；发布日期在表单中隐藏。
- 分类只能选择，不能新增或编辑（`allowCreate: false`、`allowEdit: false`）。
- 发布日期：新建时写入北京日历日，存成 `${day}T00:00:00.000Z`；之后任何保存都不修改；历史空值在首次更新时用 `createdAt` 补齐。
- 封面必填，只提供「更换」，不提供「移除」；预览比例 1:1。
- 不修改前台公开站点的日期显示与卡片样式。
- 现有 221 个测试必须保持全绿；`npx tsc --noEmit` 必须通过。

## Review Focus

- 服务器运行在 UTC（容器默认）时，北京时间 0–8 点创建的文章不能落到前一天。由 Task 2 的 `now = 2026-01-01T20:00:00Z` 测试钉住。
- 浏览器时区不是北京时，后台时间仍要显示北京时间。由 Task 1 的 `Intl` 工具与全局 `admin.timezones` 钉住。
- 分类未选或已被删除时，URL 前缀不能出现 `/blog/undefined/` 或 `/blog/null/`。由 Task 4 的 `slugPrefix` 测试钉住。
- 正文很长时，内联富文本保存后内容不能丢失、不能重复。由 Task 3 的内联模式 + Task 6 的保存回归钉住。
- 历史文章 `publishedAt` 为空时，更新一次就补齐且之后不再变化。由 Task 2 的 `resolvePublishedAt` 测试钉住。

---

### Task 1: 北京时间工具与全局时间格式

**Files:**
- Create: `cms/src/lib/datetime.ts`
- Test: `cms/src/lib/__tests__/datetime.test.ts`
- Modify: `cms/src/payload.config.ts`（`admin` 对象）
- Modify: `cms/src/components/PagesListView.tsx:187`
- Modify: `deploy/docker-compose.local.yml`（cms / builder 的 `environment`）
- Modify: `deploy/docker-compose.yml`（cms / builder 的 `environment`）

**Interfaces:**
- Produces:
  - `beijingDateKey(value: string | number | Date): string` — 返回 `YYYY-MM-DD`，非法/空值返回 `''`
  - `beijingDayStart(value: string | number | Date): string` — 返回 `${YYYY-MM-DD}T00:00:00.000Z`
  - `formatBeijingTime(value: string | number | Date | null | undefined): string` — 返回 `YYYY/MM/DD HH:mm:ss`，空值返回 `''`

- [ ] **Step 1: 写失败测试**

Create `cms/src/lib/__tests__/datetime.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { beijingDateKey, beijingDayStart, formatBeijingTime } from '../datetime'

describe('Beijing time helpers', () => {
  it('formats an instant as Beijing YYYY/MM/DD HH:mm:ss', () => {
    expect(formatBeijingTime('2026-01-01T04:12:30.000Z')).toBe('2026/01/01 12:12:30')
  })

  it('rolls over to the next Beijing day', () => {
    expect(formatBeijingTime('2025-12-31T16:30:00.000Z')).toBe('2026/01/01 00:30:00')
    expect(beijingDateKey('2025-12-31T16:30:00.000Z')).toBe('2026-01-01')
  })

  it('returns an empty string for missing or invalid values', () => {
    expect(formatBeijingTime(null)).toBe('')
    expect(formatBeijingTime(undefined)).toBe('')
    expect(formatBeijingTime('not-a-date')).toBe('')
    expect(beijingDateKey('not-a-date')).toBe('')
  })

  it('anchors a Beijing calendar day at UTC midnight', () => {
    expect(beijingDayStart('2026-01-01T20:00:00.000Z')).toBe('2026-01-02T00:00:00.000Z')
    expect(beijingDayStart('2026-01-01T04:00:00.000Z')).toBe('2026-01-01T00:00:00.000Z')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `cd cms && npx vitest run src/lib/__tests__/datetime.test.ts`
Expected: FAIL，「Failed to resolve import "../datetime"」

- [ ] **Step 3: 实现工具**

Create `cms/src/lib/datetime.ts`:

```ts
const BEIJING = 'Asia/Shanghai'

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BEIJING, year: 'numeric', month: '2-digit', day: '2-digit',
})
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: BEIJING, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 北京日历日，YYYY-MM-DD；空值/非法值返回空串。 */
export function beijingDateKey(value: string | number | Date | null | undefined): string {
  const date = toDate(value)
  if (!date) return ''
  const parts = dateFormatter.formatToParts(date)
  const pick = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return `${pick('year')}-${pick('month')}-${pick('day')}`
}

/** 把某个时刻归一到其北京日历日的 UTC 零点。 */
export function beijingDayStart(value: string | number | Date | null | undefined): string {
  const key = beijingDateKey(value)
  return key ? `${key}T00:00:00.000Z` : ''
}

/** 后台统一时间格式：YYYY/MM/DD HH:mm:ss（Asia/Shanghai）。 */
export function formatBeijingTime(value: string | number | Date | null | undefined): string {
  const date = toDate(value)
  if (!date) return ''
  const day = beijingDateKey(date).replace(/-/g, '/')
  return `${day} ${timeFormatter.format(date)}`
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd cms && npx vitest run src/lib/__tests__/datetime.test.ts`
Expected: PASS（4 tests）

- [ ] **Step 5: 接入全局后台日期与页面列表**

在 `cms/src/payload.config.ts` 的 `admin` 对象里加（放在 `meta` 之后即可）：

```ts
    timezones: { defaultTimezone: 'Asia/Shanghai' },
    dateFormat: 'yyyy/MM/dd HH:mm:ss',
```

在 `cms/src/components/PagesListView.tsx` 顶部引入 `import { formatBeijingTime } from '../../lib/datetime'`，把第 187 行改为：

```tsx
                <td>{page.updatedAt ? formatBeijingTime(page.updatedAt) : '—'}</td>
```

- [ ] **Step 6: 容器时区**

在 `deploy/docker-compose.local.yml` 的 `cms` 与 `builder` 的 `environment` 各加一行：

```yaml
      TZ: Asia/Shanghai
```

在 `deploy/docker-compose.yml` 的 `cms` 与 `builder` 的 `environment` 各加一行：

```yaml
      TZ: Asia/Shanghai
```

- [ ] **Step 7: 回归与提交**

Run: `cd cms && npx tsc --noEmit && npx vitest run src/lib/__tests__/datetime.test.ts`
Expected: 类型通过，测试通过

```bash
git add cms/src/lib/datetime.ts cms/src/lib/__tests__/datetime.test.ts cms/src/payload.config.ts cms/src/components/PagesListView.tsx deploy/docker-compose.yml deploy/docker-compose.local.yml
git commit -m "feat(admin): use Beijing time across admin dates"
```

---

### Task 2: 发布日期的写入规则、列表排序与分类下拉

**Files:**
- Create: `cms/src/collections/publishedAt.ts`
- Test: `cms/src/collections/__tests__/publishedAt.test.ts`
- Test: `cms/src/collections/__tests__/casesConfig.test.ts`
- Modify: `cms/src/collections/Cases.ts`
- Regenerate: `cms/src/payload-types.ts`（用命令生成，不手改）

**Interfaces:**
- Consumes: `beijingDayStart(value)`（Task 1）
- Produces: `resolvePublishedAt(input: { operation: 'create' | 'update'; current?: string | null; incoming?: string | null; createdAt?: string | null; now?: Date }): string`

- [ ] **Step 1: 写失败测试**

Create `cms/src/collections/__tests__/publishedAt.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { resolvePublishedAt } from '../publishedAt'

describe('resolvePublishedAt', () => {
  it('writes the Beijing calendar day on create', () => {
    expect(resolvePublishedAt({
      operation: 'create', now: new Date('2026-01-01T20:00:00.000Z'),
    })).toBe('2026-01-02T00:00:00.000Z')
  })

  it('keeps an existing value on update', () => {
    expect(resolvePublishedAt({
      operation: 'update', current: '2025-07-02T00:00:00.000Z', now: new Date('2026-01-01T00:00:00.000Z'),
    })).toBe('2025-07-02T00:00:00.000Z')
  })

  it('ignores an incoming change on update', () => {
    expect(resolvePublishedAt({
      operation: 'update', current: '2025-07-02T00:00:00.000Z', incoming: '2026-02-02T00:00:00.000Z',
    })).toBe('2025-07-02T00:00:00.000Z')
  })

  it('backfills a missing historical value from createdAt', () => {
    expect(resolvePublishedAt({
      operation: 'update', createdAt: '2025-06-30T10:00:00.000Z', now: new Date('2026-01-01T00:00:00.000Z'),
    })).toBe('2025-06-30T00:00:00.000Z')
  })

  it('keeps an explicitly provided value on create', () => {
    expect(resolvePublishedAt({
      operation: 'create', incoming: '2025-01-05T00:00:00.000Z', now: new Date('2026-01-01T00:00:00.000Z'),
    })).toBe('2025-01-05T00:00:00.000Z')
  })
})
```

Create `cms/src/collections/__tests__/casesConfig.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { Cases } from '../Cases'

const field = (name: string) => Cases.fields.find((item) => 'name' in item && item.name === name) as any

describe('Cases admin config', () => {
  it('sorts the list by published date descending and shows it', () => {
    expect(Cases.defaultSort).toBe('-publishedAt')
    expect(Cases.admin?.defaultColumns).toEqual(['title', 'category', 'publishedAt', '_status'])
  })

  it('only allows picking an existing category', () => {
    expect(field('category').admin).toMatchObject({ allowCreate: false, allowEdit: false, position: 'sidebar' })
  })

  it('hides the published date from the form', () => {
    expect(field('publishedAt').admin?.hidden).toBe(true)
    expect(field('publishedAt').required).toBeFalsy()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `cd cms && npx vitest run src/collections/__tests__`
Expected: FAIL，`../publishedAt` 不存在；配置断言不满足

- [ ] **Step 3: 实现日期规则**

Create `cms/src/collections/publishedAt.ts`:

```ts
import { beijingDayStart } from '../lib/datetime'

export function resolvePublishedAt(input: {
  operation: 'create' | 'update'
  current?: string | null
  incoming?: string | null
  createdAt?: string | null
  now?: Date
}): string {
  const { operation, current, incoming, createdAt, now } = input
  if (current) return String(current)
  if (operation === 'update') {
    return beijingDayStart(createdAt ?? now ?? new Date())
  }
  return incoming ? String(incoming) : beijingDayStart(now ?? new Date())
}
```

- [ ] **Step 4: 接入 Cases 配置**

在 `cms/src/collections/Cases.ts`：

1. 顶部加 `import { resolvePublishedAt } from './publishedAt'`。
2. 集合根对象加：

```ts
  defaultSort: '-publishedAt',
```

3. `admin.defaultColumns` 改为：

```ts
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
```

4. `beforeChange` 数组最前面加一个 hook：

```ts
    beforeChange: [
      ({ data, originalDoc, operation }) => {
        data.publishedAt = resolvePublishedAt({
          operation,
          current: (originalDoc as any)?.publishedAt,
          incoming: data.publishedAt,
          createdAt: (originalDoc as any)?.createdAt,
        })
        return data
      },
      // …原有 redirect hook 保持不变
    ],
```

5. `category` 字段的 `admin` 改为：

```ts
      admin: { position: 'sidebar', allowCreate: false, allowEdit: false },
```

6. `publishedAt` 字段改为：

```ts
    {
      name: 'publishedAt',
      type: 'date',
      label: '发布日期',
      admin: { hidden: true },
    },
```

- [ ] **Step 5: 运行确认通过**

Run: `cd cms && npx vitest run src/collections/__tests__`
Expected: PASS（8 tests）

- [ ] **Step 6: 重新生成类型并提交**

Run: `cd cms && npm run generate:types`
Expected: `src/payload-types.ts` 更新，`publishedAt` 变为可选（如有变化）

Run: `cd cms && npx tsc --noEmit`
Expected: 通过

```bash
git add cms/src/collections/publishedAt.ts cms/src/collections/__tests__ cms/src/collections/Cases.ts cms/src/payload-types.ts
git commit -m "feat(articles): auto-manage published date and sort by it"
```

---

### Task 3: 正文富文本内联编辑

**Files:**
- Modify: `cms/src/editor/RichTextControl.tsx:157-191`
- Modify: `cms/src/components/admin/ArticleBodyField.tsx`
- Test: `cms/src/editor/__tests__/rich-text-inline.test.tsx`

**Interfaces:**
- Produces: `RichTextControl` 新增可选 prop `inline?: boolean`（默认 `false`，保持弹窗行为）

- [ ] **Step 1: 写失败测试**

Create `cms/src/editor/__tests__/rich-text-inline.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import RichTextControl from '../RichTextControl'

describe('RichTextControl inline mode', () => {
  it('renders the editor directly without the modal trigger', () => {
    render(<RichTextControl inline label="正文" value={null} onChange={() => {}} />)
    expect(document.querySelector('.rt-toolbar')).toBeTruthy()
    expect(document.querySelector('.rt-content')).toBeTruthy()
    expect(document.querySelector('.rt-open')).toBeNull()
    expect(document.querySelector('.rt-modal')).toBeNull()
  })

  it('keeps the modal trigger by default', () => {
    render(<RichTextControl label="正文" value={null} onChange={() => {}} />)
    expect(document.querySelector('.rt-open')).toBeTruthy()
    expect(document.querySelector('.rt-modal')).toBeNull()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `cd cms && npx vitest run src/editor/__tests__/rich-text-inline.test.tsx`
Expected: FAIL，第一个用例找不到 `.rt-toolbar`（仍渲染按钮）

- [ ] **Step 3: 实现 inline 模式**

把 `RichTextControl` 的签名与返回改为：

```tsx
export default function RichTextControl({
  label,
  value,
  onChange,
  inline = false,
}: {
  label: string
  value: unknown
  onChange: (value: unknown) => void
  inline?: boolean
}) {
  const [open, setOpen] = useState(false)

  if (inline) {
    return (
      <div className="ed-ctl rt-control rt-inline">
        <span>{label}</span>
        <Editor value={value} onChange={onChange} />
      </div>
    )
  }

  // …原有弹窗实现保持不变
}
```

在 `cms/src/components/admin/ArticleBodyField.tsx` 的 `<RichTextControl … />` 上补一个 `inline`：

```tsx
      <RichTextControl
        inline
        label={label}
        value={value}
        onChange={(next) => setValue(next)}
      />
```

- [ ] **Step 4: 运行确认通过**

Run: `cd cms && npx vitest run src/editor/__tests__/rich-text-inline.test.tsx`
Expected: PASS（2 tests）

- [ ] **Step 5: 提交**

```bash
git add cms/src/editor/RichTextControl.tsx cms/src/components/admin/ArticleBodyField.tsx cms/src/editor/__tests__/rich-text-inline.test.tsx
git commit -m "feat(articles): edit body inline instead of in a modal"
```

---

### Task 4: URL 前缀字段与 1:1 封面字段

**Files:**
- Create: `cms/src/components/admin/SlugField.tsx`
- Create: `cms/src/components/admin/ArticleCoverField.tsx`
- Test: `cms/src/components/admin/__tests__/slugField.test.tsx`
- Test: `cms/src/components/admin/__tests__/articleCoverField.test.tsx`
- Modify: `cms/src/collections/Cases.ts`（`slug` 与 `cover` 字段的 `admin.components.Field`）

**Interfaces:**
- Consumes: `MediaModal`（`cms/src/editor/MediaModal.tsx`，props：`title`、`onClose`、`onSelect(item)`）
- Produces:
  - `slugPrefix(categorySlug?: string | null): string` — `study-case` → `/blog/study-case/`；空值 → `/blog/`
  - 默认导出组件 `SlugField`、`ArticleCoverField`

- [ ] **Step 1: 写失败测试**

Create `cms/src/components/admin/__tests__/slugField.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SlugField, { slugPrefix } from '../SlugField'

vi.mock('@payloadcms/ui', () => ({
  useField: () => ({ value: 'xiaocao', setValue: () => {} }),
  useFormFields: (selector: any) =>
    selector([{ category: { value: { id: 1, slug: 'study-case' } } }, () => {}]),
}))

describe('SlugField', () => {
  it('builds the URL prefix from the category slug', () => {
    expect(slugPrefix('study-case')).toBe('/blog/study-case/')
    expect(slugPrefix()).toBe('/blog/')
    expect(slugPrefix(null)).toBe('/blog/')
  })

  it('shows the prefix and the editable alias', () => {
    render(<SlugField path="slug" field={{ label: 'URL 别名' }} />)
    expect(screen.getByText('/blog/study-case/')).toBeTruthy()
    expect((screen.getByDisplayValue('xiaocao') as HTMLInputElement).value).toBe('xiaocao')
  })
})
```

Create `cms/src/components/admin/__tests__/articleCoverField.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ArticleCoverField from '../ArticleCoverField'

vi.mock('@payloadcms/ui', () => ({
  useField: () => ({ value: null, setValue: () => {} }),
  useFormFields: (selector: any) => selector([{ title: { value: '小曹同学的赴美之旅' } }, () => {}]),
}))

describe('ArticleCoverField', () => {
  it('renders a square cover preview with the article title', () => {
    render(<ArticleCoverField path="cover" field={{ label: '封面图' }} />)
    const cover = document.querySelector('.acf-cover')
    expect(cover).toBeTruthy()
    expect(cover?.textContent).toContain('小曹同学的赴美之旅')
  })

  it('does not offer removing a required cover', () => {
    render(<ArticleCoverField path="cover" field={{ label: '封面图' }} />)
    expect(screen.queryByText('移除')).toBeNull()
    expect(screen.getAllByText('更换').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `cd cms && npx vitest run src/components/admin/__tests__/slugField.test.tsx src/components/admin/__tests__/articleCoverField.test.tsx`
Expected: FAIL，模块不存在

- [ ] **Step 3: 实现 SlugField**

Create `cms/src/components/admin/SlugField.tsx`:

```tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

export function slugPrefix(categorySlug?: string | null): string {
  return categorySlug ? `/blog/${categorySlug}/` : '/blog/'
}

export default function SlugField({ path, field }: { path: string; field: any }) {
  const { value, setValue } = useField<string | null>({ path })
  const category = useFormFields(([fields]) => (fields?.category?.value ?? null) as any)
  const [categorySlug, setCategorySlug] = useState('')

  useEffect(() => {
    const id = category && typeof category === 'object' ? category.id : category
    if (!id) { setCategorySlug(''); return }
    if (category && typeof category === 'object' && category.slug) {
      setCategorySlug(String(category.slug))
      return
    }
    let cancelled = false
    fetch(`/api/case-categories/${encodeURIComponent(String(id))}?depth=0`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc) => { if (!cancelled) setCategorySlug(doc?.slug || '') })
      .catch(() => { if (!cancelled) setCategorySlug('') })
    return () => { cancelled = true }
  }, [category])

  const label = typeof field?.label === 'string' ? field.label : 'URL 别名'

  return (
    <div className="field-type slug-field">
      <label className="field-label">{label}</label>
      <div className="slug-field__row">
        <span className="slug-field__prefix">{slugPrefix(categorySlug)}</span>
        <input
          className="slug-field__input"
          value={value ?? ''}
          onChange={(event) => setValue(event.target.value)}
          placeholder="xiaocao"
        />
      </div>
      <div className="field-description">只能使用小写字母、数字和连字符；发布后修改会自动生成旧链接跳转。</div>
    </div>
  )
}
```

- [ ] **Step 4: 实现 ArticleCoverField**

Create `cms/src/components/admin/ArticleCoverField.tsx`:

```tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'
import MediaModal from '../../editor/MediaModal'
import type { MediaItem } from '../../editor/api'

function relationId(value: unknown): number | string | undefined {
  if (value == null) return undefined
  if (typeof value === 'object') return (value as { id?: number | string }).id
  return value as number | string
}

export default function ArticleCoverField({ path, field }: { path: string; field: any }) {
  const { value, setValue } = useField<number | string | null>({ path })
  const title = useFormFields(([fields]) => String(fields?.title?.value || ''))
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const id = relationId(value)

  useEffect(() => {
    let cancelled = false
    if (id == null) { setUrl(''); return }
    if (value && typeof value === 'object' && (value as any).url) { setUrl(String((value as any).url)); return }
    fetch(`/api/media/${encodeURIComponent(String(id))}?depth=0`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc) => { if (!cancelled) setUrl(doc?.url || '') })
      .catch(() => { if (!cancelled) setUrl('') })
    return () => { cancelled = true }
  }, [id, value])

  const label = typeof field?.label === 'string' ? field.label : '封面图'

  return (
    <div className="field-type article-cover-field">
      <label className="field-label">{label}</label>
      <div className="acf-cover" style={url ? { backgroundImage: `url('${url}')` } : undefined}>
        <div className="acf-caption">{title || '未命名文章'}</div>
        <div className="acf-actions">
          <button type="button" onClick={() => setOpen(true)}>更换</button>
        </div>
      </div>
      <div className="field-description">列表卡片按 1:1 裁切；详情页头图会整幅裁切。</div>
      {open ? (
        <MediaModal
          title="选择封面图"
          onClose={() => setOpen(false)}
          onSelect={(item: MediaItem) => {
            setValue(item.id)
            setUrl(item.url || '')
            setOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
```

- [ ] **Step 5: 接入 Cases 字段**

在 `cms/src/collections/Cases.ts`：

`slug` 字段的 `admin` 改为：

```ts
      admin: { components: { Field: '/components/admin/SlugField' } },
```

`cover` 字段的 `admin` 改为：

```ts
      admin: { position: 'sidebar', components: { Field: '/components/admin/ArticleCoverField' } },
```

- [ ] **Step 6: 运行确认通过**

Run: `cd cms && npx vitest run src/components/admin/__tests__`
Expected: PASS（现有 AdminPageHeader 测试 + 新增 4 tests）

- [ ] **Step 7: 提交**

```bash
git add cms/src/components/admin/SlugField.tsx cms/src/components/admin/ArticleCoverField.tsx cms/src/components/admin/__tests__ cms/src/collections/Cases.ts
git commit -m "feat(articles): add cover preview and prefixed slug fields"
```

---

### Task 5: 文章编辑页两栏布局与视觉

**Files:**
- Modify: `cms/src/components/admin/admin-theme.css`（文件末尾追加）

**Interfaces:**
- Consumes: `.collection-edit--cases`、`.document-fields__sidebar-wrap`（Payload DOM，已在本地用 Playwright 确认）

- [ ] **Step 1: 追加样式**

在 `cms/src/components/admin/admin-theme.css` 末尾追加：

```css
/* 文章编辑页：左写作 / 右属性 */
html.admin-shell:has(.collection-edit--cases) .doc-header { display: none !important; }

.collection-edit--cases .collection-edit__form { background: var(--zc-bg); }

.collection-edit--cases .doc-controls {
  position: sticky; top: 0; z-index: 30;
  margin: 0; padding: 10px 28px;
  background: #fff; border-bottom: 1px solid var(--zc-border);
}
.collection-edit--cases .doc-controls__wrapper { align-items: center; }
.collection-edit--cases .doc-controls__meta { font-size: 12px; color: var(--zc-muted); }

.collection-edit--cases .document-fields { align-items: stretch; }
.collection-edit--cases .document-fields__main { padding: 26px 32px 40px; }
.collection-edit--cases .document-fields__edit { max-width: 860px; }
.collection-edit--cases .document-fields__sidebar-wrap {
  width: 300px; background: #faf7f9; border-left: 1px solid var(--zc-border);
}
.collection-edit--cases .document-fields__sidebar { padding: 22px 20px; }

.collection-edit--cases #field-title input {
  font-size: 28px; font-weight: 700; line-height: 1.25;
  border: 0; border-bottom: 1px solid transparent; border-radius: 0;
  padding: 6px 0; background: transparent; box-shadow: none;
}
.collection-edit--cases #field-title input:focus {
  border-bottom-color: var(--zc-primary); outline: none; box-shadow: none;
}
.collection-edit--cases #field-title .field-label { display: none; }

.collection-edit--cases .slug-field__row {
  display: flex; align-items: center; gap: 0;
  border: 1px solid #cbb9c1; border-radius: 6px; background: #fff; overflow: hidden;
}
.collection-edit--cases .slug-field__prefix {
  padding: 8px 10px; background: #f7f0f4; color: var(--zc-soft);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px;
  border-right: 1px solid var(--zc-border); white-space: nowrap;
}
.collection-edit--cases .slug-field__input {
  flex: 1; border: 0; padding: 8px 10px; font: inherit; font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: transparent;
}
.collection-edit--cases .slug-field__input:focus { outline: none; }

.collection-edit--cases .article-cover-field .acf-cover {
  position: relative; width: 100%; aspect-ratio: 1 / 1;
  border-radius: 8px; overflow: hidden;
  background: #e7dbe1 center/cover no-repeat;
}
.collection-edit--cases .acf-caption {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 8px 10px;
  font-size: 12px; font-weight: 600; color: #fff; line-height: 1.4;
  background: rgba(138, 14, 75, .55); backdrop-filter: blur(2px);
}
.collection-edit--cases .acf-actions {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(35, 20, 28, .45); opacity: 0; transition: opacity .15s;
}
.collection-edit--cases .acf-cover:hover .acf-actions { opacity: 1; }
.collection-edit--cases .acf-actions button {
  border: 0; border-radius: 6px; padding: 6px 12px; font-size: 12px;
  background: rgba(255, 255, 255, .95); color: #5a4a52; cursor: pointer;
}

.collection-edit--cases .article-body-field .rt-content { min-height: 420px; }
.collection-edit--cases .article-body-field .rt-shell { margin-top: 6px; }

@media (max-width: 1100px) {
  .collection-edit--cases .document-fields { display: block; }
  .collection-edit--cases .document-fields__sidebar-wrap {
    width: auto; border-left: 0; border-top: 1px solid var(--zc-border);
  }
  .collection-edit--cases .article-cover-field .acf-cover { max-width: 320px; }
}
```

- [ ] **Step 2: 用浏览器核对**

先刷新页面：`http://127.0.0.1:3001/admin/collections/cases/1`

用 Playwright 执行并确认以下每一条都为 `true`：

```js
() => {
  const q = (s) => document.querySelector(s)
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p)
  const box = q('.article-cover-field .acf-cover')?.getBoundingClientRect()
  return {
    headerHidden: !q('.doc-header') || cs(q('.doc-header'), 'display') === 'none',
    controlsSticky: cs(q('.doc-controls'), 'position') === 'sticky',
    sidebarWidth: q('.document-fields__sidebar-wrap')?.getBoundingClientRect().width,
    titleFontSize: cs(q('#field-title input'), 'font-size'),
    coverSquare: box ? Math.abs(box.width - box.height) < 2 : false,
    bodyInline: !!q('.article-body-field .rt-content'),
    noModalTrigger: !q('.article-body-field .rt-open'),
    noPublishedField: !q('#field-publishedAt'),
  }
}
```

Expected: `headerHidden`、`controlsSticky`、`coverSquare`、`bodyInline`、`noModalTrigger`、`noPublishedField` 为 `true`；`sidebarWidth` 约 `300`；`titleFontSize` 为 `28px`。

- [ ] **Step 3: 窄屏核对**

把视口设为 1000×900，确认属性栏落到正文下方：

```js
() => Math.abs(
  document.querySelector('.document-fields__sidebar-wrap').getBoundingClientRect().top -
  document.querySelector('.document-fields__main').getBoundingClientRect().bottom
) < 2
```

Expected: `true`

- [ ] **Step 4: 提交**

```bash
git add cms/src/components/admin/admin-theme.css
git commit -m "feat(articles): two-column article edit layout"
```

---

### Task 6: 端到端验收与回归

**Files:**
- Modify: `cms/src/payload-types.ts`（如 Task 2 后仍有类型差异）
- 无新增源码

- [ ] **Step 1: 全量测试与类型**

Run: `cd cms && npm test`
Expected: 全部通过（≥221 tests）

Run: `cd cms && npx tsc --noEmit`
Expected: 无输出

- [ ] **Step 2: 新建文章验证发布日期**

在 `/admin/collections/cases/create` 填标题、URL、分类、正文、封面后保存草稿，然后：

```js
() => fetch('/api/cases?limit=1&sort=-createdAt&depth=0')
  .then((r) => r.json())
  .then((d) => d.docs[0]?.publishedAt)
```

Expected: 返回形如 `2026-11-06T00:00:00.000Z` 的值，且与当天北京日期一致。

- [ ] **Step 3: 列表倒序验证**

打开 `http://127.0.0.1:3001/admin/collections/cases`，确认「发布日期」列可见并显示 `YYYY/MM/DD HH:mm:ss`，新文章在第一行。

- [ ] **Step 4: 正文保存回归**

在文章 1 的正文末尾追加一行文字，点「发布修改」，再打开 `http://127.0.0.1:3001/preview/cases/1`，确认新文字出现且原内容未重复。

- [ ] **Step 5: 时间显示回归**

打开 `http://127.0.0.1:3001/admin/collections/pages`，确认「更新时间」列是 `YYYY/MM/DD HH:mm:ss` 且为北京时间；打开文章编辑页，确认顶部「最后修改时间 / 已创建」同格式。

- [ ] **Step 6: 提交（如类型有变化）**

```bash
git add cms/src/payload-types.ts
git commit -m "chore(articles): regenerate payload types"
```

无变化则跳过本步。

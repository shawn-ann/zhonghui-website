# E1 预览地基 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为可视化编辑器打地基——Pages 启用原生 Drafts、同构渲染入口、动态预览路由，使"草稿页可被动态预览"。

**Architecture:** Pages 用 Payload 原生 Drafts（`_status`）；生成器只取已发布。新增 `renderDocument(page, assets)` 作为同构整页组装入口（可外部引用资源或内联资源）。新增受保护的 Next 路由 `/preview/pages/[id]`，用草稿数据 + 同构渲染产出完整 HTML（内联 CSS/JS）。画布编辑器（E2）与发布联动（E3）将复用这些能力。

**Tech Stack:** Payload 3.90.2、Next 16、TypeScript、Vitest 4。

**前置：** P1/P2 已交付；`cms/src/render/*`、`cms/src/generate/*`、`cms/src/collections/Pages.ts` 存在；`npm test` 绿（57）。
**设计依据：** `docs/superpowers/specs/2026-10-16-visual-editor-design.md`。
**工作目录：** 相对 `cms/`。

---

## 文件结构（本计划涉及）

```
cms/src/
├─ collections/Pages.ts            # 启用 drafts，去掉手动 status
├─ render/
│  ├─ document.ts                  # 新增：整页组装（external/inline 资源）
│  ├─ layout.ts                    # renderPage 保留（或改为调用 document.ts）
│  └─ index.ts                     # 新增：浏览器安全的渲染入口 barrel
├─ generate/loadSiteData.ts        # 查询改 _status；导出 resolveMedia
└─ app/(frontend)/preview/pages/[id]/route.ts   # 新增：受保护预览路由
```

---

## Task 1: Pages 启用原生 Drafts

**Files:**
- Modify: `src/collections/Pages.ts`
- Modify: `src/payload-types.ts`（由 generate:types 生成）

- [ ] **Step 1: 改写 `src/collections/Pages.ts`**

移除手动 `status` 字段，启用 `versions.drafts`：
```ts
import type { CollectionConfig } from 'payload'
import { pageBlocks } from '../blocks'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: '页面', plural: '页面' },
  versions: { drafts: true },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'route', '_status'] },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'route',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: '以 / 开头，如 /about/' },
      validate: (val: unknown) =>
        typeof val === 'string' && val.startsWith('/') ? true : 'route 必须以 / 开头',
    },
    { name: 'blocks', type: 'blocks', blocks: pageBlocks },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ],
    },
  ],
}
```

- [ ] **Step 2: 重新生成类型**

Run: `npm run generate:types`
Expected: `src/payload-types.ts` 更新，`Page` 含 `_status`，不再有 `status`。

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 可能因 `loadSiteData` 仍引用 `status` 报错 —— 记录之，Task 2 修复。若报错来自 Pages 的 `status` 引用则先改完 Task 2。

- [ ] **Step 4: 提交**

```bash
git add src/collections/Pages.ts src/payload-types.ts
git commit -m "feat(cms): enable native drafts on Pages"
```

---

## Task 2: 生成器改用 `_status`

**Files:**
- Modify: `src/generate/loadSiteData.ts`
- Modify: `src/generate/__tests__/loadSiteData.test.ts`

- [ ] **Step 1: 改 `loadSiteData` 查询**

把查询条件由 `status` 改为 `_status`，并**导出** `resolveMedia` 供预览路由复用：
```ts
export function resolveMedia(m: unknown): string {
  if (m && typeof m === 'object' && 'url' in (m as any)) return String((m as any).url || '')
  return ''
}

export async function loadSiteData(payload: { find: (args: any) => Promise<{ docs: any[] }> }): Promise<SiteData> {
  const res = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    limit: 1000,
    depth: 1,
  })
  return { pages: res.docs.map((d) => mapPageDoc(d, resolveMedia)) }
}
```
（删除函数内原有的本地 `resolveMedia` 定义，改用导出的那个。）

- [ ] **Step 2: 更新测试**

在 `src/generate/__tests__/loadSiteData.test.ts` 中，把 `loadSiteData` 的断言改为验证传入了 `_status`：
```ts
describe('loadSiteData', () => {
  it('queries published pages via _status', async () => {
    let captured: any
    const payload = {
      find: async (args: any) => {
        captured = args
        return { docs: [{ title: '首页', route: '/', _status: 'published', blocks: [{ blockType: 'text', body: 'home' }] }] }
      },
    }
    const data = await loadSiteData(payload as any)
    expect(captured.where).toEqual({ _status: { equals: 'published' } })
    expect(data.pages[0].route).toBe('/')
  })
})
```

- [ ] **Step 3: 运行**

Run: `npm test && npx tsc --noEmit`
Expected: 全绿；tsc exit 0。

- [ ] **Step 4: 提交**

```bash
git add src/generate/loadSiteData.ts src/generate/__tests__/loadSiteData.test.ts
git commit -m "feat(generate): filter published via _status; export resolveMedia"
```

---

## Task 3: 验证草稿不参与生成

**Files:**
- 临时脚本（不入库）

- [ ] **Step 1: 端到端验证**

创建临时脚本 `scripts/verify-drafts.ts`（跑完删除）：
```ts
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })
await payload.delete({ collection: 'pages', where: { route: { equals: '/draft-test/' } } }).catch(() => {})
await payload.create({
  collection: 'pages',
  draft: true, // 草稿
  data: { title: '草稿测试', route: '/draft-test/', blocks: [{ blockType: 'text', body: 'draft body' }] },
})
console.log('draft created')
await payload.destroy(); process.exit(0)
```
Run:
```bash
npx tsx scripts/verify-drafts.ts
npm run generate
ls dist/draft-test/index.html 2>&1 || echo "OK: draft not generated"
```
Expected: 输出 `OK: draft not generated`（草稿页未生成）。随后把该页发布（`payload.update({ collection:'pages', id, draft:false })` 或直接删除）——本步只需确认草稿被排除。删除临时脚本。

- [ ] **Step 2: 提交（无代码变更，跳过）**

无提交。清理 `scripts/verify-drafts.ts`。

---

## Task 4: 同构整页组装 `renderDocument`

**Files:**
- Create: `src/render/document.ts`
- Create: `src/render/__tests__/document.test.ts`
- Create: `src/render/index.ts`（浏览器安全 barrel）

- [ ] **Step 1: 写失败测试 `src/render/__tests__/document.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { renderDocument } from '../document'
import type { PageDoc } from '../types'

const page: PageDoc = {
  title: '首页', route: '/',
  seo: { title: '中惠文化' },
  blocks: [{ type: 'text', body: '你好' }],
}

describe('renderDocument', () => {
  it('external mode emits asset links + scripts', () => {
    const html = renderDocument(page, { mode: 'external' })
    expect(html).toContain('/assets/style.css')
    expect(html).toContain('/assets/swiper-bundle.min.js')
    expect(html).toContain('/assets/main.js')
    expect(html).toContain('<header')
    expect(html).toContain('<footer')
    expect(html).toContain('你好')
  })
  it('inline mode inlines provided css/css and omits asset links', () => {
    const html = renderDocument(page, { mode: 'inline', css: '.x{}', swiperJs: 'SWIPER', mainJs: 'MAIN' })
    expect(html).toContain('<style>.x{}</style>')
    expect(html).not.toContain('/assets/style.css')
    expect(html).toContain('<script>SWIPER</script>')
    expect(html).toContain('<script>MAIN</script>')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- document`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/render/document.ts`**

```ts
import { esc } from './primitives'
import { renderBlock } from './blocks'
import { renderNav } from './nav'
import { renderFooter } from './footer'
import type { PageDoc } from './types'

export interface DocumentAssets {
  mode: 'external' | 'inline'
  css?: string
  swiperCss?: string
  swiperJs?: string
  mainJs?: string
}

function head(page: PageDoc, a: DocumentAssets): string {
  const title = page.seo?.title || page.title
  const desc = page.seo?.description || ''
  const styleTags =
    a.mode === 'inline'
      ? `${a.swiperCss ? `<style>${a.swiperCss}</style>` : ''}${a.css ? `<style>${a.css}</style>` : ''}`
      : '<link rel="stylesheet" href="/assets/swiper-bundle.min.css"><link rel="stylesheet" href="/assets/style.css">'
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  ${desc ? `<meta name="description" content="${esc(desc)}">` : ''}
  ${styleTags}
</head>`
}

function scripts(a: DocumentAssets): string {
  if (a.mode === 'inline') {
    return `${a.swiperJs ? `<script>${a.swiperJs}</script>` : ''}${a.mainJs ? `<script>${a.mainJs}</script>` : ''}`
  }
  return '<script src="/assets/swiper-bundle.min.js"></script><script src="/assets/main.js"></script>'
}

export function renderDocument(page: PageDoc, assets: DocumentAssets): string {
  const body = page.blocks.map(renderBlock).join('')
  return `${head(page, assets)}
<body>
  ${renderNav(page.route)}
  <main id="page">${body}</main>
  ${renderFooter()}
  ${scripts(assets)}
</body>
</html>`
}
```

- [ ] **Step 4: 新增 `src/render/index.ts`（浏览器安全 barrel）**

```ts
export { renderDocument } from './document'
export { renderBlock } from './blocks'
export type { PageDoc, SiteData, Block } from './types'
```

- [ ] **Step 5: 运行确认通过**

Run: `npm test -- document && npx tsc --noEmit`
Expected: PASS；tsc exit 0。

- [ ] **Step 6: 提交**

```bash
git add src/render/document.ts src/render/index.ts src/render/__tests__/document.test.ts
git commit -m "feat(render): isomorphic renderDocument (external/inline assets)"
```

---

## Task 5: 受保护的动态预览路由

**Files:**
- Create: `src/app/(frontend)/preview/pages/[id]/route.ts`

- [ ] **Step 1: 实现路由**

```ts
import { readFileSync } from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '@payload-config'
import { renderDocument } from '@/render/document'
import { mapPageDoc, resolveMedia } from '@/generate/loadSiteData'

// 运行目录为 cms/，用 cwd 定位资源，避免相对层级问题。
const read = (rel: string) => readFileSync(path.resolve(process.cwd(), rel), 'utf-8')
const CSS = read('src/render/styles/base.css')
const MAIN_JS = read('src/render/styles/main.js')
const SWIPER_CSS = read('src/static/swiper-bundle.min.css')
const SWIPER_JS = read('src/static/swiper-bundle.min.js')

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await params
  let doc: any
  try {
    doc = await payload.findByID({ collection: 'pages', id, draft: true })
  } catch {
    return new Response('Not found', { status: 404 })
  }
  if (!doc) return new Response('Not found', { status: 404 })

  const html = renderDocument(mapPageDoc(doc, resolveMedia), {
    mode: 'inline',
    css: CSS,
    mainJs: MAIN_JS,
    swiperCss: SWIPER_CSS,
    swiperJs: SWIPER_JS,
  })
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
```
> 说明：`tsconfig.json` 已配 `@/* → ./src/*` 别名，`@payload-config` 指向 `src/payload.config.ts`。资源用 `process.cwd()`（= `cms/`）定位。

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: exit 0。

- [ ] **Step 3: 手动验证**

Run: `bash scripts/start.sh dev`（等编译），然后：
```bash
# 未登录应 401
curl -s -o /dev/null -w "anon: %{http_code}\n" http://localhost:3000/preview/pages/1
```
Expected: `anon: 401`。登录态验证见 Task 6。

- [ ] **Step 4: 提交**

```bash
git add "src/app/(frontend)/preview/pages/[id]/route.ts"
git commit -m "feat(preview): authenticated dynamic preview route (draft, inline assets)"
```

---

## Task 6: 预览路由验收（登录态）

- [ ] **Step 1: 确保有草稿页**

用 `scripts` 临时脚本或后台创建一个 `route=/` 的页面（设为**草稿**或已发布均可，预览取草稿）。

- [ ] **Step 2: Playwright 登录并访问预览**

Run: `bash scripts/start.sh dev`；Playwright：
1. 打开 `http://localhost:3000/admin` 并登录（`admin@zhonghui.local` / `zhonghui1234`）。
2. 访问 `http://localhost:3000/preview/pages/1`。
Expected: 返回**完整页面**（导航/内容/页脚，样式内联正常），无控制台错误（favicon 除外）。

- [ ] **Step 3: 提交（如有微调）**

```bash
git add -A cms
git commit -m "chore(cms): e1 preview acceptance fixes"
```

---

## 覆盖对照（spec → 本计划）

| spec 章节 | 计划任务 |
|---|---|
| §2 Pages Drafts | Task 1, 2, 3 |
| §3.2 同构渲染 | Task 4 |
| §3.4 动态预览路由 | Task 5, 6 |
| §3.8 安全（预览受保护） | Task 5（auth 401） |

**范围外（后续计划）**：画布编辑器（E2）、发布按钮/端点与生成联动（E3）、画布内嵌套拖拽（二阶段）。

---

## 备注

- Payload Drafts：`find` 默认只返回已发布；预览用 `findByID({ draft: true })` 取草稿。查询显式加 `_status` 更稳。
- 同构渲染：`render/blocks`、`nav`、`footer`、`document` 均**无 Node 依赖**，可被 E2 的浏览器画布直接复用。
- 预览路由**内联**资源（CSS/JS），使其不依赖 `dist/` 的 `/assets/*`。
- 预览路由用 `@/` 别名导入源码、用 `process.cwd()` 定位 `src/` 下静态资源，避免 `(frontend)` 目录带来的相对层级问题。

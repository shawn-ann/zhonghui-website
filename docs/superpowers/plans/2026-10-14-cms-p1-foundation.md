# P1 地基 — Payload CMS + 静态生成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `cms/` 目录搭起 Payload(MySQL) 后台，含 Pages/Media/Users，并抽取共享渲染模块 + 最小静态生成器，使"一个配置好的页面"能生成静态 HTML 到 `dist/`。

**Architecture:** Payload v3（Next.js App Router + MySQL）提供后台与数据存储；一个纯 TypeScript 渲染模块 `src/render/` 把页面数据递归渲染成 HTML；一个 Node CLI 脚本读取 Payload Local API 的已发布数据，调用渲染模块，写入 `dist/`。渲染模块是纯函数、可单测，后续 P2–P5 复用。

**Tech Stack:** Node.js 20+, TypeScript, Payload CMS v3, Next.js (Payload v3 内置), `@payloadcms/db-mysql`, MySQL 8, Vitest。

**前置约定**
- 全部新代码位于仓库根目录下的 `cms/`。
- 现有 `index.html` 等静态 demo **不改动**，仅作视觉参照。
- 设计依据：`docs/superpowers/specs/2026-10-14-cms-design.md`。

---

## 文件结构（本计划涉及）

```
cms/
├─ package.json                      # 依赖与脚本（dev / build / generate / test）
├─ .env                              # DATABASE_URI / PAYLOAD_SECRET（不入库）
├─ .env.example                      # 环境变量示例
├─ payload.config.ts                 # Payload 主配置（db adapter、collections、editor）
├─ vitest.config.ts                  # Vitest 配置
├─ tsconfig.json                     # TS 配置（create-payload-app 生成）
├─ next.config.mjs                   # Next 配置（create-payload-app 生成）
├─ src/
│  ├─ app/
│  │  ├─ (payload)/admin/[[...segments]]/page.tsx   # Payload Admin（脚手架生成）
│  │  └─ (payload)/api/[...slug]/route.ts           # Payload REST（脚手架生成）
│  ├─ collections/
│  │  ├─ Users.ts                    # 管理员账号
│  │  ├─ Media.ts                    # 媒体库（uploads）
│  │  └─ Pages.ts                    # 组合页（route/blocks/seo/status）
│  ├─ blocks/
│  │  ├─ Text.ts                     # 内容组件：text
│  │  └─ Image.ts                    # 内容组件：image
│  ├─ render/
│  │  ├─ types.ts                    # Block / PageDoc / SiteData 类型
│  │  ├─ primitives.ts               # esc / bgStyle
│  │  ├─ shell.ts                    # shell()
│  │  ├─ components.ts               # 内容组件渲染器注册表
│  │  ├─ layout.ts                   # renderHead / renderNav / renderFooter / renderPage
│  │  ├─ styles/base.css             # P1 基础样式（后续由主题令牌扩展）
│  │  └─ __tests__/
│  │     ├─ primitives.test.ts
│  │     ├─ shell.test.ts
│  │     ├─ components.test.ts
│  │     └─ layout.test.ts
│  └─ generate/
│     ├─ buildSite.ts                # generateSite(data) → Map<path, html>
│     ├─ writeSite.ts                # writeSite(map, outDir)
│     ├─ route.ts                    # routeToFile()
│     ├─ loadSiteData.ts             # 从 Payload Local API 读取已发布数据
│     ├─ cli.ts                      # CLI 入口：load → build → write
│     └─ __tests__/
│        ├─ route.test.ts
│        ├─ buildSite.test.ts
│        └─ writeSite.test.ts
└─ dist/                             # 生成产物（gitignore）
```

---

## Task 1: 脚手架 + MySQL + 环境变量

**Files:**
- Create: `cms/`（整目录，由 create-payload-app 生成）
- Create: `cms/.env`, `cms/.env.example`
- Modify: `cms/payload.config.ts`（接 MySQL）

- [ ] **Step 1: 生成 Payload 项目**

Run（在仓库根目录）：
```bash
npx create-payload-app@latest cms --db mysql
```
交互选择：template = `blank`，package manager = `npm`。

- [ ] **Step 2: 配置连接串**

Create `cms/.env`：
```
DATABASE_URI=mysql://zhonghui:zhonghui_pw@127.0.0.1:3306/zhonghui_cms
PAYLOAD_SECRET=dev-secret-change-me
```
Create `cms/.env.example`：同上但值为占位（`PAYLOAD_SECRET=replace-me`）。

- [ ] **Step 3: 确认 payload.config.ts 使用 mysqlAdapter**

打开 `cms/payload.config.ts`，确认数据库适配器为：
```ts
import { mysqlAdapter } from '@payloadcms/db-mysql'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: { user: 'users' },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: mysqlAdapter({ url: process.env.DATABASE_URI || '' }),
  collections: [],
})
```

- [ ] **Step 4: 本地建库**

Run：
```bash
mysql -uroot -e "CREATE DATABASE IF NOT EXISTS zhonghui_cms CHARACTER SET utf8mb4;"
mysql -uroot -e "CREATE USER IF NOT EXISTS 'zhonghui'@'localhost' IDENTIFIED BY 'zhonghui_pw'; GRANT ALL ON zhonghui_cms.* TO 'zhonghui'@'localhost'; FLUSH PRIVILEGES;"
```
Expected：命令无错误返回。

- [ ] **Step 5: 启动并验证后台**

Run：
```bash
cd cms && npm run dev
```
Expected：控制台输出 `http://localhost:3000/admin`，浏览器打开能进入创建首个管理员账号的页面。创建账号后能登录。

- [ ] **Step 6: 提交**

```bash
git add cms
git commit -m "chore(cms): scaffold payload + mysql + env"
```

---

## Task 2: Users / Media / Pages 集合

**Files:**
- Create: `cms/src/collections/Users.ts`
- Create: `cms/src/collections/Media.ts`
- Create: `cms/src/collections/Pages.ts`
- Create: `cms/src/blocks/Text.ts`
- Create: `cms/src/blocks/Image.ts`
- Modify: `cms/payload.config.ts`

- [ ] **Step 1: Users 集合**

Create `cms/src/collections/Users.ts`：
```ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email' },
  fields: [],
}
```

- [ ] **Step 2: Media 集合**

Create `cms/src/collections/Media.ts`：
```ts
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  fields: [{ name: 'alt', type: 'text' }],
}
```
> 注意：**不包含 `image/svg+xml`**（安全约定，见设计文档第 10 节）。

- [ ] **Step 3: Text 区块定义**

Create `cms/src/blocks/Text.ts`：
```ts
import type { Block } from 'payload'

export const TextBlock: Block = {
  slug: 'text',
  labels: { singular: '文本', plural: '文本' },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'body', type: 'textarea', required: true },
    {
      name: 'align',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: '左对齐', value: 'left' },
        { label: '居中', value: 'center' },
      ],
    },
    { name: 'bg', type: 'text', admin: { description: '背景图路径/颜色/渐变，留空为白底' } },
    { name: 'alt', type: 'checkbox', label: '浅粉底', defaultValue: false },
  ],
}
```

- [ ] **Step 4: Image 区块定义**

Create `cms/src/blocks/Image.ts`：
```ts
import type { Block } from 'payload'

export const ImageBlock: Block = {
  slug: 'image',
  labels: { singular: '图片', plural: '图片' },
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    { name: 'alt', type: 'text' },
    { name: 'link', type: 'text' },
    { name: 'bg', type: 'text' },
    { name: 'alt', type: 'checkbox', label: '浅粉底', defaultValue: false },
  ],
}
```
> `alt` 字段名在本块中同时作图片替代文本——为避免与"浅粉底 alt"歧义，改名为 `altText`：
> 将上面第 2 个字段改为 `{ name: 'altText', type: 'text' }`，第 5 个保持 `name: 'alt'`。

- [ ] **Step 5: Pages 集合**

Create `cms/src/collections/Pages.ts`：
```ts
import type { CollectionConfig } from 'payload'
import { TextBlock } from '../blocks/Text'
import { ImageBlock } from '../blocks/Image'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'route', 'status'] },
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
    { name: 'blocks', type: 'blocks', blocks: [TextBlock, ImageBlock] },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' },
      ],
    },
  ],
}
```

- [ ] **Step 6: 注册到 payload.config.ts**

Modify `cms/payload.config.ts`，在顶部加导入并把 `collections` 改为：
```ts
import { Users } from './src/collections/Users'
import { Media } from './src/collections/Media'
import { Pages } from './src/collections/Pages'
// ...
  collections: [Users, Media, Pages],
```

- [ ] **Step 7: 验证**

Run：`cd cms && npm run dev`
Expected：后台侧边栏出现 Pages / Media / Users；进入 Pages 能新建页面、添加 text/image 区块并保存。

- [ ] **Step 8: 提交**

```bash
git add cms/src cms/payload.config.ts
git commit -m "feat(cms): users/media/pages collections + text/image blocks"
```

---

## Task 3: Vitest 测试环境

**Files:**
- Modify: `cms/package.json`
- Create: `cms/vitest.config.ts`

- [ ] **Step 1: 安装 Vitest**

Run：
```bash
cd cms && npm i -D vitest
```

- [ ] **Step 2: 配置 Vitest**

Create `cms/vitest.config.ts`：
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
})
```

- [ ] **Step 3: 加脚本**

Modify `cms/package.json` 的 `scripts`，添加：
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 冒烟验证**

创建临时 `cms/src/render/__tests__/smoke.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
describe('smoke', () => { it('runs', () => { expect(1 + 1).toBe(2) }) })
```
Run：`cd cms && npm test`
Expected：1 passed。然后**删除**该临时文件。

- [ ] **Step 5: 提交**

```bash
git add cms/package.json cms/package-lock.json cms/vitest.config.ts
git commit -m "chore(cms): add vitest"
```

---

## Task 4: 渲染类型 + 基础原语（esc / bgStyle）

**Files:**
- Create: `cms/src/render/types.ts`
- Create: `cms/src/render/primitives.ts`
- Test: `cms/src/render/__tests__/primitives.test.ts`

- [ ] **Step 1: 定义类型**

Create `cms/src/render/types.ts`：
```ts
export type TextBlockData = {
  type: 'text'
  title?: string
  body: string
  align?: 'left' | 'center'
  bg?: string
  alt?: boolean
}

export type ImageBlockData = {
  type: 'image'
  media: string
  altText?: string
  link?: string
  bg?: string
  alt?: boolean
}

export type Block = TextBlockData | ImageBlockData

export interface PageDoc {
  title: string
  route: string
  blocks: Block[]
  seo?: { title?: string; description?: string }
}

export interface SiteData {
  pages: PageDoc[]
}
```

- [ ] **Step 2: 写失败测试**

Create `cms/src/render/__tests__/primitives.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
import { esc, bgStyle } from '../primitives'

describe('esc', () => {
  it('escapes html-sensitive chars', () => {
    expect(esc('<a href="x">&')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;')
  })
})

describe('bgStyle', () => {
  it('returns empty for empty input', () => {
    expect(bgStyle(undefined)).toBe('')
    expect(bgStyle('')).toBe('')
  })
  it('handles gradients', () => {
    expect(bgStyle('linear-gradient(90deg,#000,#fff)'))
      .toBe('style="background:linear-gradient(90deg,#000,#fff);"')
  })
  it('handles solid colors', () => {
    expect(bgStyle('#FFF1F6')).toBe('style="background:#FFF1F6;"')
    expect(bgStyle('var(--light-blue)')).toBe('style="background:var(--light-blue);"')
  })
  it('handles image paths', () => {
    expect(bgStyle('img/bg2.jpg'))
      .toBe("style=\"background-image:url('img/bg2.jpg');background-size:cover;background-position:center;\"")
  })
})
```

- [ ] **Step 3: 运行测试确认失败**

Run：`cd cms && npm test -- primitives`
Expected：FAIL，`Cannot find module '../primitives'`。

- [ ] **Step 4: 实现 primitives**

Create `cms/src/render/primitives.ts`：
```ts
export const esc = (s: unknown): string =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

export function bgStyle(bg?: string): string {
  if (!bg) return ''
  const v = String(bg).trim()
  if (!v) return ''
  if (/^(linear-gradient|radial-gradient)/i.test(v)) return `style="background:${v};"`
  if (/^(#|var\(|rgb|hsl)/i.test(v)) return `style="background:${v};"`
  if (/\/|\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(v))
    return `style="background-image:url('${esc(v)}');background-size:cover;background-position:center;"`
  return `style="background:${v};"`
}
```

- [ ] **Step 5: 运行测试确认通过**

Run：`cd cms && npm test -- primitives`
Expected：PASS。

- [ ] **Step 6: 提交**

```bash
git add cms/src/render/types.ts cms/src/render/primitives.ts cms/src/render/__tests__/primitives.test.ts
git commit -m "feat(render): types + esc/bgStyle primitives"
```

---

## Task 5: shell 外壳

**Files:**
- Create: `cms/src/render/shell.ts`
- Test: `cms/src/render/__tests__/shell.test.ts`

- [ ] **Step 1: 写失败测试**

Create `cms/src/render/__tests__/shell.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
import { shell } from '../shell'

describe('shell', () => {
  it('wraps inner in a section', () => {
    expect(shell({}, '<p>hi</p>')).toBe('<section class="section" ><p>hi</p></section>')
  })
  it('applies alt class when no bg and alt=true', () => {
    expect(shell({ alt: true }, 'x')).toBe('<section class="section section-alt" >x</section>')
  })
  it('applies bg style and ignores alt', () => {
    expect(shell({ bg: '#FFF1F6', alt: true }, 'x'))
      .toBe('<section class="section" style="background:#FFF1F6;">x</section>')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run：`cd cms && npm test -- shell`
Expected：FAIL（模块不存在）。

- [ ] **Step 3: 实现 shell**

Create `cms/src/render/shell.ts`：
```ts
import { bgStyle } from './primitives'

export function shell(options: { bg?: string; alt?: boolean }, inner: string): string {
  const style = bgStyle(options.bg)
  const cls = ['section']
  if (!style && options.alt) cls.push('section-alt')
  return `<section class="${cls.join(' ')}" ${style}>${inner}</section>`
}
```

- [ ] **Step 4: 运行确认通过**

Run：`cd cms && npm test -- shell`
Expected：PASS。

- [ ] **Step 5: 提交**

```bash
git add cms/src/render/shell.ts cms/src/render/__tests__/shell.test.ts
git commit -m "feat(render): section shell"
```

---

## Task 6: 内容组件渲染器（text / image）

**Files:**
- Create: `cms/src/render/components.ts`
- Test: `cms/src/render/__tests__/components.test.ts`

- [ ] **Step 1: 写失败测试**

Create `cms/src/render/__tests__/components.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
import { renderBlock } from '../components'
import type { Block } from '../types'

describe('renderBlock', () => {
  it('renders text block with title and body', () => {
    const b: Block = { type: 'text', title: '标题', body: '正文', align: 'center' }
    const html = renderBlock(b)
    expect(html).toContain('<h2>标题</h2>')
    expect(html).toContain('正文')
    expect(html).toContain('text-align:center')
    expect(html).toContain('class="section"')
  })

  it('renders image block with img and link', () => {
    const b: Block = { type: 'image', media: 'img/a.jpg', altText: '图', link: '/x/' }
    const html = renderBlock(b)
    expect(html).toContain('src="img/a.jpg"')
    expect(html).toContain('alt="图"')
    expect(html).toContain('href="/x/"')
  })

  it('returns empty string for unknown type', () => {
    // @ts-expect-error 故意测试未知类型
    expect(renderBlock({ type: 'nope' })).toBe('')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run：`cd cms && npm test -- components`
Expected：FAIL（模块不存在）。

- [ ] **Step 3: 实现 components**

Create `cms/src/render/components.ts`：
```ts
import { esc } from './primitives'
import { shell } from './shell'
import type { Block, TextBlockData, ImageBlockData } from './types'

function renderText(b: TextBlockData): string {
  const align = b.align || 'left'
  const inner = `<div class="container"><div class="text-block" style="text-align:${align}">
    ${b.title ? `<h2>${esc(b.title)}</h2>` : ''}
    <p>${esc(b.body)}</p>
  </div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}

function renderImage(b: ImageBlockData): string {
  const img = `<img src="${esc(b.media)}" alt="${esc(b.altText || '')}">`
  const wrapped = b.link ? `<a href="${esc(b.link)}">${img}</a>` : img
  const inner = `<div class="container"><div class="image-block">${wrapped}</div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}

const registry: Record<string, (b: Block) => string> = {
  text: (b) => renderText(b as TextBlockData),
  image: (b) => renderImage(b as ImageBlockData),
}

export function renderBlock(block: Block): string {
  const fn = registry[block.type]
  return fn ? fn(block) : ''
}
```

- [ ] **Step 4: 运行确认通过**

Run：`cd cms && npm test -- components`
Expected：PASS。

- [ ] **Step 5: 提交**

```bash
git add cms/src/render/components.ts cms/src/render/__tests__/components.test.ts
git commit -m "feat(render): text/image block renderers"
```

---

## Task 7: 页面骨架 layout（head/nav/footer/page）

**Files:**
- Create: `cms/src/render/layout.ts`
- Create: `cms/src/render/styles/base.css`
- Test: `cms/src/render/__tests__/layout.test.ts`

- [ ] **Step 1: 写失败测试**

Create `cms/src/render/__tests__/layout.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
import { renderPage } from '../layout'
import type { PageDoc } from '../types'

const page: PageDoc = {
  title: '关于',
  route: '/about/',
  seo: { title: '关于中惠', description: '简介' },
  blocks: [{ type: 'text', body: '你好' }],
}

describe('renderPage', () => {
  it('produces a full html document', () => {
    const html = renderPage(page)
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(html).toContain('<title>关于中惠</title>')
    expect(html).toContain('assets/style.css')
    expect(html).toContain('你好')
    expect(html).toContain('</html>')
  })
  it('falls back to page title when no seo.title', () => {
    const html = renderPage({ ...page, seo: undefined })
    expect(html).toContain('<title>关于</title>')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run：`cd cms && npm test -- layout`
Expected：FAIL。

- [ ] **Step 3: 写基础样式**

Create `cms/src/render/styles/base.css`：
```css
:root {
  --deep-blue: #8A0E4B; --bright-blue: #C2185B; --light-blue: #FFF1F6;
  --gray-blue: #7C6B73; --dark-text: #5A4A52; --accent: #E60039; --border: #F0E3EA;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  color: var(--dark-text); line-height: 1.6; background: #fff; }
a { text-decoration: none; color: inherit; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.section { padding: 72px 0; }
.section-alt { background: var(--light-blue); }
.text-block h2 { font-size: 32px; color: var(--deep-blue); margin-bottom: 16px; }
.image-block img { max-width: 100%; height: auto; display: block; }
```

- [ ] **Step 4: 实现 layout**

Create `cms/src/render/layout.ts`：
```ts
import { esc } from './primitives'
import { renderBlock } from './components'
import type { PageDoc } from './types'

function renderHead(page: PageDoc): string {
  const title = page.seo?.title || page.title
  const desc = page.seo?.description || ''
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  ${desc ? `<meta name="description" content="${esc(desc)}">` : ''}
  <link rel="stylesheet" href="/assets/style.css">
</head>`
}

export function renderPage(page: PageDoc): string {
  const body = page.blocks.map(renderBlock).join('')
  return `${renderHead(page)}
<body>
  <main id="page">${body}</main>
</body>
</html>`
}
```
> 说明：导航/页脚在 P4 接入 Menu/SiteSettings；P1 只渲染 `main`。`renderHead` 用绝对路径 `/assets/style.css` 以匹配站点根部署。

- [ ] **Step 5: 运行确认通过**

Run：`cd cms && npm test -- layout`
Expected：PASS。

- [ ] **Step 6: 提交**

```bash
git add cms/src/render/layout.ts cms/src/render/styles/base.css cms/src/render/__tests__/layout.test.ts
git commit -m "feat(render): page layout + base styles"
```

---

## Task 8: 路由 → 文件路径

**Files:**
- Create: `cms/src/generate/route.ts`
- Test: `cms/src/generate/__tests__/route.test.ts`

- [ ] **Step 1: 写失败测试**

Create `cms/src/generate/__tests__/route.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
import { routeToFile } from '../route'

describe('routeToFile', () => {
  it('maps root', () => { expect(routeToFile('/')).toBe('index.html') })
  it('maps simple route', () => { expect(routeToFile('/about/')).toBe('about/index.html') })
  it('maps nested route', () => { expect(routeToFile('/cases/page/2/')).toBe('cases/page/2/index.html') })
  it('tolerates missing trailing slash', () => { expect(routeToFile('/about')).toBe('about/index.html') })
})
```

- [ ] **Step 2: 运行确认失败**

Run：`cd cms && npm test -- route`
Expected：FAIL。

- [ ] **Step 3: 实现**

Create `cms/src/generate/route.ts`：
```ts
export function routeToFile(route: string): string {
  const clean = route.trim().replace(/^\/+/, '').replace(/\/+$/, '')
  return clean === '' ? 'index.html' : `${clean}/index.html`
}
```

- [ ] **Step 4: 运行确认通过**

Run：`cd cms && npm test -- route`
Expected：PASS。

- [ ] **Step 5: 提交**

```bash
git add cms/src/generate/route.ts cms/src/generate/__tests__/route.test.ts
git commit -m "feat(generate): route -> file mapping"
```

---

## Task 9: 生成站点映射 buildSite

**Files:**
- Create: `cms/src/generate/buildSite.ts`
- Test: `cms/src/generate/__tests__/buildSite.test.ts`

- [ ] **Step 1: 写失败测试**

Create `cms/src/generate/__tests__/buildSite.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
import { generateSite } from '../buildSite'
import type { SiteData } from '../../render/types'

const data: SiteData = {
  pages: [
    { title: '首页', route: '/', blocks: [{ type: 'text', body: 'home' }] },
    { title: '关于', route: '/about/', blocks: [{ type: 'text', body: 'about' }] },
  ],
}

describe('generateSite', () => {
  it('maps each page to its html file', () => {
    const out = generateSite(data)
    expect([...out.keys()]).toContain('index.html')
    expect([...out.keys()]).toContain('about/index.html')
    expect(out.get('about/index.html')).toContain('about')
  })
  it('includes the stylesheet asset', () => {
    const out = generateSite(data)
    expect(out.get('assets/style.css')).toContain('.section')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run：`cd cms && npm test -- buildSite`
Expected：FAIL。

- [ ] **Step 3: 实现**

Create `cms/src/generate/buildSite.ts`：
```ts
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { renderPage } from '../render/layout'
import type { SiteData } from '../render/types'
import { routeToFile } from './route'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const baseCss = readFileSync(path.resolve(dirname, '../render/styles/base.css'), 'utf-8')

export function generateSite(data: SiteData): Map<string, string> {
  const out = new Map<string, string>()
  for (const page of data.pages) {
    out.set(routeToFile(page.route), renderPage(page))
  }
  out.set('assets/style.css', baseCss)
  return out
}
```

- [ ] **Step 4: 运行确认通过**

Run：`cd cms && npm test -- buildSite`
Expected：PASS。

- [ ] **Step 5: 提交**

```bash
git add cms/src/generate/buildSite.ts cms/src/generate/__tests__/buildSite.test.ts
git commit -m "feat(generate): build site file map"
```

---

## Task 10: 写入磁盘 writeSite

**Files:**
- Create: `cms/src/generate/writeSite.ts`
- Test: `cms/src/generate/__tests__/writeSite.test.ts`

- [ ] **Step 1: 写失败测试**

Create `cms/src/generate/__tests__/writeSite.test.ts`：
```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { writeSite } from '../writeSite'

let dir: string
beforeEach(() => { dir = mkdtempSync(path.join(tmpdir(), 'site-')) })
afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

describe('writeSite', () => {
  it('writes files and creates nested dirs', () => {
    const map = new Map<string, string>([
      ['index.html', '<html>home</html>'],
      ['about/index.html', '<html>about</html>'],
    ])
    writeSite(map, dir)
    expect(existsSync(path.join(dir, 'about/index.html'))).toBe(true)
    expect(readFileSync(path.join(dir, 'index.html'), 'utf-8')).toBe('<html>home</html>')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run：`cd cms && npm test -- writeSite`
Expected：FAIL。

- [ ] **Step 3: 实现**

Create `cms/src/generate/writeSite.ts`：
```ts
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'

export function writeSite(files: Map<string, string>, outDir: string): void {
  for (const [rel, content] of files) {
    const full = path.join(outDir, rel)
    mkdirSync(path.dirname(full), { recursive: true })
    writeFileSync(full, content)
  }
}
```

- [ ] **Step 4: 运行确认通过**

Run：`cd cms && npm test -- writeSite`
Expected：PASS。

- [ ] **Step 5: 提交**

```bash
git add cms/src/generate/writeSite.ts cms/src/generate/__tests__/writeSite.test.ts
git commit -m "feat(generate): write site to disk"
```

---

## Task 11: 从 Payload 读取数据 loadSiteData

**Files:**
- Create: `cms/src/generate/loadSiteData.ts`
- Test: `cms/src/generate/__tests__/loadSiteData.test.ts`

- [ ] **Step 1: 写失败测试（用假 payload 对象）**

Create `cms/src/generate/__tests__/loadSiteData.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
import { mapPageDoc, loadSiteData } from '../loadSiteData'

describe('mapPageDoc', () => {
  it('maps a payload page + blocks to PageDoc', () => {
    const raw = {
      title: '首页', route: '/', status: 'published',
      seo: { title: 'T', description: 'D' },
      blocks: [
        { blockType: 'text', title: 'a', body: 'b', align: 'center', bg: null, alt: false },
        { blockType: 'image', media: { url: '/media/x.jpg' }, altText: 'x', bg: null, alt: false },
      ],
    }
    const doc = mapPageDoc(raw as any, (m) => (typeof m === 'object' ? m.url : m))
    expect(doc.blocks[0]).toEqual({ type: 'text', title: 'a', body: 'b', align: 'center', bg: undefined, alt: false })
    expect(doc.blocks[1]).toEqual({ type: 'image', media: '/media/x.jpg', altText: 'x', link: undefined, bg: undefined, alt: false })
  })
})

describe('loadSiteData', () => {
  it('queries published pages via payload.find', async () => {
    const payload = {
      find: async () => ({
        docs: [{ title: '首页', route: '/', status: 'published', blocks: [{ blockType: 'text', body: 'home' }] }],
      }),
    }
    const data = await loadSiteData(payload as any)
    expect(data.pages[0].route).toBe('/')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run：`cd cms && npm test -- loadSiteData`
Expected：FAIL。

- [ ] **Step 3: 实现**

Create `cms/src/generate/loadSiteData.ts`：
```ts
import type { Block, PageDoc, SiteData } from '../render/types'

type MediaResolver = (media: unknown) => string

export function mapPageDoc(raw: Record<string, any>, resolveMedia: MediaResolver): PageDoc {
  const blocks: Block[] = (raw.blocks || []).map((b: Record<string, any>): Block => {
    if (b.blockType === 'text') {
      return { type: 'text', title: b.title || undefined, body: b.body, align: b.align || 'left', bg: b.bg || undefined, alt: !!b.alt }
    }
    return {
      type: 'image',
      media: resolveMedia(b.media),
      altText: b.altText || undefined,
      link: b.link || undefined,
      bg: b.bg || undefined,
      alt: !!b.alt,
    }
  })
  return {
    title: raw.title,
    route: raw.route,
    blocks,
    seo: raw.seo ? { title: raw.seo.title || undefined, description: raw.seo.description || undefined } : undefined,
  }
}

export async function loadSiteData(payload: { find: (args: any) => Promise<{ docs: any[] }> }): Promise<SiteData> {
  const res = await payload.find({
    collection: 'pages',
    where: { status: { equals: 'published' } },
    limit: 1000,
    depth: 1,
  })
  const resolveMedia = (m: unknown): string => (m && typeof m === 'object' && 'url' in (m as any) ? (m as any).url : String(m || ''))
  return { pages: res.docs.map((d) => mapPageDoc(d, resolveMedia)) }
}
```

- [ ] **Step 4: 运行确认通过**

Run：`cd cms && npm test -- loadSiteData`
Expected：PASS。

- [ ] **Step 5: 提交**

```bash
git add cms/src/generate/loadSiteData.ts cms/src/generate/__tests__/loadSiteData.test.ts
git commit -m "feat(generate): load + map payload pages"
```

---

## Task 12: CLI 入口（load → build → write）

**Files:**
- Create: `cms/src/generate/cli.ts`
- Modify: `cms/package.json`（加 `generate` 脚本）
- Modify: `cms/.gitignore`（忽略 `dist/`）

- [ ] **Step 1: 实现 CLI**

Create `cms/src/generate/cli.ts`：
```ts
import { getPayload } from 'payload'
import config from '../../payload.config'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadSiteData } from './loadSiteData'
import { generateSite } from './buildSite'
import { writeSite } from './writeSite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const payload = await getPayload({ config })
  const data = await loadSiteData(payload as any)
  const outDir = path.resolve(dirname, '../../dist')
  const files = generateSite(data)
  writeSite(files, outDir)
  console.log(`Generated ${data.pages.length} pages -> ${outDir}`)
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
```

- [ ] **Step 2: 加脚本与忽略**

Modify `cms/package.json` 的 `scripts`：
```json
"generate": "tsx src/generate/cli.ts"
```
Run（安装 tsx）：`cd cms && npm i -D tsx`

Modify `cms/.gitignore`，追加：
```
dist/
```

- [ ] **Step 3: 端到端验证**

前置：后台已发布至少一个 `route=/` 的页面（含 text 区块）。
Run：
```bash
cd cms && npm run generate
```
Expected：输出 `Generated 1 pages -> .../cms/dist`。
Run：
```bash
cat cms/dist/index.html
```
Expected：完整 HTML，含 `assets/style.css` 引用与页面内容；`cms/dist/assets/style.css` 存在。

- [ ] **Step 4: 提交**

```bash
git add cms/src/generate/cli.ts cms/package.json cms/package-lock.json cms/.gitignore
git commit -m "feat(generate): cli to build static site from payload"
```

---

## Task 13: P1 验收

- [ ] **Step 1: 全量测试**

Run：`cd cms && npm test`
Expected：全部通过。

- [ ] **Step 2: 手动验收**

Run：`cd cms && npm run dev`（另一终端 `npm run generate`）
- 在 `/admin` 新建页面 `route=/`，加 text 区块，状态设为"已发布"，保存。
- `npm run generate` 后，用静态服务器预览 `cms/dist/`：
  ```bash
  cd cms/dist && python3 -m http.server 8331 --bind 127.0.0.1
  ```
  打开 `http://127.0.0.1:8331/`，能看到页面内容与样式。
- 把状态改回"草稿"再 `generate`，该页应从 `dist/` 中消失（或在下次生成时被覆盖）。

- [ ] **Step 3: 提交（如有脚本/文档微调）**

```bash
git add -A
git commit -m "chore(cms): p1 acceptance fixes"
```

---

## 覆盖对照（spec → 本计划）

| spec 章节 | 本计划任务 |
|---|---|
| 2 技术选型（Payload+MySQL） | Task 1 |
| 4 数据模型 Pages/Media/Users | Task 2 |
| 7.1 共享渲染模块 | Task 4–7 |
| 5 组件系统（P1 最小：text/image） | Task 6 |
| 6.2 前台路由 | Task 8 |
| 7.2 发布流程（最小） | Task 9–12 |
| 9 后台界面（P1 部分） | Task 2（集合）+ 脚手架 |

**P1 不含**（留给后续计划）：grid/banner/collectionList 等完整组件（P2）、ContentTypes/Entries/Categories（P3）、Menu/Theme/SiteSettings（P4）、草稿预览/发布按钮/安全/部署（P5）。

---

## 备注

- 若 `create-payload-app` 生成的目录结构与本计划略有差异（Payload 版本差异），以**脚手架实际结构为准**，保持 `src/render`、`src/generate`、`src/collections`、`src/blocks` 的职责划分不变。
- Payload 具体 API 以官方文档为准；执行时如遇 API 变更，修正调用但**保持测试断言的对外行为不变**。

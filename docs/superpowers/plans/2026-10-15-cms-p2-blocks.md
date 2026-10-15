# P2 区块系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 P1 地基上实现完整区块库 + 嵌套渲染 + 富文本 + 静态媒体导出 + 固定模板导航/页脚，使 CMS 生成的静态页接近现有 `index.html` 首页。

**Architecture:** Payload 侧用原生嵌套 blocks 定义区块（工厂函数减重复）；生成侧把 Payload 数据映射为**递归的渲染模型**（`Block` 联合类型），由纯函数渲染器递归产出 HTML；`richtext` 在映射阶段用 Lexical 官方序列化器转成已净化的 HTML；生成时收集并复制媒体到 `dist/assets/media/` 并重写 URL；布局输出 `header + main + footer`。

**Tech Stack:** Payload 3.90.2、`@payloadcms/richtext-lexical`、Next 16、TypeScript、Vitest 4。

**前置：** P1 已交付（`cms/` 内 `src/render/*`、`src/generate/*`、`src/collections/*`、`src/blocks/{Text,Image}.ts` 均存在，`npm test` 绿）。
**设计依据：** `docs/superpowers/specs/2026-10-15-cms-p2-blocks-design.md`。
**工作目录：** 全部路径相对 `cms/`。

---

## 文件结构（本计划涉及）

```
cms/
├─ src/
│  ├─ blocks/
│  │  ├─ common.ts          # 共享字段工厂：bgField/altField/linkField/mediaField
│  │  ├─ Banner.ts          # 区块定义
│  │  ├─ Text.ts            # (已存在，改造)
│  │  ├─ Image.ts           # (已存在，改造)
│  │  ├─ ImageText.ts
│  │  ├─ Button.ts
│  │  ├─ RichText.ts
│  │  ├─ Gallery.ts
│  │  ├─ Slider.ts
│  │  ├─ Grid.ts            # makeGrid(cellBlocks) + Grid + GridInner
│  │  └─ index.ts           # contentBlocks / pageBlocks 汇总
│  ├─ collections/Pages.ts  # 使用 pageBlocks
│  ├─ render/
│  │  ├─ types.ts           # 递归 Block 联合（改造）
│  │  ├─ primitives.ts      # (已存在)
│  │  ├─ shell.ts           # (已存在)
│  │  ├─ richText.ts        # Lexical JSON -> 净化 HTML
│  │  ├─ blocks/
│  │  │  ├─ index.ts        # 注册表 + renderBlock（递归）
│  │  │  ├─ text.ts image.ts imageText.ts button.ts
│  │  │  ├─ banner.ts grid.ts gallery.ts slider.ts richText.ts
│  │  ├─ nav.ts             # 固定导航模板 + 常量
│  │  ├─ footer.ts          # 固定页脚模板 + 常量
│  │  ├─ layout.ts          # renderPage: head + nav + main + footer
│  │  └─ styles/base.css    # 移植 index.html 样式 + 新增滑块样式
│  ├─ generate/
│  │  ├─ loadSiteData.ts    # 递归映射所有区块 + media 解析 + richtext 转换
│  │  ├─ media.ts           # 收集/复制媒体 + URL 重写
│  │  ├─ buildSite.ts       # 产出页面 + CSS + JS + 媒体/静态资源
│  │  └─ cli.ts             # (已存在，基本不变)
│  └─ static/               # 站点静态资源（从 ../img 复制：logo/footbg/pattern）
├─ public/brand/*           # 后台品牌（已存在）
└─ package.json             # 脚本
```

---

## Task 1: 渲染类型改为递归 Block 联合

**Files:**
- Modify: `src/render/types.ts`
- Modify: `src/render/__tests__/primitives.test.ts`（无需改；仅确保类型不破坏）
- Modify: `src/render/blocks/README`（无）

- [ ] **Step 1: 替换 `src/render/types.ts` 为递归模型**

```ts
export interface BlockBase {
  bg?: string
  alt?: boolean
}

export interface BannerBlock extends BlockBase {
  type: 'banner'
  variant: 'split' | 'centered'
  title?: string
  sub?: string
  image?: string
  pattern?: string
}

export interface GridCell {
  components: Block[]
}

export interface GridBlock extends BlockBase {
  type: 'grid'
  columns: number
  gap?: string
  cells: GridCell[]
}

export interface TextBlock extends BlockBase {
  type: 'text'
  title?: string
  body: string
  align?: 'left' | 'center'
}

export interface ImageBlock extends BlockBase {
  type: 'image'
  media: string
  altText?: string
  link?: string
}

export interface ImageTextBlock extends BlockBase {
  type: 'imageText'
  media: string
  title?: string
  desc?: string
  link?: string
}

export interface ButtonBlock extends BlockBase {
  type: 'button'
  label: string
  link: string
  style?: 'primary' | 'outline'
}

export interface RichTextBlock extends BlockBase {
  type: 'richtext'
  html: string
}

export interface GalleryBlock extends BlockBase {
  type: 'gallery'
  images: string[]
  columns?: number
}

export interface SliderBlock extends BlockBase {
  type: 'slider'
  images: string[]
}

export type Block =
  | BannerBlock
  | GridBlock
  | TextBlock
  | ImageBlock
  | ImageTextBlock
  | ButtonBlock
  | RichTextBlock
  | GalleryBlock
  | SliderBlock

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

- [ ] **Step 2: 运行现有测试确认未破坏**

Run: `npm test`
Expected: 现有 32 用例里，`components.test.ts` 可能因 `renderBlock` 移位而失败——本任务**先不改** `components.ts`；若失败请记录并在 Task 2 修复。若全绿则更好。

- [ ] **Step 3: 提交**

```bash
git add src/render/types.ts
git commit -m "feat(render): recursive Block union"
```

---

## Task 2: 区块渲染器目录 + 迁移 text/image + 注册表

**Files:**
- Create: `src/render/blocks/text.ts`, `src/render/blocks/image.ts`, `src/render/blocks/index.ts`
- Delete: `src/render/components.ts`（逻辑迁入 blocks/index.ts）
- Modify: `src/render/__tests__/components.test.ts`（import 路径改为 `../blocks`）
- Modify: `src/render/layout.ts`（import `renderBlock` 来源改为 `./blocks`）

- [ ] **Step 1: 创建 `src/render/blocks/text.ts`**

```ts
import { esc } from '../primitives'
import { shell } from '../shell'
import type { TextBlock } from '../types'

export function renderText(b: TextBlock): string {
  const align = b.align === 'center' ? 'center' : 'left'
  const inner = `<div class="container"><div class="text-block" style="text-align:${align}">
    ${b.title ? `<h2>${esc(b.title)}</h2>` : ''}
    <p>${esc(b.body)}</p>
  </div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}
```

- [ ] **Step 2: 创建 `src/render/blocks/image.ts`**

```ts
import { esc, safeUrl } from '../primitives'
import { shell } from '../shell'
import type { ImageBlock } from '../types'

export function renderImage(b: ImageBlock): string {
  const src = safeUrl(b.media)
  const img = `<img src="${esc(src)}" alt="${esc(b.altText || '')}">`
  const href = b.link ? safeUrl(b.link) : ''
  const wrapped = href ? `<a href="${esc(href)}">${img}</a>` : img
  const inner = `<div class="container"><div class="image-block">${wrapped}</div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}
```

- [ ] **Step 3: 创建 `src/render/blocks/index.ts`（先只含 text/image）**

```ts
import type { Block } from '../types'
import { renderText } from './text'
import { renderImage } from './image'

export type Renderer = (b: Block) => string

export const renderers: Record<string, Renderer> = {
  text: (b) => renderText(b as Parameters<typeof renderText>[0]),
  image: (b) => renderImage(b as Parameters<typeof renderImage>[0]),
}

export function renderBlock(block: Block): string {
  const fn = renderers[block.type]
  return fn ? fn(block) : ''
}
```

- [ ] **Step 4: 删除旧 `src/render/components.ts`，更新引用**

删除 `src/render/components.ts`。把 `src/render/layout.ts` 的
`import { renderBlock } from './components'` 改为 `import { renderBlock } from './blocks'`。
把 `src/render/__tests__/components.test.ts` 的
`import { renderBlock } from '../components'` 改为 `import { renderBlock } from '../blocks'`。

- [ ] **Step 5: 运行测试**

Run: `npm test`
Expected: 全绿（text/image 行为不变）。

- [ ] **Step 6: 提交**

```bash
git add src/render
git commit -m "refactor(render): move text/image into blocks/ dir + registry"
```

---

## Task 3: imageText 区块渲染器

**Files:**
- Create: `src/render/blocks/imageText.ts`
- Test: `src/render/__tests__/imageText.test.ts`
- Modify: `src/render/blocks/index.ts`

- [ ] **Step 1: 写失败测试 `src/render/__tests__/imageText.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { ImageTextBlock } from '../types'

describe('imageText', () => {
  it('renders image + title + desc', () => {
    const b: ImageTextBlock = { type: 'imageText', media: '/m/a.jpg', title: '标题', desc: '描述', link: '/x/' }
    const html = renderBlock(b)
    expect(html).toContain('class="image-text"')
    expect(html).toContain('src="/m/a.jpg"')
    expect(html).toContain('<h3>标题</h3>')
    expect(html).toContain('描述')
    expect(html).toContain('href="/x/"')
  })
  it('escapes title and drops javascript link', () => {
    const b: ImageTextBlock = { type: 'imageText', media: '/m/a.jpg', title: '<b>', link: 'javascript:x' }
    const html = renderBlock(b)
    expect(html).toContain('&lt;b&gt;')
    expect(html).not.toContain('javascript:')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- imageText`
Expected: FAIL（渲染器未注册/文件不存在）。

- [ ] **Step 3: 实现 `src/render/blocks/imageText.ts`**

```ts
import { esc, safeUrl } from '../primitives'
import { shell } from '../shell'
import type { ImageTextBlock } from '../types'

export function renderImageText(b: ImageTextBlock): string {
  const src = safeUrl(b.media)
  const href = b.link ? safeUrl(b.link) : ''
  const card = `<div class="image-text">
    ${src ? `<div class="it-img"><img src="${esc(src)}" alt="${esc(b.title || '')}"></div>` : ''}
    <div class="it-body">
      ${b.title ? `<h3>${esc(b.title)}</h3>` : ''}
      ${b.desc ? `<p>${esc(b.desc)}</p>` : ''}
    </div>
  </div>`
  const wrapped = href ? `<a class="it-link" href="${esc(href)}">${card}</a>` : card
  return shell({ bg: b.bg, alt: b.alt }, `<div class="container">${wrapped}</div>`)
}
```

- [ ] **Step 4: 注册到 `src/render/blocks/index.ts`**

在 `index.ts` 顶部加 `import { renderImageText } from './imageText'`，并在 `renderers` 中加入：
```ts
  imageText: (b) => renderImageText(b as Parameters<typeof renderImageText>[0]),
```

- [ ] **Step 5: 运行确认通过**

Run: `npm test -- imageText`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add src/render/blocks/imageText.ts src/render/blocks/index.ts src/render/__tests__/imageText.test.ts
git commit -m "feat(render): imageText block"
```

---

## Task 4: button 区块渲染器

**Files:**
- Create: `src/render/blocks/button.ts`
- Test: `src/render/__tests__/button.test.ts`
- Modify: `src/render/blocks/index.ts`

- [ ] **Step 1: 写失败测试 `src/render/__tests__/button.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { ButtonBlock } from '../types'

describe('button', () => {
  it('renders a link button', () => {
    const b: ButtonBlock = { type: 'button', label: '报名', link: '/join/', style: 'primary' }
    const html = renderBlock(b)
    expect(html).toContain('href="/join/"')
    expect(html).toContain('报名')
    expect(html).toContain('btn--primary')
  })
  it('drops javascript scheme', () => {
    const b: ButtonBlock = { type: 'button', label: 'x', link: 'javascript:alert(1)' }
    expect(renderBlock(b)).not.toContain('href=')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- button`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/render/blocks/button.ts`**

```ts
import { esc, safeUrl } from '../primitives'
import { shell } from '../shell'
import type { ButtonBlock } from '../types'

export function renderButton(b: ButtonBlock): string {
  const href = safeUrl(b.link)
  const style = b.style === 'outline' ? 'outline' : 'primary'
  const btn = href
    ? `<a class="btn btn--${style}" href="${esc(href)}">${esc(b.label)}</a>`
    : `<span class="btn btn--${style}">${esc(b.label)}</span>`
  const inner = `<div class="container"><div class="button-block">${btn}</div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}
```

- [ ] **Step 4: 注册 + 运行确认通过**

在 `index.ts` 加 `import { renderButton } from './button'` 与 `button: (b) => renderButton(b as Parameters<typeof renderButton>[0]),`。
Run: `npm test -- button`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/render/blocks/button.ts src/render/blocks/index.ts src/render/__tests__/button.test.ts
git commit -m "feat(render): button block"
```

---

## Task 5: banner 区块渲染器（split / centered）

**Files:**
- Create: `src/render/blocks/banner.ts`
- Test: `src/render/__tests__/banner.test.ts`
- Modify: `src/render/blocks/index.ts`

- [ ] **Step 1: 写失败测试 `src/render/__tests__/banner.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { BannerBlock } from '../types'

describe('banner', () => {
  it('renders split layout with photo + pattern', () => {
    const b: BannerBlock = { type: 'banner', variant: 'split', title: 'T', sub: 'S', image: '/m/hero.jpg', pattern: '/m/p.svg' }
    const html = renderBlock(b)
    expect(html).toContain('banner--split')
    expect(html).toContain('banner-photo')
    expect(html).toContain('src="/m/hero.jpg"')
    expect(html).toContain('banner-pattern')
    expect(html).toContain('T')
    expect(html).toContain('S')
  })
  it('renders centered layout with bg image', () => {
    const b: BannerBlock = { type: 'banner', variant: 'centered', title: 'T', image: '/m/bg.jpg' }
    const html = renderBlock(b)
    expect(html).toContain('banner--centered')
    expect(html).toContain('/m/bg.jpg')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- banner`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/render/blocks/banner.ts`**

```ts
import { esc, safeUrl, bgStyle } from '../primitives'
import type { BannerBlock } from '../types'

function bannerShell(cls: string, style: string, inner: string): string {
  return `<section class="${cls}" ${style}>${inner}</section>`
}

export function renderBanner(b: BannerBlock): string {
  if (b.variant === 'centered') {
    const style = bgStyle(b.image) || bgStyle(b.bg)
    const inner = `<div class="container banner-cover">
      ${b.title ? `<h1>${esc(b.title)}</h1>` : ''}
      ${b.sub ? `<div class="sub">${esc(b.sub)}</div>` : ''}
    </div>`
    return bannerShell(`banner banner--centered ${b.alt ? 'section-alt' : ''}`, style, inner)
  }
  const img = safeUrl(b.image)
  const pattern = b.pattern ? safeUrl(b.pattern) : ''
  const inner = `<div class="container banner-grid">
    <div class="banner-text">
      ${b.title ? `<h1>${esc(b.title)}</h1>` : ''}
      ${b.sub ? `<p class="sub">${esc(b.sub)}</p>` : ''}
    </div>
    ${img ? `<div class="banner-media">
      ${pattern ? `<img class="banner-pattern" src="${esc(pattern)}" alt="">` : ''}
      <img class="banner-photo" src="${esc(img)}" alt="${esc(b.title || '中惠文化')}">
    </div>` : ''}
  </div>`
  return bannerShell(`banner banner--split ${b.alt ? 'section-alt' : ''}`, bgStyle(b.bg), inner)
}
```

- [ ] **Step 4: 注册 + 运行确认通过**

`index.ts` 加导入与 `banner: (b) => renderBanner(b as Parameters<typeof renderBanner>[0]),`。
Run: `npm test -- banner`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/render/blocks/banner.ts src/render/blocks/index.ts src/render/__tests__/banner.test.ts
git commit -m "feat(render): banner block (split/centered)"
```

---

## Task 6: grid 容器渲染器（递归）

**Files:**
- Create: `src/render/blocks/grid.ts`
- Test: `src/render/__tests__/grid.test.ts`
- Modify: `src/render/blocks/index.ts`

- [ ] **Step 1: 写失败测试 `src/render/__tests__/grid.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { GridBlock } from '../types'

describe('grid', () => {
  it('renders columns and child components recursively', () => {
    const b: GridBlock = {
      type: 'grid', columns: 3,
      cells: [
        { components: [{ type: 'text', body: 'A' }] },
        { components: [{ type: 'image', media: '/m/a.jpg', altText: 'a' }] },
      ],
    }
    const html = renderBlock(b)
    expect(html).toContain('grid-cols-3')
    expect(html).toContain('A')
    expect(html).toContain('src="/m/a.jpg"')
  })
  it('ignores unknown child block types', () => {
    const b: GridBlock = { type: 'grid', columns: 2, cells: [{ components: [{ type: 'nope' } as never] }] }
    expect(renderBlock(b)).toContain('grid-cols-2')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- grid`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/render/blocks/grid.ts`**

```ts
import { shell } from '../shell'
import type { GridBlock } from '../types'
import { renderBlock } from './index'

export function renderGrid(b: GridBlock): string {
  const cols = Math.min(4, Math.max(1, b.columns || 3))
  const gap = b.gap && /^(sm|md|lg)$/.test(b.gap) ? b.gap : 'md'
  const cells = (b.cells || [])
    .map((c) => `<div class="grid-cell">${(c.components || []).map(renderBlock).join('')}</div>`)
    .join('')
  const inner = `<div class="container"><div class="grid grid-cols-${cols} grid-gap-${gap}">${cells}</div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}
```

> 注意：`grid.ts` 从 `./index` 引入 `renderBlock` 会形成循环依赖。为避免，将 `renderBlock` 抽到 `src/render/blocks/renderBlock.ts`（仅做注册表分发），`index.ts` 与各渲染器都从 `renderBlock.ts` 引入。**本步实施：**
> - Create `src/render/blocks/renderBlock.ts`：
> ```ts
> import type { Block } from '../types'
> import { renderText } from './text'
> import { renderImage } from './image'
> import { renderImageText } from './imageText'
> import { renderButton } from './button'
> import { renderBanner } from './banner'
> import { renderGrid } from './grid'
> import { renderGallery } from './gallery'
> import { renderSlider } from './slider'
> import { renderRichText } from './richText'
>
> export type Renderer = (b: Block) => string
>
> export const renderers: Record<string, Renderer> = {
>   text: (b) => renderText(b as never),
>   image: (b) => renderImage(b as never),
>   imageText: (b) => renderImageText(b as never),
>   button: (b) => renderButton(b as never),
>   banner: (b) => renderBanner(b as never),
>   grid: (b) => renderGrid(b as never),
>   gallery: (b) => renderGallery(b as never),
>   slider: (b) => renderSlider(b as never),
>   richtext: (b) => renderRichText(b as never),
> }
>
> export function renderBlock(block: Block): string {
>   const fn = renderers[block.type]
>   return fn ? fn(block) : ''
> }
> ```
> - `index.ts` 改为：`export * from './renderBlock'`（保持既有 import 路径 `../blocks` 生效）。
> - `grid.ts` 从 `./renderBlock` 引入 `renderBlock`（避免循环）。
> - 注意此时 gallery/slider/richText 渲染器尚未创建——本步先**注释掉** `renderBlock.ts` 里 gallery/slider/richtext 三行，待 Task 7/8/9 再放开。为保持可运行，改为：
> ```ts
> import { renderText } from './text'
> import { renderImage } from './image'
> import { renderImageText } from './imageText'
> import { renderButton } from './button'
> import { renderBanner } from './banner'
> import { renderGrid } from './grid'
> import type { Block } from '../types'
>
> export type Renderer = (b: Block) => string
> export const renderers: Record<string, Renderer> = {
>   text: (b) => renderText(b as never),
>   image: (b) => renderImage(b as never),
>   imageText: (b) => renderImageText(b as never),
>   button: (b) => renderButton(b as never),
>   banner: (b) => renderBanner(b as never),
>   grid: (b) => renderGrid(b as never),
> }
> export function renderBlock(block: Block): string {
>   const fn = renderers[block.type]
>   return fn ? fn(block) : ''
> }
> ```
> 并在后续任务逐个补充 import 与 registry 项。

- [ ] **Step 4: 运行确认通过**

Run: `npm test`
Expected: 全绿（含 grid）。

- [ ] **Step 5: 提交**

```bash
git add src/render/blocks
git commit -m "feat(render): recursive grid container + renderBlock module"
```

---

## Task 7: gallery 区块渲染器

**Files:**
- Create: `src/render/blocks/gallery.ts`
- Test: `src/render/__tests__/gallery.test.ts`
- Modify: `src/render/blocks/renderBlock.ts`

- [ ] **Step 1: 写失败测试 `src/render/__tests__/gallery.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { GalleryBlock } from '../types'

describe('gallery', () => {
  it('renders N images with column class', () => {
    const b: GalleryBlock = { type: 'gallery', images: ['/m/1.jpg', '/m/2.jpg'], columns: 2 }
    const html = renderBlock(b)
    expect(html).toContain('gallery-cols-2')
    expect(html).toContain('src="/m/1.jpg"')
    expect(html).toContain('src="/m/2.jpg"')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- gallery`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/render/blocks/gallery.ts`**

```ts
import { esc, safeUrl } from '../primitives'
import { shell } from '../shell'
import type { GalleryBlock } from '../types'

export function renderGallery(b: GalleryBlock): string {
  const cols = Math.min(4, Math.max(1, b.columns || 3))
  const imgs = (b.images || [])
    .map((src) => safeUrl(src))
    .filter(Boolean)
    .map((src) => `<figure class="gallery-item"><img src="${esc(src)}" alt=""></figure>`)
    .join('')
  const inner = `<div class="container"><div class="gallery gallery-cols-${cols}">${imgs}</div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}
```

- [ ] **Step 4: 注册 + 运行确认通过**

在 `renderBlock.ts` 加 `import { renderGallery } from './gallery'` 与 `gallery: (b) => renderGallery(b as never),`。
Run: `npm test -- gallery`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/render/blocks/gallery.ts src/render/blocks/renderBlock.ts src/render/__tests__/gallery.test.ts
git commit -m "feat(render): gallery block"
```

---

## Task 8: slider 区块渲染器

**Files:**
- Create: `src/render/blocks/slider.ts`
- Test: `src/render/__tests__/slider.test.ts`
- Modify: `src/render/blocks/renderBlock.ts`

- [ ] **Step 1: 写失败测试 `src/render/__tests__/slider.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { SliderBlock } from '../types'

describe('slider', () => {
  it('renders swiper structure with slides', () => {
    const b: SliderBlock = { type: 'slider', images: ['/m/1.jpg', '/m/2.jpg'] }
    const html = renderBlock(b)
    expect(html).toContain('swiper memory-swiper')
    expect(html).toContain('swiper-slide')
    expect(html).toContain('src="/m/1.jpg"')
    expect(html).toContain('memory-arrow')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- slider`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/render/blocks/slider.ts`**

```ts
import { esc, safeUrl } from '../primitives'
import { bgStyle } from '../primitives'
import type { SliderBlock } from '../types'

export function renderSlider(b: SliderBlock): string {
  const slides = (b.images || [])
    .map((src) => safeUrl(src))
    .filter(Boolean)
    .map(
      (src) =>
        `<div class="swiper-slide"><div class="slide-inner"><img src="${esc(src)}" alt=""></div></div>`,
    )
    .join('')
  const inner = `<div class="container">
    <div class="swiper memory-swiper">
      <div class="swiper-wrapper">${slides}</div>
      <span class="memory-arrow prev"><svg viewBox="0 0 27 44"><path d="M22,0l4.2,4.2L8.4,22l17.8,17.8L22,44L0,22L22,0z" fill="#fff"></path></svg></span>
      <span class="memory-arrow next"><svg viewBox="0 0 27 44"><path d="M22,0l4.2,4.2L8.4,22l17.8,17.8L22,44L0,22L22,0z" transform="rotate(180 13.5 22)" fill="#fff"></path></svg></span>
    </div>
  </div>`
  return `<section class="section memory-slider ${b.alt ? 'section-alt' : ''}" ${bgStyle(b.bg)}>${inner}</section>`
}
```

- [ ] **Step 4: 注册 + 运行确认通过**

在 `renderBlock.ts` 加 `import { renderSlider } from './slider'` 与 `slider: (b) => renderSlider(b as never),`。
Run: `npm test -- slider`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/render/blocks/slider.ts src/render/blocks/renderBlock.ts src/render/__tests__/slider.test.ts
git commit -m "feat(render): slider block"
```

---

## Task 9: 富文本 Lexical→HTML 转换 + richtext 渲染器

**Files:**
- Create: `src/render/richText.ts`
- Create: `src/render/blocks/richText.ts`
- Test: `src/render/__tests__/richText.test.ts`
- Modify: `src/render/blocks/renderBlock.ts`

- [ ] **Step 1: 写失败测试 `src/render/__tests__/richText.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { RichTextBlock } from '../types'

describe('richtext renderer', () => {
  it('injects pre-converted html as-is (already sanitized upstream)', () => {
    const b: RichTextBlock = { type: 'richtext', html: '<p>你好</p><ul><li>项</li></ul>' }
    const html = renderBlock(b)
    expect(html).toContain('<p>你好</p>')
    expect(html).toContain('<ul><li>项</li></ul>')
    expect(html).toContain('richtext')
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- richText`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/render/blocks/richText.ts`**

```ts
import { shell } from '../shell'
import type { RichTextBlock } from '../types'

export function renderRichText(b: RichTextBlock): string {
  const inner = `<div class="container"><div class="richtext">${b.html || ''}</div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}
```

- [ ] **Step 4: 注册 + 运行确认通过**

`renderBlock.ts` 加 `import { renderRichText } from './richText'` 与 `richtext: (b) => renderRichText(b as never),`。
Run: `npm test -- richText`
Expected: PASS。

- [ ] **Step 5: 实现 Lexical→HTML 转换工具 `src/render/richText.ts`**

> 该工具在**映射阶段**（`loadSiteData`）使用，把 Payload 的 Lexical JSON 转成 HTML 字符串。使用官方序列化器。

```ts
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

export function lexicalToHtml(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  try {
    // convertLexicalToHTML 需要完整的 editor config；传入最小配置即可处理常见节点。
    return convertLexicalToHTML({ data: data as never })
  } catch {
    return ''
  }
}
```

> 若该签名与 3.90.2 不符（例如需要 `editorConfig`），实现者须查阅 `node_modules/@payloadcms/richtext-lexical/dist/exports/html` 的类型修正调用；**保持对外行为**：输入 Lexical JSON，输出 HTML 字符串；异常时返回空串。
> 追加测试（本步）验证转换：
```ts
import { lexicalToHtml } from '../richText'
it('lexicalToHtml returns string for empty', () => {
  expect(lexicalToHtml(undefined)).toBe('')
})
```

- [ ] **Step 6: 运行全部测试 + 类型检查**

Run: `npm test && npx tsc --noEmit`
Expected: 全绿；tsc exit 0。

- [ ] **Step 7: 提交**

```bash
git add src/render/blocks/richText.ts src/render/blocks/renderBlock.ts src/render/richText.ts src/render/__tests__/richText.test.ts
git commit -m "feat(render): richtext renderer + lexical->html converter"
```

---

## Task 10: 移植首页样式到 base.css

**Files:**
- Modify: `src/render/styles/base.css`

- [ ] **Step 1: 移植**

把仓库根 `index.html` 的 `<style>` 内容（约第 9–226 行：`:root` 令牌 + 导航 + banner + 卡片网格 + story + proj + adv + memory-slider + footer + 媒体查询）整体移植进 `src/render/styles/base.css`，并**追加**本计划新增区块所需样式：

```css
/* P2 新增区块样式 */
.grid { display: grid; gap: 28px; }
.grid-gap-sm { gap: 16px; }
.grid-gap-md { gap: 28px; }
.grid-gap-lg { gap: 40px; }
.grid-cols-1 { grid-template-columns: 1fr; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
.grid-cell { min-width: 0; }
.image-text { background:#fff; border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.image-text .it-img img { width:100%; height:100%; object-fit:cover; display:block; }
.image-text .it-body { padding: 18px 20px 22px; }
.image-text h3 { font-size: 18px; color: var(--deep-blue); }
.image-text p { font-size: 14px; color: var(--gray-blue); margin-top: 6px; }
.it-link { display:block; color: inherit; }
.btn { display:inline-block; padding:12px 28px; border-radius:8px; font-weight:600; }
.btn--primary { background: var(--accent); color:#fff; }
.btn--outline { border:2px solid var(--accent); color: var(--accent); }
.gallery { display:grid; gap:16px; }
.gallery-cols-1 { grid-template-columns: 1fr; }
.gallery-cols-2 { grid-template-columns: repeat(2,1fr); }
.gallery-cols-3 { grid-template-columns: repeat(3,1fr); }
.gallery-cols-4 { grid-template-columns: repeat(4,1fr); }
.gallery-item img { width:100%; border-radius:10px; display:block; }
.richtext { font-size:16px; color: var(--dark-text); line-height:1.9; }
.richtext h2 { font-size:28px; color: var(--deep-blue); margin:24px 0 12px; }
.richtext h3 { font-size:22px; color: var(--deep-blue); margin:20px 0 10px; }
.richtext p { margin: 12px 0; }
.richtext ul, .richtext ol { margin: 12px 0 12px 24px; }
.richtext img { max-width:100%; border-radius:10px; }
@media (max-width: 900px) {
  .grid-cols-2, .grid-cols-3, .grid-cols-4, .gallery-cols-2, .gallery-cols-3, .gallery-cols-4 { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: 验证样式随生成产出**

Run: `npm run generate`（0 页也可），确认无异常。
Expected: `dist/assets/style.css` 更新、体积增大。

- [ ] **Step 3: 提交**

```bash
git add src/render/styles/base.css
git commit -m "style(render): port index.html theme + P2 block styles"
```

---

## Task 11: 共享区块字段工厂

**Files:**
- Create: `src/blocks/common.ts`

- [ ] **Step 1: 实现 `src/blocks/common.ts`**

```ts
import type { Field } from 'payload'

export const bgField = (): Field => ({
  name: 'bg',
  type: 'text',
  admin: { description: '背景图路径/颜色/渐变，留空为白底' },
})

export const altField = (): Field => ({
  name: 'alt',
  type: 'checkbox',
  label: '浅粉底',
  defaultValue: false,
})

export const linkField = (name = 'link'): Field => ({
  name,
  type: 'text',
  admin: { description: '站内路由以 / 开头，或完整外链 https://…' },
})
```

- [ ] **Step 2: 提交（无测试，纯定义，随下一次提交合并亦可；此处单独提交）**

```bash
git add src/blocks/common.ts
git commit -m "feat(blocks): shared field factories (bg/alt/link)"
```

---

## Task 12: Payload 区块定义（全部）+ Pages 接入

**Files:**
- Create: `src/blocks/Banner.ts`, `ImageText.ts`, `Button.ts`, `RichText.ts`, `Gallery.ts`, `Slider.ts`, `Grid.ts`, `index.ts`
- Modify: `src/blocks/Text.ts`, `src/blocks/Image.ts`（用共享字段工厂）
- Modify: `src/collections/Pages.ts`（blocks 用 pageBlocks）

- [ ] **Step 1: 改造 `src/blocks/Text.ts`**

```ts
import type { Block } from 'payload'
import { bgField, altField } from './common'

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
    bgField(),
    altField(),
  ],
}
```

- [ ] **Step 2: 改造 `src/blocks/Image.ts`**

```ts
import type { Block } from 'payload'
import { bgField, altField, linkField } from './common'

export const ImageBlock: Block = {
  slug: 'image',
  labels: { singular: '图片', plural: '图片' },
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    { name: 'altText', type: 'text' },
    linkField(),
    bgField(),
    altField(),
  ],
}
```

- [ ] **Step 3: 新建 `src/blocks/Banner.ts`**

```ts
import type { Block } from 'payload'
import { bgField, altField } from './common'

export const BannerBlock: Block = {
  slug: 'banner',
  labels: { singular: '横幅', plural: '横幅' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'split',
      options: [
        { label: '左右（左文右图）', value: 'split' },
        { label: '整图（居中）', value: 'centered' },
      ],
    },
    { name: 'title', type: 'text' },
    { name: 'sub', type: 'text' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'pattern', type: 'upload', relationTo: 'media' },
    bgField(),
    altField(),
  ],
}
```

- [ ] **Step 4: 新建 `src/blocks/ImageText.ts`**

```ts
import type { Block } from 'payload'
import { bgField, altField, linkField } from './common'

export const ImageTextBlock: Block = {
  slug: 'imageText',
  labels: { singular: '图文卡片', plural: '图文卡片' },
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    { name: 'title', type: 'text' },
    { name: 'desc', type: 'textarea' },
    linkField(),
    bgField(),
    altField(),
  ],
}
```

- [ ] **Step 5: 新建 `src/blocks/Button.ts`**

```ts
import type { Block } from 'payload'
import { bgField, altField, linkField } from './common'

export const ButtonBlock: Block = {
  slug: 'button',
  labels: { singular: '按钮', plural: '按钮' },
  fields: [
    { name: 'label', type: 'text', required: true },
    linkField(),
    {
      name: 'style',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { label: '实心', value: 'primary' },
        { label: '描边', value: 'outline' },
      ],
    },
    bgField(),
    altField(),
  ],
}
```

- [ ] **Step 6: 新建 `src/blocks/RichText.ts`**

```ts
import type { Block } from 'payload'
import { bgField, altField } from './common'

export const RichTextBlock: Block = {
  slug: 'richtext',
  labels: { singular: '富文本', plural: '富文本' },
  fields: [{ name: 'content', type: 'richText' }, bgField(), altField()],
}
```

- [ ] **Step 7: 新建 `src/blocks/Gallery.ts`**

```ts
import type { Block } from 'payload'
import { bgField, altField } from './common'

export const GalleryBlock: Block = {
  slug: 'gallery',
  labels: { singular: '图集', plural: '图集' },
  fields: [
    { name: 'images', type: 'array', minRows: 1, fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }] },
    { name: 'columns', type: 'number', defaultValue: 3, min: 1, max: 4 },
    bgField(),
    altField(),
  ],
}
```

- [ ] **Step 8: 新建 `src/blocks/Slider.ts`**

```ts
import type { Block } from 'payload'
import { bgField } from './common'

export const SliderBlock: Block = {
  slug: 'slider',
  labels: { singular: '轮播', plural: '轮播' },
  fields: [
    { name: 'images', type: 'array', minRows: 1, fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }] },
    bgField(),
  ],
}
```

- [ ] **Step 9: 新建 `src/blocks/Grid.ts`（工厂 + 两层）**

```ts
import type { Block } from 'payload'
import { bgField, altField } from './common'
import { TextBlock } from './Text'
import { ImageBlock } from './Image'
import { ImageTextBlock } from './ImageText'
import { ButtonBlock } from './Button'
import { RichTextBlock } from './RichText'
import { GalleryBlock } from './Gallery'

export const contentBlocks: Block[] = [
  TextBlock,
  ImageBlock,
  ImageTextBlock,
  ButtonBlock,
  RichTextBlock,
  GalleryBlock,
]

export function makeGrid(slug: string, label: string, cellComponents: Block[]): Block {
  return {
    slug,
    labels: { singular: label, plural: label },
    fields: [
      { name: 'columns', type: 'number', defaultValue: 3, min: 1, max: 4 },
      {
        name: 'gap',
        type: 'select',
        defaultValue: 'md',
        options: [
          { label: '紧凑', value: 'sm' },
          { label: '标准', value: 'md' },
          { label: '宽松', value: 'lg' },
        ],
      },
      {
        name: 'cells',
        type: 'array',
        minRows: 1,
        fields: [{ name: 'components', type: 'blocks', blocks: cellComponents }],
      },
      bgField(),
      altField(),
    ],
  }
}

// 内层 grid：槽内只放内容组件（防无限递归）
export const GridInner = makeGrid('gridInner', '网格(内层)', contentBlocks)

// 外层 grid：槽内可放内容组件 + 一个内层 grid
export const Grid = makeGrid('grid', '网格', [...contentBlocks, GridInner])
```

- [ ] **Step 10: 新建 `src/blocks/index.ts`**

```ts
import type { Block } from 'payload'
import { BannerBlock } from './Banner'
import { TextBlock } from './Text'
import { ImageBlock } from './Image'
import { ImageTextBlock } from './ImageText'
import { ButtonBlock } from './Button'
import { RichTextBlock } from './RichText'
import { GalleryBlock } from './Gallery'
import { SliderBlock } from './Slider'
import { Grid } from './Grid'

export const pageBlocks: Block[] = [
  Grid,
  BannerBlock,
  TextBlock,
  ImageBlock,
  ImageTextBlock,
  ButtonBlock,
  RichTextBlock,
  GalleryBlock,
  SliderBlock,
]
```

- [ ] **Step 11: 接入 `src/collections/Pages.ts`**

把 `blocks` 字段改为：
```ts
import { pageBlocks } from '../blocks'
// ...
    { name: 'blocks', type: 'blocks', blocks: pageBlocks },
```
（移除对 `TextBlock/ImageBlock` 的直接 import 若不再需要。）

- [ ] **Step 12: 类型检查 + 启动验证**

Run: `npx tsc --noEmit`
Expected: exit 0。
Run: `npm run dev`，访问 `/admin/collections/pages` 新建页面，确认区块下拉含全部类型，Grid 的槽内可加子组件、可加内层 grid。然后停掉 dev。

- [ ] **Step 13: 提交**

```bash
git add src/blocks src/collections/Pages.ts
git commit -m "feat(blocks): full P2 block set + nested grid (two levels)"
```

---

## Task 13: loadSiteData 递归映射 + 媒体解析 + 富文本转换

**Files:**
- Modify: `src/generate/loadSiteData.ts`
- Modify: `src/generate/__tests__/loadSiteData.test.ts`

- [ ] **Step 1: 追加测试到 `src/generate/__tests__/loadSiteData.test.ts`**

```ts
import { mapBlock } from '../loadSiteData'

const resolve = (m: unknown) => (m && typeof m === 'object' && 'url' in (m as any) ? (m as any).url : '')

describe('mapBlock', () => {
  it('maps grid recursively with inner components', () => {
    const raw = { blockType: 'grid', columns: 2, cells: [{ components: [{ blockType: 'text', body: 'hi' }] }] }
    const b = mapBlock(raw, resolve) as any
    expect(b.type).toBe('grid')
    expect(b.cells[0].components[0].type).toBe('text')
  })
  it('maps gallery images to urls', () => {
    const raw = { blockType: 'gallery', columns: 2, images: [{ image: { url: '/media/1.jpg' } }, { image: { url: '/media/2.jpg' } }] }
    const b = mapBlock(raw, resolve) as any
    expect(b.type).toBe('gallery')
    expect(b.images).toEqual(['/media/1.jpg', '/media/2.jpg'])
  })
  it('maps richtext content to html', () => {
    const raw = { blockType: 'richtext', content: { root: { children: [] } } }
    const b = mapBlock(raw, resolve) as any
    expect(b.type).toBe('richtext')
    expect(typeof b.html).toBe('string')
  })
  it('returns null for unknown blockType', () => {
    expect(mapBlock({ blockType: 'nope' }, resolve)).toBeNull()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- loadSiteData`
Expected: FAIL（`mapBlock` 未导出）。

- [ ] **Step 3: 重写 `src/generate/loadSiteData.ts`**

```ts
import { lexicalToHtml } from '../render/richText'
import type { Block, GridCell, PageDoc, SiteData } from '../render/types'

type MediaResolver = (media: unknown) => string

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

export function mapBlock(raw: Record<string, any>, resolveMedia: MediaResolver): Block | null {
  const bg = raw.bg || undefined
  const alt = !!raw.alt
  switch (raw.blockType) {
    case 'text':
      return { type: 'text', title: raw.title || undefined, body: raw.body, align: raw.align || 'left', bg, alt }
    case 'image':
      return { type: 'image', media: resolveMedia(raw.media), altText: raw.altText || undefined, link: raw.link || undefined, bg, alt }
    case 'imageText':
      return { type: 'imageText', media: resolveMedia(raw.media), title: raw.title || undefined, desc: raw.desc || undefined, link: raw.link || undefined, bg, alt }
    case 'button':
      return { type: 'button', label: raw.label, link: raw.link || '', style: raw.style || 'primary', bg, alt }
    case 'banner':
      return {
        type: 'banner',
        variant: raw.variant || 'split',
        title: raw.title || undefined,
        sub: raw.sub || undefined,
        image: raw.image ? resolveMedia(raw.image) : undefined,
        pattern: raw.pattern ? resolveMedia(raw.pattern) : undefined,
        bg,
        alt,
      }
    case 'grid':
    case 'gridInner': {
      const cells: GridCell[] = arr<Record<string, any>>(raw.cells).map((c) => ({
        components: arr<Record<string, any>>(c.components)
          .map((child) => mapBlock(child, resolveMedia))
          .filter((x): x is Block => x !== null),
      }))
      return { type: 'grid', columns: raw.columns || 3, gap: raw.gap || 'md', cells, bg, alt }
    }
    case 'gallery':
      return {
        type: 'gallery',
        images: arr<Record<string, any>>(raw.images).map((i) => resolveMedia(i.image)).filter(Boolean),
        columns: raw.columns || 3,
        bg,
        alt,
      }
    case 'slider':
      return { type: 'slider', images: arr<Record<string, any>>(raw.images).map((i) => resolveMedia(i.image)).filter(Boolean), bg }
    case 'richtext':
      return { type: 'richtext', html: lexicalToHtml(raw.content), bg, alt }
    default:
      return null
  }
}

export function mapPageDoc(raw: Record<string, any>, resolveMedia: MediaResolver): PageDoc {
  return {
    title: raw.title,
    route: raw.route,
    blocks: arr<Record<string, any>>(raw.blocks)
      .map((b) => mapBlock(b, resolveMedia))
      .filter((x): x is Block => x !== null),
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
  const resolveMedia = (m: unknown): string => {
    if (m && typeof m === 'object' && 'url' in (m as any)) return String((m as any).url || '')
    return ''
  }
  return { pages: res.docs.map((d) => mapPageDoc(d, resolveMedia)) }
}
```

- [ ] **Step 4: 运行全部测试 + 类型检查**

Run: `npm test && npx tsc --noEmit`
Expected: 全绿；tsc exit 0。

- [ ] **Step 5: 提交**

```bash
git add src/generate/loadSiteData.ts src/generate/__tests__/loadSiteData.test.ts
git commit -m "feat(generate): recursive block mapping + media + richtext"
```

---

## Task 14: 固定导航/页脚模板 + 完整页面布局

**Files:**
- Create: `src/render/nav.ts`, `src/render/footer.ts`
- Modify: `src/render/layout.ts`
- Test: `src/render/__tests__/layout.test.ts`

- [ ] **Step 1: 实现 `src/render/nav.ts`（固定导航 + 常量）**

```ts
import { esc } from './primitives'
import { safeUrl } from './primitives'

export interface MenuItem {
  label: string
  link: string
  children?: MenuItem[]
}

// P2：固定常量；P4 换成 Menu Global 数据。
export const NAV_ITEMS: MenuItem[] = [
  { label: '首页', link: '/' },
  { label: '关于中惠', link: '/about/' },
  { label: '互惠生', link: '/aupair-usa/' },
  {
    label: '赴美J1交流项目', link: '/project-iccp/',
    children: [
      { label: 'SWT 赴美带薪实习', link: '/project-swt/' },
      { label: 'ITP 赴美专业实习', link: '/project-itp/' },
      { label: 'ICCP 赴美营地辅导员', link: '/project-iccp/' },
    ],
  },
  { label: '海外留学', link: '/study-abroad/', children: [{ label: '新西兰留学', link: '/new-zealand/' }] },
  { label: '案例分享', link: '/cases/' },
  { label: '联系我们', link: '/contact/' },
]

export const LANG_LINK = 'https://example-en.invalid/' // 对端语言站；P4 配置化
export const LOGO_SRC = '/assets/brand/logo.jpg'

function item(m: MenuItem, activeRoute: string): string {
  const href = safeUrl(m.link) || '#'
  const active = m.link === activeRoute ? ' class="active"' : ''
  const sub = m.children?.length
    ? `<div class="dropdown">${m.children
        .map((c) => `<a href="${esc(safeUrl(c.link) || '#')}">${esc(c.label)}</a>`)
        .join('')}</div>`
    : ''
  const caret = m.children?.length ? ' <span class="caret">▾</span>' : ''
  return `<li>${`<a href="${esc(href)}"${active}>${esc(m.label)}${caret}</a>`}${sub}</li>`
}

export function renderNav(activeRoute: string): string {
  const menu = NAV_ITEMS.map((m) => item(m, activeRoute)).join('')
  return `<header><div class="container nav">
    <a class="logo" href="/"><img src="${esc(LOGO_SRC)}" alt="中惠文化"></a>
    <div class="nav-right">
      <ul class="nav-menu">${menu}</ul>
      <div class="nav-lang"><a class="active" href="#">中文</a><span class="sep">|</span><a href="${esc(safeUrl(LANG_LINK) || '#')}">EN</a></div>
    </div>
  </div></header>`
}
```

- [ ] **Step 2: 实现 `src/render/footer.ts`（固定页脚）**

```ts
import { esc } from './primitives'

export const FOOTER_LOGO = '/assets/brand/footer-logo.png'

export interface FooterInfo { label: string; text: string }

export const FOOTER_INFO: FooterInfo[] = [
  { label: '📍 地址：', text: '北京东城区绿景馨园东区12号楼' },
  { label: '📞 电话：', text: '010-64159286' },
  { label: '✉ 邮箱：', text: 'info@zhonghui.com' },
  { label: '🌐 中文官网：', text: 'www.chinaaupairs.com' },
  { label: '🌐 英文官网：', text: 'www.aupaircn.com' },
]

export const FOOTER_QR = ['公众号', '咨询微信', '视频号']
export const FOOTER_COPYRIGHT = 'Copyright © 2026 中惠文化　·　京ICP备XXXXXXXX号'

export function renderFooter(): string {
  const info = FOOTER_INFO.map((i) => `<p><span class="label">${esc(i.label)}</span>${esc(i.text)}</p>`).join('')
  const qr = FOOTER_QR.map((q) => `<div class="qr-item"><div class="qr">${esc(q)}<br>二维码</div></div>`).join('')
  return `<footer><div class="footer-grid">
    <div class="footer-brand"><img src="${esc(FOOTER_LOGO)}" alt="中惠文化"></div>
    <div class="footer-info">${info}</div>
    <div class="footer-qr"><div class="qr-box">${qr}</div><a class="foot-contact" href="/contact/">联系我们</a></div>
  </div></footer>`
}
```

- [ ] **Step 3: 更新 `src/render/layout.ts`（head + nav + main + footer + 脚本）**

```ts
import { esc } from './primitives'
import { renderBlock } from './blocks'
import { renderNav } from './nav'
import { renderFooter } from './footer'
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
  <link rel="stylesheet" href="/assets/swiper-bundle.min.css">
  <link rel="stylesheet" href="/assets/style.css">
</head>`
}

export function renderPage(page: PageDoc): string {
  const body = page.blocks.map(renderBlock).join('')
  return `${renderHead(page)}
<body>
  ${renderNav(page.route)}
  <main id="page">${body}</main>
  ${renderFooter()}
  <script src="/assets/swiper-bundle.min.js"></script>
  <script src="/assets/main.js"></script>
</body>
</html>`
}
```

- [ ] **Step 4: 更新 `src/render/__tests__/layout.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { renderPage } from '../layout'
import type { PageDoc } from '../types'

const page: PageDoc = {
  title: '关于', route: '/about/',
  seo: { title: '关于中惠', description: '简介' },
  blocks: [{ type: 'text', body: '你好' }],
}

describe('renderPage', () => {
  it('produces a full html document with nav + footer', () => {
    const html = renderPage(page)
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(html).toContain('<title>关于中惠</title>')
    expect(html).toContain('assets/style.css')
    expect(html).toContain('<header')
    expect(html).toContain('<footer')
    expect(html).toContain('你好')
    expect(html).toContain('/assets/main.js')
    expect(html).toContain('</html>')
  })
  it('marks active nav item', () => {
    expect(renderPage(page)).toContain('class="active"')
  })
})
```

- [ ] **Step 5: 运行测试**

Run: `npm test`
Expected: 全绿。

- [ ] **Step 6: 提交**

```bash
git add src/render/nav.ts src/render/footer.ts src/render/layout.ts src/render/__tests__/layout.test.ts
git commit -m "feat(render): fixed nav/footer templates + full page layout"
```

---

## Task 15: 站点静态资源目录 + 媒体导出 + 生成产物

**Files:**
- Create: `src/static/`（从 `../img` 复制：`pink_logo_with_text_1.jpg`→`brand/logo.jpg`、`footLogo.png`→`brand/footer-logo.png`、`footbg.jpg`、`pattern-box-5.svg`）
- Create: `src/generate/media.ts`
- Create: `src/render/styles/main.js`（Swiper 初始化）
- Modify: `src/generate/buildSite.ts`
- Modify: `src/generate/__tests__/buildSite.test.ts`

- [ ] **Step 1: 建静态资源目录并复制（含本地化 Swiper，保证离线可用）**

Run:
```bash
cd cms && mkdir -p src/static/brand
cp ../img/pink_logo_with_text_1.jpg src/static/brand/logo.jpg
cp ../img/footLogo.png src/static/brand/footer-logo.png
cp ../img/footbg.jpg src/static/footbg.jpg
cp ../img/pattern-box-5.svg src/static/pattern-box-5.svg
npm i swiper@8
cp node_modules/swiper/swiper-bundle.min.js src/static/swiper-bundle.min.js
cp node_modules/swiper/swiper-bundle.min.css src/static/swiper-bundle.min.css
```

> 说明：把 Swiper 打包进 `src/static/`，生成时随站点一起产出，**不依赖 CDN**，满足离线可用。

- [ ] **Step 2: 创建 `src/render/styles/main.js`（Swiper 初始化）**

```js
/* 静态站点交互：Swiper 轮播 + 下拉菜单（纯静态，无框架） */
(function () {
  function initSliders() {
    if (typeof Swiper === 'undefined') return
    document.querySelectorAll('.memory-swiper').forEach(function (el) {
      new Swiper(el, {
        slidesPerView: 2,
        centeredSlides: true,
        loop: true,
        grabCursor: true,
        watchOverflow: false,
        navigation: { nextEl: '.memory-swiper .next', prevEl: '.memory-swiper .prev' },
        breakpoints: { 320: { slidesPerView: 1 }, 900: { slidesPerView: 2 } },
      })
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSliders)
  else initSliders()
})()
```

- [ ] **Step 3: 实现 `src/generate/media.ts`**

```ts
import { existsSync, mkdirSync, copyFileSync } from 'fs'
import path from 'path'
import type { Block, SiteData } from '../render/types'

const MEDIA_URL_PREFIX = '/api/media/file/'
const OUT_MEDIA_DIR = 'assets/media'

export function collectMediaUrls(data: SiteData): Set<string> {
  const set = new Set<string>()
  const walk = (blocks: Block[]) => {
    for (const b of blocks) {
      const add = (u?: string) => { if (u && u.startsWith(MEDIA_URL_PREFIX)) set.add(u) }
      switch (b.type) {
        case 'image': add(b.media); break
        case 'imageText': add(b.media); break
        case 'banner': add(b.image); add(b.pattern); break
        case 'gallery': b.images.forEach(add); break
        case 'slider': b.images.forEach(add); break
        case 'grid': b.cells.forEach((c) => walk(c.components)); break
      }
    }
  }
  data.pages.forEach((p) => walk(p.blocks))
  return set
}

export function mediaFileName(url: string): string {
  return url.slice(MEDIA_URL_PREFIX.length)
}

// 把 /api/media/file/<name> 重写为 /assets/media/<name>
export function rewriteMediaUrls(html: string): string {
  return html.split(MEDIA_URL_PREFIX).join('/' + OUT_MEDIA_DIR + '/')
}

export function copyMedia(urls: Set<string>, mediaDir: string, outDir: string): void {
  const destDir = path.join(outDir, OUT_MEDIA_DIR)
  for (const url of urls) {
    const name = mediaFileName(url)
    const from = path.join(mediaDir, name)
    if (existsSync(from)) {
      mkdirSync(destDir, { recursive: true })
      copyFileSync(from, path.join(destDir, name))
    }
  }
}
```

- [ ] **Step 4: 重写 `src/generate/buildSite.ts`**

```ts
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { renderPage } from '../render/layout'
import type { SiteData } from '../render/types'
import { routeToFile } from './route'
import { collectMediaUrls, rewriteMediaUrls } from './media'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (p: string) => readFileSync(path.resolve(dirname, p), 'utf-8')
const staticDir = path.resolve(dirname, '../static')
// 二进制静态资源以 Buffer 承载，避免编码转换损坏字节。
const readStatic = (rel: string): Buffer => readFileSync(path.join(staticDir, rel))

const baseCss = read('../render/styles/base.css')
const mainJs = read('../render/styles/main.js')

export interface BuildOptions {
  mediaDir?: string
}

export function generateSite(data: SiteData, _opts?: BuildOptions): Map<string, string | Buffer> {
  const out = new Map<string, string | Buffer>()
  for (const page of data.pages) {
    out.set(routeToFile(page.route), rewriteMediaUrls(renderPage(page)))
  }
  out.set('assets/style.css', baseCss)
  out.set('assets/main.js', mainJs)
  out.set('assets/swiper-bundle.min.css', readStatic('swiper-bundle.min.css'))
  out.set('assets/swiper-bundle.min.js', readStatic('swiper-bundle.min.js'))
  out.set('assets/brand/logo.jpg', readStatic('brand/logo.jpg'))
  out.set('assets/brand/footer-logo.png', readStatic('brand/footer-logo.png'))
  out.set('assets/footbg.jpg', readStatic('footbg.jpg'))
  out.set('assets/pattern-box-5.svg', readStatic('pattern-box-5.svg'))
  return out
}

export { collectMediaUrls, staticDir }
```

> 说明：文本（HTML/CSS/JS）为 utf-8 字符串，静态二进制资源为 `Buffer`；`writeSite` 按类型分别写入（Step 5）。媒体文件不经 `generateSite`（体积大），由 CLI 调用 `copyMedia` 复制（Step 6）。

- [ ] **Step 5: 修改 `src/generate/writeSite.ts` 支持文本与二进制**

```ts
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'

export function writeSite(files: Map<string, string | Buffer>, outDir: string): void {
  const root = path.resolve(outDir)
  for (const [rel, content] of files) {
    const full = path.resolve(path.join(outDir, rel))
    if (full !== root && !full.startsWith(root + path.sep)) {
      throw new Error(`refusing to write outside outDir: ${rel}`)
    }
    mkdirSync(path.dirname(full), { recursive: true })
    writeFileSync(full, content) // string → utf-8；Buffer → 原样字节
  }
}
```

- [ ] **Step 6: 修改 CLI 复制媒体 `src/generate/cli.ts`**

在 `writeSite(files, outDir)` 之后加：
```ts
import { collectMediaUrls, copyMedia } from './media'
// ...
  const mediaDir = path.resolve(dirname, '../media')
  copyMedia(collectMediaUrls(data), mediaDir, outDir)
```

- [ ] **Step 7: 更新 `src/generate/__tests__/buildSite.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { generateSite } from '../buildSite'
import { collectMediaUrls, rewriteMediaUrls } from '../media'
import type { SiteData } from '../../render/types'

const data: SiteData = {
  pages: [
    { title: '首页', route: '/', blocks: [{ type: 'text', body: 'home' }] },
    { title: '关于', route: '/about/', blocks: [{ type: 'text', body: 'about' }] },
  ],
}

describe('generateSite', () => {
  it('maps each page + emits assets', () => {
    const out = generateSite(data)
    expect([...out.keys()]).toContain('index.html')
    expect(out.get('about/index.html')).toContain('about')
    expect(out.get('assets/style.css')).toContain('.section')
    expect(out.get('assets/main.js')).toContain('swiper')
    expect(out.get('assets/swiper-bundle.min.js')).toContain('Swiper')
  })
  it('rewrites media urls', () => {
    expect(rewriteMediaUrls('<img src="/api/media/file/a.jpg">')).toContain('/assets/media/a.jpg')
  })
  it('collects media urls from nested blocks', () => {
    const d: SiteData = {
      pages: [{
        title: 't', route: '/', blocks: [
          { type: 'grid', columns: 1, cells: [{ components: [{ type: 'image', media: '/api/media/file/a.jpg' }] }] },
        ],
      }],
    }
    expect([...collectMediaUrls(d)]).toContain('/api/media/file/a.jpg')
  })
})
```

- [ ] **Step 8: 运行测试 + 类型检查**

Run: `npm test && npx tsc --noEmit`
Expected: 全绿；tsc exit 0。

- [ ] **Step 9: 提交**

```bash
git add src/static src/render/styles/main.js src/generate package.json package-lock.json
git commit -m "feat(generate): static assets (incl. local Swiper) + media export + url rewrite + full layout"
```

---

## Task 16: 端到端验收

- [ ] **Step 1: 全量测试**

Run: `npm test && npx tsc --noEmit`
Expected: 全绿。

- [ ] **Step 2: 搭建"首页"配置**

Run: `bash scripts/start.sh dev`，在 `/admin` 新建/编辑 `route=/` 的页面，添加区块：
- `banner`（split，标题/副标题，配图+装饰图）
- `grid`（3 列）内放若干 `imageText`（项目一览）
- `grid`（4 列）每格 `image` + `text`（中惠优势）
- `slider`（中惠印记多图）
状态设为**已发布**，保存。

- [ ] **Step 3: 生成并预览**

Run:
```bash
bash scripts/start.sh preview
```
Expected: `Generated 1 pages`；`dist/index.html` 含 `<header>` 与 `<footer>`；区块布局与现有 `index.html` 观感接近；图片来自 `dist/assets/media/`，`http://127.0.0.1:8331/` 可离线打开、轮播可切换。

- [ ] **Step 4: Playwright 佐证**

打开 `http://127.0.0.1:8331/`，截图；确认无 404 资源、无控制台报错（favicon 除外）。

- [ ] **Step 5: 提交（如有微调）**

```bash
git add -A cms
git commit -m "chore(cms): p2 acceptance fixes"
```

---

## 覆盖对照（spec → 本计划）

| spec 章节 | 计划任务 |
|---|---|
| §2 数据模型（递归 blocks、两层嵌套） | Task 1, 6, 11, 12 |
| §3 区块规格（9 个区块字段） | Task 3–9, 12 |
| §4 渲染（递归/richtext 转换/转义） | Task 1–9, 13 |
| §5 静态媒体导出 | Task 15 |
| §6 固定导航/页脚 | Task 14 |
| §7 CSS / 主题边界 | Task 10 |
| §8 测试 | 各任务 TDD + Task 16 |
| §9 验收 | Task 16 |

**范围外**：collectionList/集合（P3）、Menu/Theme/SiteSettings（P4）、草稿预览/发布/安全（P5）、>2 层嵌套。

---

## 备注

- 组件路径 `import type { Block } from 'payload'` 与渲染模型 `Block` 同名但不同源：Payload 的 `Block`（配置）在 `src/blocks/*`；渲染的 `Block`（数据）在 `src/render/types.ts`。注意按文件区分。
- 若 `@payloadcms/richtext-lexical/html` 的导出签名与 3.90.2 不符，以 `node_modules/@payloadcms/richtext-lexical/dist/exports/html` 的类型为准修正 `lexicalToHtml` 调用，保持"输入 Lexical JSON → 输出 HTML 字符串、异常返回空串"的行为，并同步其测试。
- 生成产物中，文本（HTML/CSS/JS）以 utf-8 字符串产出，二进制静态资源以 `Buffer` 产出；`writeSite` 按类型分别写入，避免编码损坏。
- 轮播库 **Swiper 本地化**到 `src/static/`（不依赖 CDN），保证生成站点可离线运行。

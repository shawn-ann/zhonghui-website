# 分栏(section)+标题(heading)+画布宽度 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 引入通用分栏结构（`section` 容器 + `heading` 标题组件），修正首页标题/图片/图案问题，并让画布按桌面宽度渲染（缩放适配 + 设备预设）。

**Architecture:** 引入**包装规则**——区块渲染器只产出内部内容；由**页面层**自动为顶层区块包 `<section>`、由 `section` 块提供容器背景。`section` 不自带嵌套（不可再套 section）。画布 iframe 按设备宽度渲染并用 `transform: scale()` 适配。

**Tech Stack:** Payload 3.90.2、Next 16、React 19、TypeScript、Vitest 4、sharp（PNG 转换）。

**前置：** P2 区块、E2 画布编辑器（分支 `feat/cms-editor`）。
**设计依据：** `docs/superpowers/specs/2026-10-16-section-heading-editor-width-design.md`。
**工作目录：** 相对 `cms/`。

---

## Task 1: 包装规则重构（区块只出内部内容）

**Files:** `src/render/blocks/*.ts`, `src/render/document.ts`, `src/render/blocks/renderBlock.ts`, 各相关测试

- [ ] **Step 1: 改造内容渲染器为"内部内容"**

`shell` 不再由内容块调用。各内容渲染器返回 `.container`（或等价）内部 HTML：
- `text.ts`：`return \`<div class="container"><div class="text-block" style="text-align:${align}">${title}<p data-field="body">…</p></div></div>\``（去掉 `shell(...)`；保留 `data-bid` 需另行处理，见 Step 4）。
- `image.ts` / `imageText.ts` / `button.ts` / `gallery.ts` / `richText.ts`：同样去掉 `shell`，只返回内部内容。
- `grid.ts`：去掉 `shell`，返回 `<div class="container"><div class="grid grid-cols-N grid-gap-X">…</div></div>`。
- `slider.ts`：去掉外层 `<section>`，返回 `<div class="container"><div class="swiper memory-swiper">…</div></div>`。
- `banner.ts`：**保留**自身 `<section class="banner ...">`（自带布局，属特例）。

- [ ] **Step 2: 新增包装函数 `src/render/blocks/wrap.ts`**

```ts
import { bgStyle } from '../primitives'
import type { Block } from '../types'
import { renderBlock } from './renderBlock'

const SELF_WRAPPED = new Set<Block['type']>(['section', 'banner'])

/** 顶层区块：section/banner 用自己的外壳，其余包一层 .section（沿用 bg/alt 语义）。 */
export function renderTop(block: Block): string {
  const inner = renderBlock(block)
  if (SELF_WRAPPED.has(block.type)) return inner
  const style = bgStyle(block.bg)
  const cls = ['section']
  if (!style && block.alt) cls.push('section-alt')
  return `<section class="${cls.join(' ')}"${block._id ? ` data-bid="${block._id}"` : ''} ${style}>${inner}</section>`
}
```

- [ ] **Step 3: `document.ts` 用 `renderTop`**

```ts
import { renderTop } from './blocks/wrap'
// renderDocument: const body = page.blocks.map(renderTop).join('')
```

- [ ] **Step 4: `data-bid` 位置调整**

`data-bid` 现由顶层包装（`renderTop`）或容器/section 提供。内容块的内部渲染不再输出 `data-bid`；`data-field` 保留（供内联改字）。更新 `shell.ts`：若无内部调用方，可移除 `shell`（保留兼容或删除）——按实现实际引用清理。

- [ ] **Step 5: 更新测试**

现有 `hooks.test.ts`/`components.test.ts`/`imageText.test.ts`/`banner.test.ts` 等对"`<section class="section">`"或 `data-bid` 的断言需更新：内容块单测改断言"内部内容"；新增 `wrap.test.ts` 断言 `renderTop` 对普通块包 `<section>`、对 `banner` 不包、`bg/alt` 生效。
Run: `npm test && npx tsc --noEmit`

- [ ] **Step 6: 提交**

```bash
git add src/render
git commit -m "refactor(render): blocks render inner content; page-level wrapper (renderTop)"
```

---

## Task 2: heading 组件

**Files:** `src/render/blocks/heading.ts`, `src/blocks/Heading.ts`, `src/render/blocks/renderBlock.ts`, `src/editor/blocks.ts`, `src/editor/map.ts`, `src/render/types.ts`, tests

- [ ] **Step 1: 类型** `src/render/types.ts` 增加：
```ts
export interface HeadingBlock extends BlockBase {
  type: 'heading'
  title: string
  subtitle?: string
  align?: 'center' | 'left'
}
```
并加入 `Block` 联合。

- [ ] **Step 2: 渲染 `src/render/blocks/heading.ts`**
```ts
import { esc } from '../primitives'
import type { HeadingBlock } from '../types'

export function renderHeading(b: HeadingBlock): string {
  const align = b.align === 'left' ? 'left' : 'center'
  return `<div class="container"><div class="section-heading" style="text-align:${align}">
    ${b.title ? `<h2>${esc(b.title)}</h2>` : ''}
    ${b.subtitle ? `<p class="subtitle">${esc(b.subtitle)}</p>` : ''}
  </div></div>`
}
```
注册到 `renderBlock.ts` 的 registry。

- [ ] **Step 3: Payload 定义 `src/blocks/Heading.ts`**
```ts
import type { Block } from 'payload'
export const HeadingBlock: Block = {
  slug: 'heading',
  labels: { singular: '标题', plural: '标题' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'subtitle', type: 'text' },
    { name: 'align', type: 'select', defaultValue: 'center', options: [{ label: '居中', value: 'center' }, { label: '左对齐', value: 'left' }] },
  ],
}
```
加入 `src/blocks/index.ts` 的 `pageBlocks` 与 `contentBlocks`（`Grid.ts`）。

- [ ] **Step 4: 编辑器元数据 `src/editor/blocks.ts`**
加 `heading` 的 `BlockMeta`（label: '标题'，fields: title(text)/subtitle(text)/align(select)），并加入 `PAGE_BLOCKS`。`Palette` 的 `THUMBS` 加一个标题缩略图。

- [ ] **Step 5: 序列化 `src/editor/map.ts`**
`editorToPayloadBlocks` 支持 `heading`（字段直通）；`docToEditorDoc` 经 `mapBlock` 已覆盖（在 `loadSiteData.mapBlock` 加 `case 'heading'`）。

- [ ] **Step 6: 测试 + 提交**
`heading.test.ts`：title/align 渲染；subtitle 为空时不渲染 `p.subtitle`。
```bash
git add src/render src/blocks src/editor
git commit -m "feat: heading component (title/subtitle/align)"
```

---

## Task 3: section 容器

**Files:** `src/render/blocks/section.ts`, `src/blocks/Section.ts`, `src/render/blocks/renderBlock.ts`, `src/editor/blocks.ts`, `src/editor/map.ts`, `src/render/types.ts`, `src/blocks/Grid.ts`, tests

- [ ] **Step 1: 类型**
```ts
export interface SectionBlock extends BlockBase {
  type: 'section'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: Block[]
}
```
加入 `Block` 联合。

- [ ] **Step 2: 渲染 `src/render/blocks/section.ts`**
```ts
import { bgStyle } from '../primitives'
import type { SectionBlock } from '../types'
import { renderBlock } from './renderBlock'

export function renderSection(b: SectionBlock): string {
  const pad = ['none', 'sm', 'md', 'lg'].includes(b.padding || '') ? b.padding : 'md'
  const style = bgStyle(b.bg)
  const isImage = !!b.bg && /\//.test(b.bg) && !/^(#|var\(|rgb|hsl|linear-gradient|radial-gradient)/i.test(b.bg)
  const cls = ['section', `sec-pad-${pad}`]
  if (isImage) cls.push('on-image')
  const inner = (b.children || []).map(renderBlock).join('')
  return `<section class="${cls.join(' ')}"${b._id ? ` data-bid="${b._id}"` : ''} ${style}>${inner}</section>`
}
```
（`renderBlock` 对子块输出内部内容；背景图时加 `on-image` 供白字规则。）

- [ ] **Step 3: Payload 定义 `src/blocks/Section.ts`（工厂，避免循环导入）**

```ts
import type { Block } from 'payload'
import { bgField } from './common'

export function makeSection(childrenBlocks: Block[]): Block {
  return {
    slug: 'section',
    labels: { singular: '分栏', plural: '分栏' },
    fields: [
      { name: 'bg', type: 'text', admin: { description: '背景图路径/颜色/渐变' } },
      {
        name: 'padding',
        type: 'select',
        defaultValue: 'md',
        options: [
          { label: '无', value: 'none' },
          { label: '小', value: 'sm' },
          { label: '中', value: 'md' },
          { label: '大', value: 'lg' },
        ],
      },
      { name: 'children', type: 'blocks', blocks: childrenBlocks },
    ],
  }
}
```
在 `src/blocks/index.ts` 组装（此时 `contentBlocks`、`Grid`、`SliderBlock` 都已定义，避免循环）：
```ts
import { makeSection } from './Section'
import { contentBlocks, Grid } from './Grid'
import { SliderBlock } from './Slider'
export const sectionChildren: Block[] = [...contentBlocks, Grid, SliderBlock]
export const SectionBlock = makeSection(sectionChildren)
export const pageBlocks: Block[] = [SectionBlock, Grid, BannerBlock, TextBlock, ImageBlock, ImageTextBlock, ButtonBlock, RichTextBlock, GalleryBlock, SliderBlock]
```
> `section.children` **不含** `section`/`banner`，防无限嵌套。`Grid` 的 `cellComponents` 也不含 `section`。

- [ ] **Step 4: 编辑器** `blocks.ts` 加 `section` meta（label '分栏'，fields: bg(bg)/padding(select)）；`PAGE_BLOCKS` 加 `section`；`Palette` 加缩略图。`map.ts`/`loadSiteData.mapBlock` 加 `case 'section'`（递归 `children`，同 grid 处理）。

- [ ] **Step 5: CSS**（见 Task 4）先加类名占位。

- [ ] **Step 6: 测试 + 提交**
`section.test.ts`：`section` 输出 `<section class="section sec-pad-md ...">`；children 递归；背景图加 `on-image`。
```bash
git commit -m "feat: section container (bg + padding + children)"
```

---

## Task 4: CSS（section padding / heading / 图片等高 / 背景图白字）

**Files:** `src/render/styles/base.css`

- [ ] **Step 1: 追加**
```css
.sec-pad-none { padding: 0; }
.sec-pad-sm { padding: 32px 0; }
.sec-pad-md { padding: 72px 0; }
.sec-pad-lg { padding: 96px 0; }
.section-heading { margin-bottom: 40px; }
.section-heading h2 { font-size: 32px; color: var(--deep-blue); font-weight: 700; }
.section-heading .subtitle { font-size: 18px; color: var(--gray-blue); margin-top: 12px; }
/* 背景图 section：标题白字 */
.on-image .section-heading h2, .on-image .section-heading .subtitle,
.on-image .text-block h2 { color: #fff; }
/* 图文卡片图片等高 */
.image-text .it-img { aspect-ratio: 4 / 3; overflow: hidden; }
.image-text .it-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
```
- [ ] **Step 2:** 生成验证 `npm run generate`（dist style.css 更新）。
- [ ] **Step 3: 提交** `style(render): section padding + heading + image ratio + on-image headings`

---

## Task 5: 画布桌面宽度 + 设备预设

**Files:** `src/editor/Canvas.tsx`, `src/editor/TopBar.tsx`, `src/editor/PageEditor.tsx`, `src/editor/editor.css`

- [ ] **Step 1: Canvas 支持设备宽度**
`Canvas` 增加 prop `deviceWidth: number`（默认 1280）。iframe 固定 `width: deviceWidth`，外层容器 `transform: scale(k)`（`k = 容器可用宽 / deviceWidth`，`transform-origin: top left`），容器高度 = `iframe.scrollHeight * k`（用 ResizeObserver/load 后测量）。
```tsx
const wrapRef = useRef<HTMLDivElement>(null)
const [scale, setScale] = useState(1)
// 测量可用宽 -> setScale(min(1, avail / deviceWidth))
// iframe style={{ width: deviceWidth, height: 800, transform: `scale(${scale})`, transformOrigin: 'top left' }}
```

- [ ] **Step 2: 设备预设**
`PageEditor` 维护 `device` 状态（`desktop|tablet|mobile` → 1280/768/390）。`TopBar` 增加三个切换按钮，调用 `onDeviceChange`。

- [ ] **Step 3: editor.css** 加 `.ed-canvas-wrap{overflow:auto}` `.ed-device` 按钮样式。

- [ ] **Step 4: 测试** `canvas.test.tsx`：切换 deviceWidth 时 iframe `width` 属性随之变化（RTL）。
- [ ] **Step 5: 提交** `feat(editor): desktop-width canvas + device presets`

---

## Task 6: 图案转 PNG 并入媒体库

**Files:** 生成 `src/static/pattern-box-5.png`；`src/generate/buildSite.ts`（如需复制）；seed 使用

- [ ] **Step 1: 转换**
用 sharp 一次性转换（临时脚本）：
```bash
cd cms && npx tsx -e "import sharp from 'sharp'; await sharp('../img/pattern-box-5.svg').png().toFile('src/static/pattern-box-5.png'); console.log('ok')"
```
生成 `src/static/pattern-box-5.png`；`buildSite.ts` 追加 `out.set('assets/pattern-box-5.png', readStatic('pattern-box-5.png'))`；提交 PNG。
- [ ] **Step 2:** seed 里将 `pattern` 上传该 PNG（见 Task 7）。
- [ ] **Step 3: 提交** `chore(cms): add pattern PNG asset`

---

## Task 7: 重建首页 seed（新结构）

**Files:** `src/../scripts/seed-home.ts`

- [ ] **Step 1:** 改 seed，用 `section > heading + grid/slider`：
```ts
blocks: [
  { blockType: 'banner', variant: 'split', title, sub, image: hero, pattern: await upPatternPng },
  { blockType: 'section', bg: '/assets/bg2.jpg', padding: 'md', children: [
    { blockType: 'heading', title: '项目一览', align: 'center' },
    { blockType: 'grid', columns: 3, gap: 'md', cells: projectItems.map(p => ({ components: [{ blockType: 'imageText', ... }] })) },
  ] },
  { blockType: 'section', bg: '#FFF1F6', padding: 'md', children: [
    { blockType: 'heading', title: '中惠优势', align: 'center' },
    { blockType: 'grid', columns: 4, gap: 'md', cells: advantages.map(a => ({ components: [{ blockType: 'text', ... }] })) },
  ] },
  { blockType: 'section', bg: '/assets/yinji-bg.jpg', padding: 'md', children: [
    { blockType: 'heading', title: '中惠印记', align: 'center' },
    { blockType: 'slider', images: mem.map(id => ({ image: id })) },
  ] },
]
```
运行 `npx tsx scripts/seed-home.ts && npm run generate`。
- [ ] **Step 2: 提交** `chore(cms): reconfigure homepage with section+heading`

---

## Task 8: 端到端验收

- [ ] **Step 1:** `npm test && npx tsc --noEmit` 全绿。
- [ ] **Step 2:** 起 dev（`bash scripts/start.sh dev`）→ 编辑器打开首页：画布为桌面宽度（不呈手机版）；组件库含"分栏/标题"。
- [ ] **Step 3:** `bash scripts/start.sh preview` 或静态服务核对 `dist/index.html`：banner 含图案、各分栏有居中标题、项目一览图片等高、背景图分栏标题白字。
- [ ] **Step 4: 提交（微调）** `chore(cms): section/heading acceptance fixes`

---

## 覆盖对照（spec → 计划）

| spec 章节 | 任务 |
|---|---|
| §3 包装规则 | Task 1 |
| §4 section | Task 3, 4 |
| §5 heading | Task 2, 4 |
| §6 渲染改动（白字/等高） | Task 1, 4 |
| §7 画布宽度/设备 | Task 5 |
| §8 图案 PNG | Task 6 |
| §9 首页重配置 | Task 7 |
| §10 测试/验收 | Task 8 |

**范围外**：中惠优势图标（P3）、集合（P3）、嵌套 section。

---

## 备注

- **包装规则**是本计划的风险点：内容块不再自带 `<section>`，改由 `renderTop` 包；务必先跑通现有渲染测试并核对生成观感无回归。
- `section`/`Grid`/`index.ts` 的组织注意**避免循环导入**：优先用工厂（`makeSection(children)`）在 `index.ts` 组装。
- 编辑器属性面板需为 `section`（bg/padding）与 `heading`（title/subtitle/align）渲染字段（通用控件已具备）。
- 画布缩放用等比 `transform: scale`，不改变真实布局（媒体查询按 1280 生效）。

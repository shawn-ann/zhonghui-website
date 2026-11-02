# 分栏四向留白 + 内容块默认无内边距 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 分栏支持上/下/左/右四向留白（数值）；横幅改为纯内容块、由外层分栏提供留白；内容组件可选内边距（默认 0）；保留轮播/标题的内在间距。

**Architecture:** `section` 渲染四向 inline padding；`banner` 输出 `div`（不再自带 section），顶层由 `renderTop` 自动包装；`SELF_WRAPPED` 仅保留 `section`；内容块可选 `padding`（写在其内容元素上）；轮播 swiper 的 24/44 与标题的 44 保持不变。

**Tech Stack:** Payload 3.90.2、React 19、TypeScript、Vitest。

**前置：** 分栏/标题/结构树/画布编辑器（分支 `feat/cms-p1`，128 tests）。
**设计依据：** `docs/superpowers/specs/2026-10-17-section-padding-design.md`。
**工作目录：** 相对 `cms/`。

---

## Task 1: 渲染模型 + 渲染器

**Files:** `src/render/types.ts`, `src/render/blocks/section.ts`, `src/render/blocks/banner.ts`, `src/render/blocks/{text,image,imageText,button,gallery,richText,heading}.ts`, `src/render/blocks/wrap.ts`

- [ ] **Step 1: 类型**
`SectionBlock`（**扁平四向字段**，与 Payload 一致）：
```ts
export interface SectionBlock extends BlockBase {
  type: 'section'
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  children: Block[]
}
```
为内容块增加 `padding?: number`：`TextBlock`、`ImageBlock`、`ImageTextBlock`、`ButtonBlock`、`GalleryBlock`、`RichTextBlock`、`HeadingBlock`。

- [ ] **Step 2: section 渲染四向 padding（扁平）**
```ts
import { esc, bgStyle } from '../primitives'
import type { SectionBlock } from '../types'
import { renderBlock } from './renderBlock'

function bgDecl(bg?: string): string {
  const s = bgStyle(bg) // style="...;" or ''
  return s ? s.slice(7, -1) : ''
}

export function renderSection(b: SectionBlock): string {
  const t = b.paddingTop ?? 72
  const r = b.paddingRight ?? 0
  const btm = b.paddingBottom ?? 72
  const l = b.paddingLeft ?? 0
  const style = `style="padding:${t}px ${r}px ${btm}px ${l}px;${bgDecl(b.bg)}"`
  const isImage = !!b.bg && /\//.test(b.bg) && !/^(#|var\(|rgb|hsl|linear-gradient|radial-gradient)/i.test(b.bg)
  const cls = ['section']
  if (isImage) cls.push('on-image')
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  const inner = (b.children || []).map(renderBlock).join('')
  return `<section class="${cls.join(' ')}"${idAttr} ${style}>${inner}</section>`
}
```
（`sec-pad-*` 类不再使用。）

- [ ] **Step 3: banner 改为 div**
`banner.ts` 的 `bannerShell` 改为：
```ts
function bannerShell(cls: string, style: string, inner: string, id?: string): string {
  const idAttr = id ? ` data-bid="${esc(id)}"` : ''
  return `<div class="${cls}"${idAttr} ${style}>${inner}</div>`
}
```
并给调用处传 `b._id`。

- [ ] **Step 4: 内容块可选 padding**
在内容元素上加内边距（仅 `padding>0` 时）。示例 `text.ts`：
```ts
const pad = b.padding && b.padding > 0 ? `;padding:${b.padding}px` : ''
const inner = `<div class="container"><div class="text-block" style="text-align:${align}${pad}">…</div></div>`
```
其余同理，作用在：`image`→`.image-block`、`imageText`→`.image-text`、`button`→`.button-block`、`gallery`→`.gallery`、`richText`→`.richtext`、`heading`→`.section-heading`。

- [ ] **Step 5: renderTop 只自包装 section**
`wrap.ts`：`const SELF_WRAPPED = new Set<string>(['section'])`（banner 不再例外）。

- [ ] **Step 6: 测试 + 提交**
- 更新 `section.test.ts`：`padding:{top:60,right:0,bottom:120,left:0}` → 输出 `style="padding:60px 0px 120px 0px;…"`；`on-image` 仍按背景图判断。
- 更新 `banner.test.ts`：断言以 `<div class="banner` 开头（不再是 `<section`）。
- 更新 `wrap.test.ts`：banner 现在会被包裹（`renderTop` 后含外层 `<section class="section"`）。
- 新增内容 padding 测试：`renderBlock({type:'text',body:'x',padding:16})` 含 `padding:16px`；无 padding 时不含。
```bash
npm test && npx tsc --noEmit
git add src/render
git commit -m "feat(render): 4-direction section padding; banner as content block; optional content padding"
```

---

## Task 2: CSS

**Files:** `src/render/styles/base.css`

- [ ] **Step 1:** 去掉 `.banner--split .banner-grid` 的 `padding: 60px 0 120px`（改 `padding: 0`）；保留 `.banner--centered` min-height、`.memory-slider .swiper{padding:24px 0 44px}`、`.section-heading{margin-bottom:44px}`。
- [ ] **Step 2:** `.sec-pad-*` 已不再使用，可保留（无副作用）或删除；本计划保留。
- [ ] **Step 3:** `npm run generate` 确认无异常；提交 `style(render): banner inner padding removed (section provides)`。

---

## Task 3: Payload 字段

**Files:** `src/blocks/common.ts`, `src/blocks/Section.ts`, `src/blocks/{Text,Image,ImageText,Button,Gallery,RichText,Heading}.ts`, `src/blocks/index.ts`

- [ ] **Step 1:** `common.ts` 增加：
```ts
export const paddingField = (): Field => ({ name: 'padding', type: 'number', defaultValue: 0, min: 0, admin: { description: '内容内边距(px)，默认0' } })
```
- [ ] **Step 2:** 各内容块（Text/Image/ImageText/Button/Gallery/RichText/Heading）在 fields 末尾加 `paddingField()`。
- [ ] **Step 3:** `Section.ts` 用四个数值字段替换原 `padding` select：
```ts
{ name: 'paddingTop', type: 'number', defaultValue: 72, min: 0 },
{ name: 'paddingRight', type: 'number', defaultValue: 0, min: 0 },
{ name: 'paddingBottom', type: 'number', defaultValue: 72, min: 0 },
{ name: 'paddingLeft', type: 'number', defaultValue: 0, min: 0 },
```
- [ ] **Step 4:** `index.ts` 的 `sectionChildren` 增加 `BannerBlock`（允许 banner 放进 section）。
- [ ] **Step 5:** `npm run generate:types`；`npx tsc --noEmit`；提交 `feat(blocks): section 4-direction padding fields; content padding; allow banner in section`。

---

## Task 4: 映射与序列化

**Files:** `src/generate/loadSiteData.ts`, `src/editor/map.ts`

- [ ] **Step 1:** `mapBlock` section（扁平四向）：
```ts
return {
  type: 'section',
  paddingTop: raw.paddingTop ?? 72,
  paddingRight: raw.paddingRight ?? 0,
  paddingBottom: raw.paddingBottom ?? 72,
  paddingLeft: raw.paddingLeft ?? 0,
  children, bg, alt,
}
```
- [ ] **Step 2:** 内容块：`padding: raw.padding || undefined`（text/image/imageText/button/gallery/richtext/heading）。
- [ ] **Step 3:** `editorToPayloadBlocks` section（扁平透传）：
```ts
{ blockType: 'section', bg,
  paddingTop: b.paddingTop ?? 72, paddingRight: b.paddingRight ?? 0,
  paddingBottom: b.paddingBottom ?? 72, paddingLeft: b.paddingLeft ?? 0,
  children: editorToPayloadBlocks(b.children || [], urlToId) }
```
内容块透传 `padding`（>0 时）。
- [ ] **Step 4:** 更新 `loadSiteData.test.ts`（section padding 四向）与 `map.test.ts`（section 四向往返）；提交 `feat(map): section 4-direction padding; content padding passthrough`。

---

## Task 5: 编辑器属性面板

**Files:** `src/editor/blocks.ts`

- [ ] **Step 1:** `section` meta fields 改为四个 number：
```ts
{ key: 'paddingTop', label: '上留白', control: 'number' },
{ key: 'paddingRight', label: '右留白', control: 'number' },
{ key: 'paddingBottom', label: '下留白', control: 'number' },
{ key: 'paddingLeft', label: '左留白', control: 'number' },
```
（渲染模型/编辑器/Payload 均用扁平四字段，无需转换。）
- [ ] **Step 2:** 内容组件 meta 增加 `{ key:'padding', label:'内边距', control:'number' }`（text/image/imageText/button/gallery/richtext/heading）。
- [ ] **Step 3:** 提交 `feat(editor): section 4-direction padding + content padding fields`。

---

## Task 6: 首页重配 + 验收

**Files:** `scripts/seed-home.ts`

- [ ] **Step 1:** seed 改为 banner 放进 section：
```ts
{ blockType: 'section', paddingTop: 60, paddingRight: 0, paddingBottom: 120, paddingLeft: 0,
  children: [ { blockType: 'banner', variant:'split', title, sub, image: hero, pattern } ] },
```
其余三个 section 用 `paddingTop:72, paddingRight:0, paddingBottom:72, paddingLeft:0`。
- [ ] **Step 2:** `npx tsx scripts/seed-home.ts && npm run generate`；确认 `dist/index.html` 含 9 张图文卡片、banner 由外层 section 包裹。
- [ ] **Step 3:** 验收（Playwright/计算样式）：
  - banner 所在 section 的 `padding-top=60px`、`padding-bottom=120px`；
  - 轮播 swiper `padding` 仍为 `24px 0 44px`；标题下间距 44；
  - 分栏左右默认 0（宽屏内容仍 1200 居中 + 24）。
- [ ] **Step 4:** `npm test && npx tsc --noEmit`；提交 `chore(cms): homepage banner wrapped in section (60/120)`。

---

## 覆盖对照（spec → 计划）

| spec 章节 | 任务 |
|---|---|
| §3 分栏四向 | Task 1,3,4,5 |
| §4 banner 纯内容 | Task 1,2,3,6 |
| §5 内在间距保留 | Task 2（不改） |
| §6 内容可选 padding | Task 1,3,5 |
| §7 数据模型 | Task 1,3,4 |
| §8 首页重配 | Task 6 |
| §9 测试/验收 | 各任务 + Task 6 |

**范围外**：内容块四向内边距（单值）、间距令牌、菜单/主题、汉化、集合。

---

## 备注

- section 的留白在 Payload、渲染模型、编辑器状态中均为**扁平四字段**（`paddingTop/Right/Bottom/Left`），无需对象转换。
- banner 由 `renderTop` 自动包装；放进 section 时由该 section 提供留白。
- 轮播 swiper 24/44 与标题 44 不在本计划调整范围。

# 海外留学项目富文本化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 保留 Page 49 的外层标题和白色卡片，把卡片内 7 个 `text` 合并成一个可编辑的 `richtext`。

**Architecture:** 新增一个纯函数把旧 `text` 块转换为 Payload Lexical `richtext` 块；种子脚本和一次性迁移脚本共用该函数。一次性脚本只定位「海外留学项目」section 下的 `stack`，目标已是 `richtext` 时跳过。

**Tech Stack:** Payload 3、TypeScript、tsx、Vitest

**Spec:** `docs/superpowers/specs/2026-11-02-study-abroad-richtext-design.md`

## Global Constraints

- 保留外层 `heading`、`section` 背景、`stack` 背景/内边距/圆角。
- 只替换目标 `stack` 的 children；不改页面标题、其他 section 或已发布产物。
- 小标题识别条件：`fontSize === 20` 且 `fontWeight === '700'`；转换为 `h3`。
- 其他 `text` 转为 `paragraph`，文字内容不改写。
- 转换脚本必须幂等：目标已是单个 `richtext` 时直接跳过。
- 不新增数据库字段或 Lexical 节点类型。

## Review Focus

- 页面 49 当前草稿可能已有用户修改：转换必须读取当前 `text` 内容，不能使用旧迁移常量。
- `stack` 中出现非 `text` 子块：脚本必须报错停止，不能静默丢弃。
- 第二次执行转换：必须 no-op，不生成重复富文本。
- 小标题样式判断：数字/字符串类型差异不能误判。
- 视觉：外层白色标题和白色卡片不能被移除或改色。

---

### Task 1: 旧 text 块转 richtext 的纯函数

**Files:**
- Create: `cms/src/generate/textBlocksToRichText.ts`
- Test: `cms/src/generate/__tests__/textBlocksToRichText.test.ts`

**Interfaces:**
- Produces: `textBlocksToRichText(blocks: TextBlockLike[]): { blockType: 'richtext'; content: LexicalRoot }`
- `TextBlockLike = { body?: unknown; fontSize?: unknown; fontWeight?: unknown }`

- [ ] **Step 1: 写失败测试**

Create `cms/src/generate/__tests__/textBlocksToRichText.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { textBlocksToRichText } from '../textBlocksToRichText'

describe('textBlocksToRichText', () => {
  it('maps subheading text to h3 and body text to paragraphs', () => {
    const block = textBlocksToRichText([
      { body: '美国留学 · 奖学金计划', fontSize: 20, fontWeight: '700' },
      { body: '第一段正文', fontSize: 15 },
      { body: '英国留学', fontSize: 20, fontWeight: 700 },
      { body: '第二段正文', fontSize: 15 },
    ])

    expect(block.blockType).toBe('richtext')
    const children = block.content.root.children
    expect(children).toHaveLength(4)
    expect(children[0]).toMatchObject({ type: 'heading', tag: 'h3', children: [{ text: '美国留学 · 奖学金计划' }] })
    expect(children[1]).toMatchObject({ type: 'paragraph', children: [{ text: '第一段正文' }] })
    expect(children[2]).toMatchObject({ type: 'heading', tag: 'h3', children: [{ text: '英国留学' }] })
    expect(children[3]).toMatchObject({ type: 'paragraph', children: [{ text: '第二段正文' }] })
  })

  it('preserves text exactly and handles missing body as empty text', () => {
    const block = textBlocksToRichText([{ fontSize: 15 }])
    expect(block.content.root.children[0]).toMatchObject({ type: 'paragraph', children: [{ text: '' }] })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/generate/__tests__/textBlocksToRichText.test.ts`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现纯函数**

Create `cms/src/generate/textBlocksToRichText.ts`:

```ts
type TextBlockLike = { body?: unknown; fontSize?: unknown; fontWeight?: unknown }

const textNode = (text: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  type: 'text',
  version: 1,
})

const paragraph = (text: string) => ({
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'paragraph',
  version: 1,
  textFormat: 0,
})

const heading = (text: string) => ({
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'heading',
  version: 1,
  tag: 'h3',
})

export function textBlocksToRichText(blocks: TextBlockLike[]) {
  const children = blocks.map((block) => {
    const text = String(block.body ?? '')
    const subheading = Number(block.fontSize) === 20 && String(block.fontWeight) === '700'
    return subheading ? heading(text) : paragraph(text)
  })

  return {
    blockType: 'richtext' as const,
    content: {
      root: {
        children,
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    },
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/generate/__tests__/textBlocksToRichText.test.ts`

Expected: PASS，2 个测试通过。

- [ ] **Step 5: 提交**

```bash
git add cms/src/generate/textBlocksToRichText.ts cms/src/generate/__tests__/textBlocksToRichText.test.ts
git commit -m "feat(generate): convert text blocks to rich text"
```

---

### Task 2: 更新海外留学种子脚本

**Files:**
- Modify: `cms/scripts/migrate-study-abroad.ts`

**Interfaces:**
- Consumes: `textBlocksToRichText` from Task 1.
- Produces: 新环境执行 `npm run migrate:study-abroad` 时，目标 `stack` 直接生成单个 `richtext`。

- [ ] **Step 1: 导入转换函数**

在 `cms/scripts/migrate-study-abroad.ts` 顶部、`payload` 初始化之前加入：

```ts
import { textBlocksToRichText } from '../src/generate/textBlocksToRichText'
```

- [ ] **Step 2: 包裹现有文本块列表**

在 `cms/scripts/migrate-study-abroad.ts` 的目标 `stack` 中（约 110-120 行），保持 7 个 `subheading(...)` / `paragraph(...)` 调用和全部中文内容完全不动，只做三处结构编辑：

1. 在 `children: [` 后新增一行 `textBlocksToRichText([`。
2. 在原来最后一个 `paragraph('加拿大，西班牙研究生，德国研究生'),` 后新增一行 `]),`。
3. 保留外层 `children` 的闭合 `],`。

结构结果必须是：

```text
children: [
  textBlocksToRichText([
    [原有 7 个 subheading/paragraph 调用保持原样]
  ]),
],
```

不要改写任何原文，也不要重新排列 7 个调用。

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`

Expected: 无错误。

- [ ] **Step 4: 静态检查生成逻辑**

Run: `grep -n "textBlocksToRichText\|stack" scripts/migrate-study-abroad.ts`

Expected: 只新增一处 `textBlocksToRichText([`；原有 7 段文本仍在其参数中。

- [ ] **Step 5: 提交**

```bash
git add cms/scripts/migrate-study-abroad.ts
git commit -m "feat(scripts): seed study abroad content as rich text"
```

---

### Task 3: 一次性转换现有 Page 49

**Files:**
- Create: `cms/scripts/migrate-study-abroad-richtext.ts`
- Modify: `cms/package.json`

**Interfaces:**
- Consumes: `textBlocksToRichText` from Task 1.
- Produces: `npm run migrate:study-abroad-richtext`，幂等更新 route `/study-abroad/` 的草稿。

- [ ] **Step 1: 新增迁移脚本**

Create `cms/scripts/migrate-study-abroad-richtext.ts`:

```ts
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { textBlocksToRichText } from '../src/generate/textBlocksToRichText'

const payload = await getPayload({ config })

const found = await payload.find({
  collection: 'pages',
  where: { route: { equals: '/study-abroad/' } },
  limit: 1,
  draft: true,
  depth: 0,
})

const page = found.docs[0] as any
if (!page) throw new Error('Page /study-abroad/ not found')

const blocks = (page.blocks || []) as any[]
const section = blocks.find((block) => {
  if (block.blockType !== 'section') return false
  return (block.children || []).some(
    (child: any) => child.blockType === 'heading' && child.title === '海外留学项目',
  )
})
if (!section) throw new Error('Section 海外留学项目 not found')

const stack = (section.children || []).find((child: any) => child.blockType === 'stack')
if (!stack) throw new Error('Stack under 海外留学项目 not found')

const children = (stack.children || []) as any[]
if (children.length === 1 && children[0].blockType === 'richtext') {
  console.log('Page 49 already uses rich text for 海外留学项目; nothing to do.')
  process.exit(0)
}
if (!children.length || children.some((child) => child.blockType !== 'text')) {
  throw new Error('Expected only text children under the 海外留学项目 stack; aborting without changes.')
}

const nextBlocks = blocks.map((block) => {
  if (block !== section) return block
  return {
    ...block,
    children: (block.children || []).map((child: any) => {
      if (child !== stack) return child
      return { ...child, children: [textBlocksToRichText(children)] }
    }),
  }
})

await payload.update({
  collection: 'pages',
  id: page.id,
  draft: true,
  data: { blocks: nextBlocks },
})

console.log(`Converted ${children.length} text blocks to rich text on page ${page.id}.`)
```

- [ ] **Step 2: 注册 npm 命令**

在 `cms/package.json` 的 `migrate:study-abroad` 后增加：

```json
"migrate:study-abroad-richtext": "tsx scripts/migrate-study-abroad-richtext.ts",
```

注意逗号位置，保持 JSON 合法。

- [ ] **Step 3: 执行一次转换**

Run: `npm run migrate:study-abroad-richtext`

Expected: 输出 `Converted 7 text blocks to rich text on page 49.`（页面 id 可能不同，以实际为准）。

- [ ] **Step 4: 再次执行确认幂等**

Run: `npm run migrate:study-abroad-richtext`

Expected: 输出 `Page 49 already uses rich text for 海外留学项目; nothing to do.`，且不写数据库。

- [ ] **Step 5: 验证页面结构**

Run:

```bash
npx tsx --eval "
import { getPayload } from 'payload';
import config from './src/payload.config';
const p = await getPayload({ config });
const r = await p.find({ collection: 'pages', where: { route: { equals: '/study-abroad/' } }, draft: true, depth: 0, limit: 1 });
const page = r.docs[0];
const section = page.blocks.find(b => b.blockType === 'section' && (b.children || []).some(c => c.blockType === 'heading' && c.title === '海外留学项目'));
const stack = section.children.find(c => c.blockType === 'stack');
const children = stack.children || [];
console.log({ sectionChildren: section.children.map(c => c.blockType), stackChildren: children.map(c => c.blockType), richTextRootChildren: children[0]?.content?.root?.children?.map(n => n.type) });
process.exit(0);
"
```

Expected: `stackChildren` 仅含 `['richtext']`；`richTextRootChildren` 的节点类型顺序为 `heading, paragraph, paragraph, heading, paragraph, heading, paragraph`（共 3 个 heading、4 个 paragraph）。

- [ ] **Step 6: 提交**

```bash
git add cms/scripts/migrate-study-abroad-richtext.ts cms/package.json
git commit -m "feat(scripts): migrate study abroad intro to rich text"
```

---

### Task 4: 文档与整体验证

**Files:**
- Modify: `docs/content-components.md`

- [ ] **Step 1: 更新页面结构说明**

将 `docs/content-components.md` 的「海外留学」代码块替换为：

```text
section(banner)
section(bgImage=yinji)
  heading(白字)
  stack(白底, padding=40)
    richtext(
      H3 美国留学 · 奖学金计划 + 段落 +
      H3 英国留学 + 段落 +
      H3 其他留学项目 + 段落
    )
section(bgColor=light-pink)
  heading(热门留学目的地)
  grid(3列, imageText, imageRatio=16:9 ×5)
```

- [ ] **Step 2: 运行完整验证**

Run from `cms/`:

```bash
npx tsc --noEmit
npm test -- --run
npm run build:generator
```

Expected: TypeScript 无错误，全部测试通过，generator 构建成功。

- [ ] **Step 3: 提交**

```bash
git add docs/content-components.md
git commit -m "docs: update study abroad page structure"
```

---

## 自检

- [x] 设计中的目标/非目标均有任务覆盖。
- [x] 纯函数有单元测试，覆盖数字/字符串字重、缺少正文。
- [x] 迁移脚本只改目标 stack，遇到非 text 子块会中止，幂等。
- [x] 种子脚本与一次性脚本共用同一转换函数。
- [x] 无 TBD、TODO 或未定义类型。

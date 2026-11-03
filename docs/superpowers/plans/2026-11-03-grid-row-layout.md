# Grid 行布局与显式格子 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让现有 `grid` 支持“按行布局”，每行由显式 `gridCell` 组成，使联系我们页可以在 6 列中把两个二维码放进中间两格，同时保持所有旧网格页面不变。

**Architecture:** 不新增顶层区块。`grid` 增加 `layout: 'flow' | 'rows'`；按行模式下 `grid.children` 为 `gridRow`，`gridRow.children` 为 `gridCell`，`gridCell.children` 为普通内容块。行/格子复用现有区块树的选中、路径、增删、移动能力；流式模式完全保留现有渲染路径。

**Tech Stack:** Payload 3.90 / PostgreSQL、Next.js App Router、React 服务端渲染、原生 CSS Grid、Vitest、Playwright MCP。

**Spec:** 本次对话确认的模型（2026-11-03）+ `docs/content-components.md` 现有网格规则。

## Global Constraints

- `grid` 最大列数统一为 **6**，流式与按行模式一致。
- 旧数据没有 `layout` 时一律按 `flow` 渲染，不迁移首页/关于/项目页。
- 移动端（≤768px）每行变 1 列；空格子必须隐藏，不能产生空行间距。
- 不改主题色、不写死颜色；新增样式沿用 `var(--x)` 令牌。
- 每次任务结束必须通过：`cd cms && npx tsc --noEmit && npx vitest run`。
- 字段名、类型名、函数名必须与本文 Interfaces 一致。

## Review Focus

- 旧 `grid` 无 `layout`：必须与改动前像素级一致。
- `layout='rows'` 但没有任何 `gridRow`：不能渲染成空白，回退到流式。
- 移动端：6 个格子中 4 个为空时，不能出现 4 段空白行。
- 编辑器把行从 6 列改小：不能静默删除有内容的格子。
- 编辑器空单元格：仍然可以点击选中并添加内容。
- 联系我们页两个二维码卡：宽度/高度必须相同，且整体居中。

---

## Task 1: 网格列数扩展到 6

**Files:**
- Modify: `cms/src/render/columnRatio.ts`
- Modify: `cms/src/blocks/Grid.ts`
- Modify: `cms/src/site/blocks.tsx:96`
- Modify: `cms/src/render/styles/base.css:240-245,312`
- Test: `cms/src/render/__tests__/columnRatio.test.ts`
- Test: `cms/src/site/__tests__/site.test.tsx`

**Interfaces:**
- Produces: `clampColumns` 允许 1–6；`ratioToGridTemplate` 支持 6 段比例。

- [ ] **Step 1: 写失败测试**

```ts
expect(defaultColumnRatio(6)).toBe('1:1:1:1:1:1')
expect(ratioToGridTemplate('2:1:1:1:1:1', 6)).toBe('2fr 1fr 1fr 1fr 1fr 1fr')
expect(clampColumns(9)).toBe(6)
```

```tsx
const grid = render(blockNode({ type: 'grid', _id: 'g6', columns: 6, children: [] })!)
expect(grid).toContain('grid-cols-6')
```

- [ ] **Step 2: 运行并确认失败**

Run: `cd cms && npx vitest run src/render/__tests__/columnRatio.test.ts src/site/__tests__/site.test.tsx`
Expected: FAIL（6 列被夹到 5）

- [ ] **Step 3: 实现**

- `columnRatio.ts`: `const MAX_COLUMNS = 6`。
- `blocks/Grid.ts`: `columns` 字段 `max: 6`。
- `site/blocks.tsx` 的 `GridView`: `Math.min(6, Math.max(1, b.columns || 3))`。
- `base.css`: 增加 `.grid-cols-6 { grid-template-columns: repeat(6, 1fr); }`；移动端断点选择器加入 `.grid-cols-6`。

- [ ] **Step 4: 验证通过**

Run: `cd cms && npx vitest run src/render/__tests__/columnRatio.test.ts src/site/__tests__/site.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add cms/src/render/columnRatio.ts cms/src/blocks/Grid.ts cms/src/site/blocks.tsx cms/src/render/styles/base.css cms/src/render/__tests__/columnRatio.test.ts cms/src/site/__tests__/site.test.tsx
git commit -m "feat(cms): allow six-column grids"
```

---

## Task 2: 新增 gridRow / gridCell 与按行渲染

**Files:**
- Create: `cms/src/blocks/gridContent.ts`
- Create: `cms/src/blocks/GridRow.ts`
- Create: `cms/src/blocks/GridCell.ts`
- Modify: `cms/src/blocks/Grid.ts`
- Modify: `cms/src/blocks/index.ts`
- Modify: `cms/src/render/types.ts`
- Modify: `cms/src/render/styles/base.css`
- Modify: `cms/src/site/blocks.tsx`
- Modify: `cms/src/generate/loadSiteData.ts`
- Modify: `cms/src/editor/map.ts`
- Modify: `cms/src/editor/blocks.ts`（仅补元数据，保证类型完整）
- Test: `cms/src/site/__tests__/site.test.tsx`
- Test: `cms/src/generate/__tests__/loadSiteData.test.ts`（不存在则新建）
- Regenerate: `cms/src/payload-types.ts`

**Interfaces:**
- Produces:
  - `gridContent: Block[]`
  - `GridRowBlock { type: 'gridRow'; columns: number; gap?: string; columnRatio?: string; children: Block[] }`
  - `GridCellBlock { type: 'gridCell'; children: Block[] }`
  - `GridBlock.layout?: 'flow' | 'rows'`
  - `GridRowView({ b, editor }: { b: GridRowBlock; editor?: boolean })`
  - `GridCellView({ b, editor }: { b: GridCellBlock; editor?: boolean })`

- [ ] **Step 1: 写失败测试**

渲染测试：

```tsx
const row = (cells: any[]) => ({ type: 'gridRow', _id: 'r1', columns: 6, columnRatio: '1:1:1:1:1:1', children: cells })
const cell = (children: any[] = []) => ({ type: 'gridCell', children })
const html = render(blockNode({
  type: 'grid', _id: 'g1', layout: 'rows', children: [
    row([cell(), cell(), cell([{ type: 'text', _id: 't1', body: '二维码 A' }]), cell([{ type: 'text', _id: 't2', body: '二维码 B' }]), cell(), cell()]),
  ],
})!)
expect(html).toContain('grid-rows')
expect((html.match(/class="grid-cell/g) || []).length).toBe(6)
expect(html).toContain('二维码 A')
expect(html).toContain('二维码 B')
```

旧数据回归：

```tsx
const legacy = render(blockNode({ type: 'grid', _id: 'g0', columns: 3, children: [{ type: 'text', _id: 't0', body: 'x' }] })!)
expect(legacy).not.toContain('grid-rows')
```

映射测试：

```ts
expect(mapBlock({ blockType: 'gridRow', columns: 6, children: [] }, (m) => m, new Map())).toMatchObject({ type: 'gridRow', columns: 6 })
```

- [ ] **Step 2: 运行并确认失败**

Run: `cd cms && npx vitest run src/site/__tests__/site.test.tsx src/generate/__tests__/loadSiteData.test.ts`
Expected: FAIL（无 grid-rows / 无 gridRow 类型）

- [ ] **Step 3: 实现区块定义**

`blocks/gridContent.ts`：

```ts
export const gridContent: Block[] = [HeadingBlock, TextBlock, ImageBlock, ImageTextBlock, ButtonBlock, IconCardBlock, StackBlock]
```

`blocks/GridCell.ts`：slug `gridCell`，字段 `children`（blocks: `gridContent`）。

`blocks/GridRow.ts`：slug `gridRow`，字段：
- `columns` number，默认 3，min 1，max 6
- `gap` select（sm/md/lg，默认 md）
- `columnRatio` text，默认 `1:1:1`
- `children` blocks，只允许 `[GridCellBlock]`

`blocks/Grid.ts`：
- 增加 `layout` select：`flow` / `rows`，默认 `flow`
- `children` blocks 改为 `[...gridContent, GridRowBlock, GridInner]`
- `GridInner` 继续使用 `gridContent`
- 导出保持 `gridChildren`（内容类型）供编辑器使用

`blocks/index.ts` 导出 `GridRowBlock`、`GridCellBlock`、`gridContent`。

- [ ] **Step 4: 实现类型与渲染**

`render/types.ts` 增加上述两个接口与 `layout`，并加入 `Block` 联合类型。

`site/blocks.tsx`：

```tsx
export function GridView(...) {
  const rowMode = b.layout === 'rows' && (b.children || []).some((c) => c.type === 'gridRow')
  if (rowMode) {
    const gap = ...
    return (
      <div className="container" data-bid={b._id} style={style}>
        <div className={`grid-rows grid-gap-${gap}`}>
          {(b.children || []).filter((c) => c.type === 'gridRow').map((c, i) => (
            <Fragment key={c._id ?? i}>{blockNode(c, editor)}</Fragment>
          ))}
        </div>
      </div>
    )
  }
  // 现有流式分支不动
}
```

`GridRowView`：按 `clampColumns(b.columns)` 渲染固定数量的 `.grid-cell`；读取 `b.children[i]`，存在则 `blockNode`，不存在则输出空 `.grid-cell is-empty`。空 `gridCell` 在编辑器显示 `＋ 格子`。

`GridCellView`：输出 `<div className="grid-cell" data-bid={b._id}>`，内部渲染 `b.children`；空内容在编辑器显示可点击占位。

`blockNode` 增加 `gridRow` / `gridCell` 分支。

`base.css`：

```css
.grid-rows { display: flex; flex-direction: column; }
.grid-row { display: grid; }
.grid-cell.is-empty { min-height: 0; }
@media (max-width: 768px) {
  .grid-cell.is-empty { display: none; }
}
```

- [ ] **Step 5: 实现数据映射**

`generate/loadSiteData.ts`：
- `grid` 增加 `layout: raw.layout === 'rows' ? 'rows' : 'flow'`
- `gridRow`：`columns: clampColumns(raw.columns)`、`gap`、`columnRatio: normalizeColumnRatio(...)`、递归映射 children
- `gridCell`：递归映射 children

`editor/map.ts`：同样增加 `gridRow` / `gridCell`，写回 `layout`、`columns`、`gap`、`columnRatio`、`children`。

`editor/blocks.ts`：补 `BLOCKS.gridRow`、`BLOCKS.gridCell` 元数据与 `LAYOUT_TYPES`，保证 `Record<Block['type'], ...>` 类型完整。

- [ ] **Step 6: 生成类型并验证**

Run: `cd cms && npm run generate:types && npx tsc --noEmit && npx vitest run src/site/__tests__/site.test.tsx src/generate`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add cms/src/blocks cms/src/render/types.ts cms/src/render/styles/base.css cms/src/site/blocks.tsx cms/src/generate/loadSiteData.ts cms/src/editor/map.ts cms/src/editor/blocks.ts cms/src/payload-types.ts cms/src/site/__tests__/site.test.tsx cms/src/generate/__tests__
git commit -m "feat(cms): add row and cell blocks for grid"
```

---

## Task 3: 编辑器按行布局与自动转换

**Files:**
- Create: `cms/src/editor/gridLayout.ts`
- Modify: `cms/src/editor/state.ts:20-35`（`isContainer`）
- Modify: `cms/src/editor/blocks.ts`
- Modify: `cms/src/editor/PropertyPanel.tsx:36`
- Modify: `cms/src/editor/PageEditor.tsx:255-272`
- Test: `cms/src/editor/__tests__/gridLayout.test.ts`
- Test: `cms/src/editor/__tests__/blocks-meta.test.ts`

**Interfaces:**
- Produces:
  - `convertGridLayout(grid: GridBlock, layout: 'flow' | 'rows'): GridBlock`
  - `resizeRowCells(row: GridRowBlock, columns: number): GridRowBlock`
  - `allowedChildTypes(parent: Block['type'], layout?: string): Block['type'][]`

- [ ] **Step 1: 写失败测试**

```ts
const flow = { type: 'grid', _id: 'g', columns: 3, children: [a, b, c, d, e] } as GridBlock
const rows = convertGridLayout(flow, 'rows')
expect(rows.layout).toBe('rows')
expect(rows.children).toHaveLength(2)
expect(rows.children[0].children).toHaveLength(3)
expect(rows.children[1].children).toHaveLength(3)
expect(rows.children[1].children[2].children).toEqual([]) // 空格子
expect(convertGridLayout(rows, 'flow').children).toHaveLength(5)

const row = { type: 'gridRow', _id: 'r', columns: 6, children: sixCells } as GridRowBlock
expect(resizeRowCells(row, 4).children).toHaveLength(6) // 尾部有内容时不缩到 4
expect(resizeRowCells(row, 8).children).toHaveLength(6) // 列数上限为 6
```

```ts
expect(allowedChildTypes('grid', 'rows')).toEqual(['gridRow'])
expect(allowedChildTypes('grid', 'flow')).toContain('imageText')
expect(allowedChildTypes('gridRow')).toEqual(['gridCell'])
expect(allowedChildTypes('gridCell')).toContain('imageText')
```

- [ ] **Step 2: 运行并确认失败**

Run: `cd cms && npx vitest run src/editor/__tests__/gridLayout.test.ts src/editor/__tests__/blocks-meta.test.ts`
Expected: FAIL（函数不存在）

- [ ] **Step 3: 实现 `gridLayout.ts`**

- `toRowLayout`：现有非 `gridRow` 子块按 `clampColumns(grid.columns)` 分组；每组补空 `gridCell` 到整行；生成 `gridRow` 的 `_id` 与空格子 `_id`。
- `toFlowLayout`：展开 `gridRow.children` → `gridCell.children`，丢弃空格子，保留内容顺序。
- `resizeRowCells`：列数夹到 1–6；若缩短位置之后存在非空格子，则保持到最后一个非空格子；新增格子补空。
- 空 `gridCell` 形状：`{ type: 'gridCell', _id: newId(), children: [] }`。

- [ ] **Step 4: 接入编辑器**

- `state.ts` 的 `isContainer` 加入 `gridRow`、`gridCell`。
- `editor/blocks.ts`：
  - `BLOCKS.gridRow`：标签「行」，字段 `columns`、`gap`、`columnRatio`，默认 3 个空格子。
  - `BLOCKS.gridCell`：标签「格子」，无字段。
  - `LAYOUT_TYPES` 加入两个类型。
  - `allowedChildTypes(parent, layout)` 按上面的规则返回。
  - `blockSummary`：`gridRow` 显示 `行 · N 格`；`gridCell` 显示内容摘要或「空格子」。
- `PropertyPanel.tsx`：`allowedChildTypes(block.type, (block as any).layout)`。
- `PageEditor.tsx` 的 `onChange`：
  - `selected.type === 'grid' && key === 'layout'` → `convertGridLayout(selected, value)`
  - `selected.type === 'gridRow' && key === 'columns'` → `resizeRowCells(selected, value)`，同时 `columnRatio: normalizeColumnRatio(...)`
  - 现有 `grid && key === 'columns'` 逻辑仅在 `layout !== 'rows'` 时执行

- [ ] **Step 5: 验证**

Run: `cd cms && npx tsc --noEmit && npx vitest run src/editor`
Expected: PASS

- [ ] **Step 6: 手工检查编辑器**

- 新建网格 → 切换「按行」→ 出现 1 行 3 个空格子。
- 在格子内添加图文卡片。
- 行改 6 列 → 自动补 3 个空格子。
- 行改回 4 列且第 5、6 格有内容 → 列数不下降。
- 切回「流式」→ 内容仍在，空格子消失。

- [ ] **Step 7: 提交**

```bash
git add cms/src/editor
git commit -m "feat(editor): support row layout grids"
```

---

## Task 4: imageText 支持完整显示图片

**Files:**
- Modify: `cms/src/blocks/ImageText.ts`
- Modify: `cms/src/render/types.ts`
- Modify: `cms/src/site/blocks.tsx:239-269`
- Modify: `cms/src/editor/blocks.ts`
- Modify: `cms/src/generate/loadSiteData.ts:87-102`
- Modify: `cms/src/editor/map.ts:112-123`
- Test: `cms/src/site/__tests__/site.test.tsx`

**Interfaces:**
- Produces: `ImageTextBlock.imageFit?: 'cover' | 'contain'`，默认 `cover`。

- [ ] **Step 1: 写失败测试**

```tsx
const html = render(blockNode({ type: 'imageText', _id: 'it', media: '/qr.png', imageRatio: '1:1', imageFit: 'contain' })!)
expect(html).toContain('object-fit:contain')
```

- [ ] **Step 2: 运行并确认失败**

Run: `cd cms && npx vitest run src/site/__tests__/site.test.tsx`
Expected: FAIL

- [ ] **Step 3: 实现**

- `ImageText.ts` 增加 select 字段 `imageFit`（裁剪填充 `cover` / 完整显示 `contain`，默认 `cover`）。
- `ImageTextView` 给 `<img>` 设置 `style={{ objectFit: b.imageFit || 'cover' }}`。
- `render/types.ts` 增加字段；`loadSiteData` 白名单校验；`editor/map` 写回；编辑器字段同步。
- 样式默认仍为 `cover`。

- [ ] **Step 4: 验证**

Run: `cd cms && npx vitest run src/site/__tests__/site.test.tsx && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add cms/src/blocks/ImageText.ts cms/src/render/types.ts cms/src/site/blocks.tsx cms/src/editor/blocks.ts cms/src/generate/loadSiteData.ts cms/src/editor/map.ts cms/src/site/__tests__/site.test.tsx
git commit -m "feat(cms): add image fit option to image text cards"
```

---

## Task 5: 联系我们页改为 6 列居中二维码

**Files:**
- Modify: `cms/scripts/migrate-contact.ts:170-195`

**Interfaces:**
- Consumes: `grid.layout='rows'`、`gridRow`、`gridCell`、`imageText.imageFit='contain'`。

- [ ] **Step 1: 修改迁移脚本**

扫码咨询区块替换为：

```ts
{
  blockType: 'grid',
  layout: 'rows',
  columns: 6,
  gap: 'md',
  children: [{
    blockType: 'gridRow',
    columns: 6,
    gap: 'md',
    columnRatio: '1:1:1:1:1:1',
    children: [
      { blockType: 'gridCell', children: [] },
      { blockType: 'gridCell', children: [] },
      { blockType: 'gridCell', children: [{ blockType: 'imageText', media: qr, title: '公众号', desc: '公众号二维码', imageRatio: '1:1', imageFit: 'contain' }] },
      { blockType: 'gridCell', children: [{ blockType: 'imageText', media: qr, title: '咨询微信', desc: '咨询微信二维码', imageRatio: '1:1', imageFit: 'contain' }] },
      { blockType: 'gridCell', children: [] },
      { blockType: 'gridCell', children: [] },
    ],
  }],
}
```

- [ ] **Step 2: 执行迁移并检查数据**

Run: `cd cms && npm run migrate:contact`

检查接口：

```bash
curl -sS -b /tmp/zhcookies7.txt 'http://127.0.0.1:3001/api/pages/51?draft=true&depth=0' -o /tmp/contact51.json
python3 - <<'PY'
import json
d = json.load(open('/tmp/contact51.json'))
d = d.get('doc', d)
for s in d['blocks']:
    for c in s.get('children') or []:
        if c.get('blockType') == 'grid' and c.get('layout') == 'rows':
            for r in c.get('children') or []:
                print(r.get('columns'), len(r.get('children') or []), [bool(x.get('children')) for x in r.get('children') or []])
PY
```

Expected: `6 6 [False, False, True, True, False, False]`

- [ ] **Step 3: Playwright 几何验证**

启动/复用开发服务（`cd cms && npm run dev`），登录后打开 `/preview/pages/51`，执行：

```js
[...document.querySelectorAll('.grid-rows .grid-cell')].map((el) => {
  const card = el.querySelector('.image-text')
  const r = el.getBoundingClientRect()
  return { empty: !el.querySelector('*'), left: r.left, width: r.width, cardWidth: card?.getBoundingClientRect().width }
})
```

Expected:
- 6 个 cell；
- 第 3、4 个非空，左右位置对称；
- 两个 `.image-text` 宽度/高度相同；
- 二维码图片 `object-fit: contain`。

若资源 502，先重启 `npm run dev` 再测。

- [ ] **Step 4: 提交**

```bash
git add cms/scripts/migrate-contact.ts
git commit -m "feat(contact): center qr cards in six-column row grid"
```

---

## Task 6: 首页多行回归与文档

**Files:**
- Test: `cms/src/site/__tests__/site.test.tsx`
- Modify: `docs/content-components.md`
- Modify: `docs/superpowers/specs/`（如需补设计记录）

- [ ] **Step 1: 写流式多行回归测试**

```tsx
const six = render(blockNode({ type: 'grid', _id: 'g6', columns: 3, children: Array.from({ length: 6 }, (_, i) => ({ type: 'text', _id: `t${i}`, body: String(i) })) })!)
expect(six).toContain('grid-cols-3')
expect((six.match(/class="grid-cell/g) || []).length).toBe(6)

const nine = render(blockNode({ type: 'grid', _id: 'g9', columns: 3, children: Array.from({ length: 9 }, (_, i) => ({ type: 'text', _id: `n${i}`, body: String(i) })) })!)
expect((nine.match(/class="grid-cell/g) || []).length).toBe(9)
```

- [ ] **Step 2: 运行测试**

Run: `cd cms && npx vitest run src/site/__tests__/site.test.tsx`
Expected: PASS

- [ ] **Step 3: Playwright 检查首页**

- 项目一览：3 列 × 9 项，共 3 行；
- 中惠优势：4 列 × 8 项，共 2 行；
- 卡片宽度、间距与改动前一致；
- 页面无横向滚动。

- [ ] **Step 4: 更新文档**

在 `docs/content-components.md` 的 grid 章节补充：
- `layout`：`flow`（默认，自动换行）/ `rows`（按行，显式格子）；
- `gridRow`：`columns`、`gap`、`columnRatio`、`children`；
- `gridCell`：`children`，空数组表示空格子；
- 移动端规则：1 列 + 隐藏空格子；
- 联系我们页编排改为 `grid(rows) → gridRow(6列) → 6 个 gridCell，第 3/4 格放二维码`；
- 二维码上线前替换占位图。

- [ ] **Step 5: 全量验证**

Run: `cd cms && npx tsc --noEmit && npx vitest run && npm run build:generator`
Expected: 全部通过（现有 172+ 用例）。

- [ ] **Step 6: 提交**

```bash
git add cms/src/site/__tests__/site.test.tsx docs/content-components.md
git commit -m "docs: document grid row layout and verify homepage"
```

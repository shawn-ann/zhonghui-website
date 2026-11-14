# 后台使用教程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Payload 后台增加一份给运营使用的图文教程，覆盖菜单、页眉页脚、页面、文章和发布流程。

**Architecture:** Markdown 文件作为唯一内容源，存放在 `cms/docs/user-guide/`；后台新增 `/admin/tutorial` 服务端视图，校验登录后读取并渲染 Markdown；截图存放在 `cms/public/tutorial/`。左侧导航和页面/文章列表提供教程入口。

**Tech Stack:** Payload CMS 3、Next.js App Router、React 19、TypeScript、`marked`、Vitest、Playwright MCP。

**Spec:** `docs/superpowers/specs/2026-11-14-admin-user-guide-design.md`

## Global Constraints

- 教程内容只放在 `cms/docs/user-guide/`，不要放到仓库根目录 `docs/`，否则 Docker 构建镜像时不会包含。
- 截图只使用本地 CMS：`http://admin.localhost:8080`，测试账号 `admin@zhonghui.local` / `zhonghui1234`。
- 不在生产后台执行发布、删除或保存操作。
- 教程路由必须校验登录；未登录跳转 `/admin/login?redirect=/admin/tutorial`。
- 锚点固定为：`menu`、`site-settings`、`pages`、`articles`、`publish`。
- 每章步骤使用祈使句；切换页面必须重新截图。
- 组件表覆盖全部 17 个业务组件，分组沿用 `docs/content-components.md`。
- 所有新代码遵循现有 `zc-*` 样式和项目命名习惯。

## Review Focus

- 未登录访问 `/admin/tutorial`：必须跳转登录页，不能直接渲染教程。
- Markdown 文件缺失或路径错误：必须抛出带文件名的清晰错误，不能静默显示空页面。
- 截图路径写错或图片未生成：教程页面会出现破图，必须由内容测试和浏览器检查双重覆盖。
- 锚点失效：左侧目录点击后必须滚动到对应章节，章节 id 必须与 `TUTORIAL_CHAPTERS` 一致。
- 移动端溢出：390px 宽度下正文和截图不能横向撑破页面。

---

### Task 1: Markdown 渲染核心

**Files:**
- Modify: `cms/package.json`
- Create: `cms/src/lib/tutorial.ts`
- Test: `cms/src/lib/__tests__/tutorial.test.ts`

**Interfaces:**
- Consumes: 无
- Produces:
  - `export interface TutorialChapter { id: 'menu' | 'site-settings' | 'pages' | 'articles' | 'publish'; title: string; file: string }`
  - `export const TUTORIAL_CHAPTERS: readonly TutorialChapter[]`
  - `export interface RenderedChapter extends TutorialChapter { html: string }`
  - `export function renderTutorialChapter(chapter: TutorialChapter, markdown: string): RenderedChapter`
  - `export function loadTutorialChapters(dir?: string): RenderedChapter[]`

- [ ] **Step 1: 安装 `marked` 为直接依赖**

Run:

```bash
cd cms
npm install marked@^14
```

Expected: `package.json` 的 `dependencies` 中出现 `"marked": "^14..."`，`package-lock.json` 更新。

- [ ] **Step 2: 写失败的测试**

Create `cms/src/lib/__tests__/tutorial.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { TUTORIAL_CHAPTERS, loadTutorialChapters, renderTutorialChapter } from '../tutorial'

describe('tutorial', () => {
  it('defines the five chapters in reading order', () => {
    expect(TUTORIAL_CHAPTERS.map((chapter) => chapter.id)).toEqual([
      'menu',
      'site-settings',
      'pages',
      'articles',
      'publish',
    ])
  })

  it('renders markdown to html', () => {
    const chapter = TUTORIAL_CHAPTERS[0]
    const result = renderTutorialChapter(chapter, '# 配置网站菜单\n\n1. 打开菜单\n2. 添加菜单项')
    expect(result.id).toBe('menu')
    expect(result.html).toContain('<h1>配置网站菜单</h1>')
    expect(result.html).toContain('<li>打开菜单</li>')
    expect(result.html).toContain('<li>添加菜单项</li>')
  })

  it('reports the missing file name', () => {
    expect(() => loadTutorialChapters('/tmp/zhonghui-tutorial-does-not-exist')).toThrow(
      /01-menu\.md/,
    )
  })
})
```

- [ ] **Step 3: 运行测试确认失败**

Run:

```bash
cd cms
npx vitest run src/lib/__tests__/tutorial.test.ts
```

Expected: FAIL，提示找不到 `../tutorial`。

- [ ] **Step 4: 实现 `cms/src/lib/tutorial.ts`**

```ts
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { marked } from 'marked'

export interface TutorialChapter {
  id: 'menu' | 'site-settings' | 'pages' | 'articles' | 'publish'
  title: string
  file: string
}

export const TUTORIAL_CHAPTERS: readonly TutorialChapter[] = [
  { id: 'menu', title: '配置网站菜单', file: '01-menu.md' },
  { id: 'site-settings', title: '配置页眉页脚', file: '02-site-settings.md' },
  { id: 'pages', title: '配置页面', file: '03-pages.md' },
  { id: 'articles', title: '文章配置', file: '04-articles.md' },
  { id: 'publish', title: '站点发布', file: '05-publish.md' },
]

export interface RenderedChapter extends TutorialChapter {
  html: string
}

export function renderTutorialChapter(
  chapter: TutorialChapter,
  markdown: string,
): RenderedChapter {
  return {
    ...chapter,
    html: marked.parse(markdown, { async: false }) as string,
  }
}

export function loadTutorialChapters(
  dir = path.join(process.cwd(), 'docs/user-guide'),
): RenderedChapter[] {
  return TUTORIAL_CHAPTERS.map((chapter) => {
    let markdown = ''
    try {
      markdown = readFileSync(path.join(dir, chapter.file), 'utf8')
    } catch {
      throw new Error(`无法读取教程文件：${chapter.file}`)
    }
    return renderTutorialChapter(chapter, markdown)
  })
}
```

- [ ] **Step 5: 运行测试确认通过**

Run:

```bash
cd cms
npx vitest run src/lib/__tests__/tutorial.test.ts
npx tsc --noEmit
```

Expected: 3 tests PASS，类型检查通过。

- [ ] **Step 6: 提交**

```bash
git add cms/package.json cms/package-lock.json cms/src/lib/tutorial.ts cms/src/lib/__tests__/tutorial.test.ts
git commit -m "feat(tutorial): add markdown rendering helpers"
```

---

### Task 2: 教程页面、登录校验与侧栏入口

**Files:**
- Create: `cms/src/components/admin/TutorialView.tsx`
- Create: `cms/src/components/admin/tutorial.css`
- Create: `cms/docs/user-guide/01-menu.md`（占位，Task 3 填充）
- Create: `cms/docs/user-guide/02-site-settings.md`（占位，Task 4 填充）
- Create: `cms/docs/user-guide/03-pages.md`（占位，Task 5 填充）
- Create: `cms/docs/user-guide/04-articles.md`（占位，Task 6 填充）
- Create: `cms/docs/user-guide/05-publish.md`（占位，Task 7 填充）
- Modify: `cms/src/payload.config.ts`
- Modify: `cms/src/components/admin/AdminNav.tsx`
- Modify: `cms/src/components/admin/icons.tsx`
- Modify: `cms/src/app/(payload)/admin/importMap.js`（由命令生成）

**Interfaces:**
- Consumes: `loadTutorialChapters()`、`TUTORIAL_CHAPTERS` from Task 1.
- Produces: 路由 `/admin/tutorial`，页面根元素 `.tutorial-page`；侧栏路径 `/tutorial`。

- [ ] **Step 1: 创建 5 个占位 Markdown 文件**

每个文件先写标题和一句占位说明，例如 `cms/docs/user-guide/01-menu.md`：

```markdown
# 配置网站菜单

内容整理中。
```

其余 4 个文件分别使用标题：`# 配置页眉页脚`、`# 配置页面`、`# 文章配置`、`# 站点发布`。

- [ ] **Step 2: 实现服务端教程视图**

Create `cms/src/components/admin/TutorialView.tsx`:

```tsx
import React from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { loadTutorialChapters } from '../../lib/tutorial'
import './tutorial.css'

export default async function TutorialView() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    redirect('/admin/login?redirect=%2Fadmin%2Ftutorial')
  }

  const chapters = loadTutorialChapters()

  return (
    <div className="tutorial-page">
      <aside className="tutorial-nav">
        <div className="tutorial-nav-label">使用教程</div>
        {chapters.map((chapter) => (
          <a href={`#${chapter.id}`} key={chapter.id}>
            {chapter.title}
          </a>
        ))}
      </aside>

      <main className="tutorial-content">
        {chapters.map((chapter) => (
          <section
            className="tutorial-section"
            id={chapter.id}
            key={chapter.id}
            dangerouslySetInnerHTML={{ __html: chapter.html }}
          />
        ))}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: 添加教程页样式**

Create `cms/src/components/admin/tutorial.css`:

```css
.tutorial-page {
  display: grid;
  grid-template-columns: 220px minmax(0, 900px);
  gap: 32px;
  max-width: 1360px;
  margin: 0 auto;
  padding: 26px 32px 64px;
  box-sizing: border-box;
}

.tutorial-nav {
  position: sticky;
  top: 24px;
  align-self: start;
  padding: 14px;
  background: #fff;
  border: 1px solid var(--zc-border);
  border-radius: var(--zc-radius-card);
}

.tutorial-nav-label {
  padding: 4px 10px 10px;
  color: var(--zc-soft);
  font-size: 11px;
  letter-spacing: .08em;
}

.tutorial-nav a {
  display: block;
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--zc-muted);
  font-size: 13px;
  text-decoration: none;
}

.tutorial-nav a:hover {
  background: #fdf1f6;
  color: var(--zc-primary);
}

.tutorial-content { min-width: 0; }

.tutorial-section {
  margin-bottom: 24px;
  padding: 24px 28px 28px;
  background: #fff;
  border: 1px solid var(--zc-border);
  border-radius: var(--zc-radius-card);
  scroll-margin-top: 20px;
}

.tutorial-section h1 {
  margin: 0 0 14px;
  font-size: 22px;
  color: #332b2f;
}

.tutorial-section h2 {
  margin: 24px 0 10px;
  font-size: 17px;
  color: #332b2f;
}

.tutorial-section p,
.tutorial-section li {
  color: #5a4a52;
  font-size: 14px;
  line-height: 1.8;
}

.tutorial-section ol,
.tutorial-section ul { padding-left: 22px; }

.tutorial-section img {
  display: block;
  width: 100%;
  height: auto;
  margin: 14px 0;
  border: 1px solid var(--zc-border);
  border-radius: 8px;
}

.tutorial-section code {
  padding: 1px 5px;
  border-radius: 4px;
  background: #f7f0f4;
  color: var(--zc-primary);
  font-size: 12px;
}

.tutorial-section table {
  width: 100%;
  margin: 12px 0;
  border-collapse: collapse;
  font-size: 13px;
}

.tutorial-section th,
.tutorial-section td {
  padding: 9px 10px;
  border: 1px solid var(--zc-border);
  text-align: left;
  vertical-align: top;
}

.tutorial-section th { background: #faf7f9; color: var(--zc-muted); }

@media (max-width: 900px) {
  .tutorial-page {
    grid-template-columns: 1fr;
    padding: 20px 16px 48px;
  }
  .tutorial-nav { position: static; }
  .tutorial-section { padding: 18px; }
}
```

- [ ] **Step 4: 注册 Payload 自定义视图**

Modify `cms/src/payload.config.ts`:

```ts
views: {
  dashboard: { Component: '/components/admin/DashboardRedirect' },
  tutorial: { Component: '/components/admin/TutorialView', path: '/tutorial' },
},
```

- [ ] **Step 5: 添加侧栏入口与帮助图标**

Modify `cms/src/components/admin/icons.tsx`:

```ts
export type AdminIconName =
  | 'pages'
  | 'media'
  | 'menu'
  | 'settings'
  | 'users'
  | 'help'
  | 'chevronLeft'
  | 'chevronDown'
  | 'chevronRight'
  | 'external'
  | 'logout'
  | 'burger'
  | 'account'
```

在 `paths` 中增加：

```tsx
help: (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-.8.6-1.7 1.1-1.7 2.2M12 17h.01" />
  </>
),
```

Modify `cms/src/components/admin/AdminNav.tsx` 的「系统」组：

```ts
items: [
  { label: '用户', path: '/collections/users', icon: 'users' },
  { label: '使用教程', path: '/tutorial', icon: 'help' },
],
```

- [ ] **Step 6: 重新生成 import map 并跑检查**

Run:

```bash
cd cms
npm run generate:importmap
grep -n "TutorialView" 'src/app/(payload)/admin/importMap.js'
npx vitest run src/lib/__tests__/tutorial.test.ts
npx tsc --noEmit
```

Expected: importMap 包含 `/components/admin/TutorialView`，测试通过，类型检查通过。

- [ ] **Step 7: 浏览器验证页面与登录跳转**

用 Playwright MCP：

1. 打开 `http://admin.localhost:8080/admin/tutorial`；
2. 确认页面出现 `.tutorial-page`、5 个目录链接和 5 个章节；
3. 打开 `http://admin.localhost:8080/admin`，确认左侧「系统」组出现「使用教程」；
4. 用 `browser_run_code_unsafe` 执行 `async (page) => { await page.context().clearCookies() }`，再访问 `/admin/tutorial`；
5. 确认跳转到 `/admin/login?redirect=%2Fadmin%2Ftutorial`，然后重新登录。

Expected: 登录时教程正常显示，未登录时跳转登录页。

- [ ] **Step 8: 提交**

```bash
git add cms/package.json cms/package-lock.json cms/src/payload.config.ts cms/src/components/admin/TutorialView.tsx cms/src/components/admin/tutorial.css cms/src/components/admin/AdminNav.tsx cms/src/components/admin/icons.tsx 'cms/src/app/(payload)/admin/importMap.js' cms/docs/user-guide
git commit -m "feat(tutorial): add admin tutorial page and navigation"
```

---

### Task 3: 第一章「配置网站菜单」

**Files:**
- Modify: `cms/docs/user-guide/01-menu.md`
- Create: `cms/public/tutorial/menu-list.png`
- Create: `cms/public/tutorial/menu-modal.png`

**Interfaces:**
- Consumes: `/admin/tutorial` from Task 2.
- Produces: `#menu` 章节内容。

- [ ] **Step 1: 准备截图目录并登录本地后台**

Run:

```bash
mkdir -p cms/public/tutorial
```

Playwright MCP 打开 `http://admin.localhost:8080/admin/globals/menu`，如跳转登录页则使用 `admin@zhonghui.local` / `zhonghui1234` 登录。

- [ ] **Step 2: 截取菜单列表与添加菜单项弹窗**

1. 在菜单页整体可见时截图：

```text
browser_take_screenshot filename=cms/public/tutorial/menu-list.png fullPage=true
```

2. 点击「添加菜单项」，等弹窗出现后截图：

```text
browser_take_screenshot filename=cms/public/tutorial/menu-modal.png
```

Expected: 两张 PNG 存在，弹窗截图中能看到「名称」「链接类型」等字段。

- [ ] **Step 3: 写章节内容**

Replace `cms/docs/user-guide/01-menu.md` with:

```markdown
# 配置网站菜单

![菜单管理页面](/tutorial/menu-list.png)

1. 打开左侧「菜单」。
2. 点击右上角「添加菜单项」。
3. 填写名称，选择链接类型：内部页面、文章分类、外链，或「无链接（仅作父级）」。
4. 根据链接类型选择目标页面/分类，或填写外链地址。
5. 需要二级菜单时，在父级行点击「添加子菜单」。
6. 拖动行首的 ⠿ 可以调整顺序；保存会自动完成。

![添加菜单项](/tutorial/menu-modal.png)

保存后回到页面列表，点击「重建站点」，前台导航才会更新。
```

- [ ] **Step 4: 浏览器验证章节与图片**

Playwright MCP 打开 `http://admin.localhost:8080/admin/tutorial#menu`，执行：

```js
() => Array.from(document.querySelectorAll('#menu img')).map((img) => ({
  src: img.getAttribute('src'),
  ok: img.complete && img.naturalWidth > 0,
}))
```

Expected: 两个图片的 `ok` 都为 `true`。

- [ ] **Step 5: 提交**

```bash
git add cms/docs/user-guide/01-menu.md cms/public/tutorial/menu-list.png cms/public/tutorial/menu-modal.png
git commit -m "docs(tutorial): add menu configuration guide"
```

---

### Task 4: 第二章「配置页眉页脚」

**Files:**
- Modify: `cms/docs/user-guide/02-site-settings.md`
- Create: `cms/public/tutorial/settings-header.png`
- Create: `cms/public/tutorial/settings-footer.png`

**Interfaces:**
- Consumes: `/admin/tutorial` from Task 2.
- Produces: `#site-settings` 章节内容。

- [ ] **Step 1: 截取站点设置页**

Playwright MCP 打开 `http://admin.localhost:8080/admin/globals/site-settings`。

1. 页面顶部和「页头」卡片可见时截图：

```text
browser_take_screenshot filename=cms/public/tutorial/settings-header.png
```

2. 滚动到「页脚」区域后截图：

```text
browser_take_screenshot filename=cms/public/tutorial/settings-footer.png
```

Expected: 两张 PNG 存在，第二张能看到页脚信息、二维码和版权字段。

- [ ] **Step 2: 写章节内容**

Replace `cms/docs/user-guide/02-site-settings.md` with:

```markdown
# 配置页眉页脚

![站点设置-页头](/tutorial/settings-header.png)

1. 打开左侧「站点设置」。
2. 在「页头」区域上传导航 Logo，填写当前语言名称、其它语言名称和链接。
3. 在「页脚」区域上传页脚 Logo，维护页脚信息条目。
4. 添加上方二维码图片和名称。
5. 设置联系按钮文字、联系按钮页面和版权信息。
6. 点击「保存更改」，再回页面列表点击「重建站点」。

![站点设置-页脚](/tutorial/settings-footer.png)

「恢复默认」会重置未保存的设置，操作前确认当前内容。
```

- [ ] **Step 3: 验证图片加载**

Playwright MCP 打开 `http://admin.localhost:8080/admin/tutorial#site-settings`，执行：

```js
() => Array.from(document.querySelectorAll('#site-settings img')).map((img) => ({
  src: img.getAttribute('src'),
  ok: img.complete && img.naturalWidth > 0,
}))
```

Expected: 两个图片的 `ok` 都为 `true`。

- [ ] **Step 4: 提交**

```bash
git add cms/docs/user-guide/02-site-settings.md cms/public/tutorial/settings-header.png cms/public/tutorial/settings-footer.png
git commit -m "docs(tutorial): add site settings guide"
```

---

### Task 5: 第三章「配置页面」与组件说明

**Files:**
- Modify: `cms/docs/user-guide/03-pages.md`
- Create: `cms/public/tutorial/pages-list.png`
- Create: `cms/public/tutorial/page-editor.png`
- Create: `cms/public/tutorial/page-add-section.png`
- Create: `cms/public/tutorial/page-add-child.png`
- Create: `cms/public/tutorial/page-properties.png`

**Interfaces:**
- Consumes: `/admin/tutorial` from Task 2.
- Produces: `#pages` 章节内容。

- [ ] **Step 1: 截取页面列表和编辑器整体**

Playwright MCP：

1. 打开 `http://admin.localhost:8080/admin/collections/pages`，截图：

```text
browser_take_screenshot filename=cms/public/tutorial/pages-list.png fullPage=true
```

2. 打开任意已发布页面（例如 `/admin/collections/pages/62`），截图：

```text
browser_take_screenshot filename=cms/public/tutorial/page-editor.png
```

Expected: 第二张图能同时看到左侧结构树、中间画布和右侧属性面板。

- [ ] **Step 2: 截取添加分栏、添加子组件和属性面板**

1. 在页面编辑器中点击左侧「＋ 分栏」，截图：

```text
browser_take_screenshot filename=cms/public/tutorial/page-add-section.png
```

2. 选中分栏后，在右侧属性面板点击「添加组件」，等组件选择器展开后截图：

```text
browser_take_screenshot filename=cms/public/tutorial/page-add-child.png
```

3. 添加一个「标题」子组件，选中它，截图右侧属性：

```text
browser_take_screenshot filename=cms/public/tutorial/page-properties.png
```

Expected: 三张图分别体现“加分栏 → 右侧加子组件 → 子组件属性”。

> 如果演示页面已被修改，先不要保存；截图完成后刷新页面恢复。

- [ ] **Step 3: 写章节内容**

Replace `cms/docs/user-guide/03-pages.md` with:

```markdown
# 配置页面

![页面列表](/tutorial/pages-list.png)

1. 打开左侧「页面」，点击「新建页面」。
2. 填写页面标题和路由，路由必须以 `/` 开头并以 `/` 结尾，例如 `/about/`。
3. 创建后进入页面编辑器。

![页面编辑器](/tutorial/page-editor.png)

编辑器分三栏：左侧结构树、中间画布、右侧属性。

## 先加分栏

![添加分栏](/tutorial/page-add-section.png)

1. 点击左侧「＋ 分栏」。
2. 在中间画布选中新分栏。
3. 在右侧配置背景、上下内边距和子项间距。

新页面必须先有分栏，内容组件不要直接放在页面顶层。

## 在分栏里添加子组件

![添加子组件](/tutorial/page-add-child.png)

1. 保持分栏选中。
2. 在右侧属性区点击「添加组件」。
3. 选择需要的组件，例如标题、图文卡片、富文本、网格或流程步骤。
4. 添加后点击子组件，在右侧修改它的属性。

![组件属性](/tutorial/page-properties.png)

## 常用组件

| 分组 | 组件 | 用途 |
|---|---|---|
| 布局 | 分栏 | 页面区块外壳，负责背景、内边距和子项间距 |
| 布局 | 网格 | 1–6 列布局，用来排列卡片或图片 |
| 布局 | 横向滚动 | 可横向拖动的卡片轨道 |
| 布局 | 纵向容器 | 在卡片或格子内纵向排列内容 |
| 内容 | 横幅 | 页面顶部主视觉，支持左右和整图两种布局 |
| 内容 | 标题 | 区块标题和副标题 |
| 内容 | 图片 | 单张图片，可设置比例和链接 |
| 内容 | 图文卡片 | 图片 + 标题 + 描述 + 链接 |
| 内容 | 图标卡片 | 图标 + 标题 + 描述的卡片 |
| 内容 | 富文本 | 正文、颜色、对齐、图片和图集 |
| 内容 | 图集 | 多张图片的网格展示 |
| 内容 | 轮播 | 多张图片自动轮播 |
| 内容 | 信息列表 | 标签 + 说明条目 |
| 内容 | 文本条目 | 可折叠的标签/正文卡片 |
| 内容 | 交替图文 | 中轴线左右交替的图文 |
| 内容 | 流程步骤 | 编号步骤说明 |
| 内容 | 图标列表 | 图标 + 标题 + 说明列表 |

网格内还可以继续放标题、图片、图文卡片、图标卡片、流程步骤或纵向容器。需要多列精确排版时，把网格布局方式改为「按行」，再在每一行里放格子。

## 保存和预览

1. 点击顶部「保存」。
2. 点击「预览」检查前台效果。
3. 确认无误后点击「发布」。
```

- [ ] **Step 4: 验证章节与图片**

Playwright MCP 打开 `http://admin.localhost:8080/admin/tutorial#pages`，执行：

```js
() => Array.from(document.querySelectorAll('#pages img')).map((img) => ({
  src: img.getAttribute('src'),
  ok: img.complete && img.naturalWidth > 0,
}))
```

Expected: 5 个图片的 `ok` 都为 `true`。

- [ ] **Step 5: 提交**

```bash
git add cms/docs/user-guide/03-pages.md cms/public/tutorial/pages-list.png cms/public/tutorial/page-editor.png cms/public/tutorial/page-add-section.png cms/public/tutorial/page-add-child.png cms/public/tutorial/page-properties.png
git commit -m "docs(tutorial): add page and component guide"
```

---

### Task 6: 第四章「文章配置」

**Files:**
- Modify: `cms/docs/user-guide/04-articles.md`
- Create: `cms/public/tutorial/categories-list.png`
- Create: `cms/public/tutorial/category-create.png`
- Create: `cms/public/tutorial/articles-list.png`
- Create: `cms/public/tutorial/article-editor.png`

**Interfaces:**
- Consumes: `/admin/tutorial` from Task 2.
- Produces: `#articles` 章节内容。

- [ ] **Step 1: 截取分类管理与新建分类**

Playwright MCP：

1. 打开 `http://admin.localhost:8080/admin/collections/case-categories`，截图：

```text
browser_take_screenshot filename=cms/public/tutorial/categories-list.png fullPage=true
```

2. 点击「新建分类」，在右侧抽屉打开后截图：

```text
browser_take_screenshot filename=cms/public/tutorial/category-create.png
```

Expected: 抽屉中能看到分类名称、URL 别名、副标题、Banner 和每页文章数。

- [ ] **Step 2: 截取文章列表与文章编辑页**

1. 打开 `http://admin.localhost:8080/admin/collections/cases`，截图：

```text
browser_take_screenshot filename=cms/public/tutorial/articles-list.png fullPage=true
```

2. 打开任意文章编辑页，截图：

```text
browser_take_screenshot filename=cms/public/tutorial/article-editor.png fullPage=true
```

Expected: 编辑页能看到标题、分类、URL 别名、封面、正文和底部发布操作。

- [ ] **Step 3: 写章节内容**

Replace `cms/docs/user-guide/04-articles.md` with:

```markdown
# 文章配置

先建分类，再建文章。

## 新建分类

![分类管理](/tutorial/categories-list.png)

1. 打开左侧「分类管理」。
2. 点击「新建分类」。
3. 填写分类名称和 URL 别名。URL 别名只能使用小写字母、数字和连字符。
4. 按需填写分类页副标题、Banner 和每页文章数。
5. 点击「保存」。

![新建分类](/tutorial/category-create.png)

## 新建文章

![文章列表](/tutorial/articles-list.png)

1. 打开左侧「文章列表」，点击「新建文章」。
2. 填写文章标题。
3. 选择文章分类。
4. 填写 URL 别名。
5. 选择封面图。
6. 填写正文。
7. 点击「保存草稿」或直接发布。

![文章编辑页](/tutorial/article-editor.png)

标题、分类、URL 别名、封面和正文都是必填项。URL 别名发布后如果修改，系统会自动生成旧链接跳转。

## 发布文章

1. 回到文章列表。
2. 点击文章右侧的「发布」。
3. 等待侧栏底部显示构建完成。
4. 点击「预览」或访问前台文章链接确认。
```

- [ ] **Step 4: 验证章节与图片**

Playwright MCP 打开 `http://admin.localhost:8080/admin/tutorial#articles`，执行：

```js
() => Array.from(document.querySelectorAll('#articles img')).map((img) => ({
  src: img.getAttribute('src'),
  ok: img.complete && img.naturalWidth > 0,
}))
```

Expected: 4 个图片的 `ok` 都为 `true`。

- [ ] **Step 5: 提交**

```bash
git add cms/docs/user-guide/04-articles.md cms/public/tutorial/categories-list.png cms/public/tutorial/category-create.png cms/public/tutorial/articles-list.png cms/public/tutorial/article-editor.png
git commit -m "docs(tutorial): add article configuration guide"
```

---

### Task 7: 第五章「站点发布」

**Files:**
- Modify: `cms/docs/user-guide/05-publish.md`
- Create: `cms/public/tutorial/publish-pages.png`
- Create: `cms/public/tutorial/publish-build.png`
- Create: `cms/public/tutorial/publish-result.png`

**Interfaces:**
- Consumes: `/admin/tutorial` from Task 2.
- Produces: `#publish` 章节内容。

- [ ] **Step 1: 截取发布按钮与构建状态**

Playwright MCP：

1. 打开页面列表，截图包含「发布」按钮和状态：

```text
browser_take_screenshot filename=cms/public/tutorial/publish-pages.png
```

2. 触发一次本地发布后，截取侧栏底部构建状态：

```text
browser_take_screenshot filename=cms/public/tutorial/publish-build.png
```

Expected: 第二张图能看到「已发布 / 构建中 / 发布」等状态。

- [ ] **Step 2: 截取前台访问结果**

打开本地静态站 `http://127.0.0.1:8080/`，截图：

```text
browser_take_screenshot filename=cms/public/tutorial/publish-result.png
```

Expected: 能看到发布后的前台页面。

- [ ] **Step 3: 写章节内容**

Replace `cms/docs/user-guide/05-publish.md` with:

```markdown
# 站点发布

草稿不会出现在前台。页面和文章都必须发布，并等待静态站重建完成。

![页面发布](/tutorial/publish-pages.png)

1. 打开「页面」或「文章列表」。
2. 确认状态为「草稿」的内容需要发布，点击右侧「发布」。
3. 状态变为「已发布」后，后台会自动开始重建。
4. 看左下角的构建状态，等到构建完成。

![构建状态](/tutorial/publish-build.png)

5. 打开前台地址检查页面。

![前台结果](/tutorial/publish-result.png)

如果需要立即重新生成，可以在页面列表点击「重建站点」。构建期间不要重复点击发布。
```

- [ ] **Step 4: 验证章节与图片**

Playwright MCP 打开 `http://admin.localhost:8080/admin/tutorial#publish`，执行：

```js
() => Array.from(document.querySelectorAll('#publish img')).map((img) => ({
  src: img.getAttribute('src'),
  ok: img.complete && img.naturalWidth > 0,
}))
```

Expected: 3 个图片的 `ok` 都为 `true`。

- [ ] **Step 5: 提交**

```bash
git add cms/docs/user-guide/05-publish.md cms/public/tutorial/publish-pages.png cms/public/tutorial/publish-build.png cms/public/tutorial/publish-result.png
git commit -m "docs(tutorial): add publishing guide"
```

---

### Task 8: 上下文入口、内容校验与端到端验收

**Files:**
- Modify: `cms/src/components/PagesListView.tsx`
- Modify: `cms/src/components/admin/CaseListView.tsx`
- Modify: `cms/src/editor/TopBar.tsx`
- Create: `cms/src/lib/__tests__/tutorialContent.test.ts`

**Interfaces:**
- Consumes: `/admin/tutorial`、`TUTORIAL_CHAPTERS`。
- Produces: 页面/文章列表和页面编辑器中的教程入口；内容与截图完整性测试。

- [ ] **Step 1: 在页面列表增加教程入口**

Modify `cms/src/components/PagesListView.tsx` 的 `AdminPageHeader` actions，在「重建站点」前插入：

```tsx
<a className="zc-btn secondary" href="/admin/tutorial#pages">查看教程</a>
```

- [ ] **Step 2: 在文章列表增加教程入口**

Modify `cms/src/components/admin/CaseListView.tsx` 的 header actions：

```tsx
<a className="zc-btn secondary" href="/admin/tutorial#articles">查看教程</a>
```

- [ ] **Step 3: 在页面编辑器顶部增加教程入口**

Modify `cms/src/editor/TopBar.tsx` 的 `.ed-actions`，在「账号」前插入：

```tsx
<a className="ed-account" href="/admin/tutorial#pages" title="查看页面配置教程">教程</a>
```

- [ ] **Step 4: 添加内容完整性测试**

Create `cms/src/lib/__tests__/tutorialContent.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { TUTORIAL_CHAPTERS } from '../tutorial'

const root = process.cwd()

describe('tutorial content', () => {
  for (const chapter of TUTORIAL_CHAPTERS) {
    it(`${chapter.id} has content and existing images`, () => {
      const markdown = readFileSync(path.join(root, 'docs/user-guide', chapter.file), 'utf8')
      expect(markdown.trim().length).toBeGreaterThan(300)

      const images = Array.from(markdown.matchAll(/!\[[^\]]*\]\((\/tutorial\/[^)]+)\)/g))
        .map((match) => match[1])
      expect(images.length).toBeGreaterThan(0)

      for (const src of images) {
        expect(existsSync(path.join(root, 'public', src)), `${chapter.id}: ${src}`).toBe(true)
      }
    })
  }
})
```

- [ ] **Step 5: 运行全量检查**

Run:

```bash
cd cms
npx vitest run
npx tsc --noEmit
```

Expected: 全部测试通过，类型检查通过。

- [ ] **Step 6: 端到端验收**

Playwright MCP 依次验证：

1. 登录后访问 `/admin/tutorial`，确认 5 章全部渲染；
2. 点击左侧目录每一项，确认页面滚动到对应章节；
3. 页面列表和文章列表能看到「查看教程」；
4. 页面编辑器顶部能看到「教程」；
5. 所有章节图片执行 `img.complete && img.naturalWidth > 0` 均为 `true`；
6. 把视口设为 390×844，确认 `document.documentElement.scrollWidth <= window.innerWidth`；
7. 清除 cookie 后访问 `/admin/tutorial`，确认跳转登录页；
8. 重新登录，确认教程仍可访问。

- [ ] **Step 7: 提交**

```bash
git add cms/src/components/PagesListView.tsx cms/src/components/admin/CaseListView.tsx cms/src/editor/TopBar.tsx cms/src/lib/__tests__/tutorialContent.test.ts
git commit -m "feat(tutorial): add contextual links and content checks"
```

---

## 自检记录

- 规格覆盖：路由与入口、登录校验、Markdown 渲染、5 章内容、17 个组件表、上下文链接、截图约定均有对应任务。
- 类型一致性：`TutorialChapter`、`RenderedChapter`、`TUTORIAL_CHAPTERS`、`loadTutorialChapters` 在 Task 1 定义，Task 2 和 Task 8 使用同名接口。
- Review Focus：未登录跳转（Task 2 浏览器验证）、缺失文件（Task 1 单测）、截图破图（Task 8 内容测试 + 浏览器检查）、锚点（Task 2/8）、移动端（Task 2 CSS + Task 8 验收）。

# 管理后台外壳与视觉重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Payload 后台改造成深色左侧导航 + 统一面包屑/页头 + 克制品牌感的视觉系统，并移除界面中的 API/版本入口。

**Architecture:** 通过 `admin.components.Nav` 替换 Payload 默认导航，为管理页面增加 `admin-shell` 路由类并隐藏默认顶栏；新增共享的 `AdminPageHeader` / 面包屑组件和一套 `zc-*` 设计令牌样式，自定义页面逐页套用，媒体库/用户页只做 CSS 覆盖。所有改动仅影响管理界面，不改数据模型、发布流程和 REST API。

**Tech Stack:** Payload 3.90.2、Next.js 16、React 19、TypeScript、SCSS/CSS、Vitest、Playwright MCP

---

## 文件结构

**新建**

- `cms/src/lib/adminRoute.ts`：判断管理外壳、自定义页面、认证页路由类。
- `cms/src/lib/__tests__/adminRoute.test.ts`：路由类单元测试。
- `cms/src/components/admin/icons.tsx`：后台线性 SVG 图标集合。
- `cms/src/components/admin/AdminNav.tsx`：左侧导航、折叠、移动抽屉、账号菜单。
- `cms/src/components/admin/AdminMobileBar.tsx`：移动端顶部工具条。
- `cms/src/components/admin/AdminPageHeader.tsx`：面包屑 + 标题/说明 + 操作。
- `cms/src/components/admin/__tests__/AdminPageHeader.test.tsx`：页头渲染测试。
- `cms/src/components/admin/admin-theme.css`：令牌、外壳、共享按钮/卡片/表格/表单/弹窗/Toast。
- `cms/src/components/admin/DashboardRedirect.tsx`：`/admin` 跳转到页面列表。

**修改**

- `cms/src/payload.config.ts`：注册自定义 Nav、移动工具条、dashboard 跳转。
- `cms/src/app/(payload)/layout.tsx`：首屏输出管理外壳类。
- `cms/src/components/RouteSync.tsx`：客户端路由切换时同步外壳类。
- `cms/src/app/(payload)/custom.scss`：保留编辑器规则，补充默认文档头/登录页覆盖。
- `cms/src/components/PagesListView.tsx`、`pages-list.css`
- `cms/src/components/MenuEditorView.tsx`、`menu-editor.css`
- `cms/src/components/SiteSettingsView.tsx`、`site-settings-editor.css`
- `cms/src/editor/TopBar.tsx`、`editor.css`
- `cms/src/app/(payload)/admin/importMap.js`（由命令重新生成）

---

### Task 1: 管理外壳路由类

**Files:**
- Create: `cms/src/lib/adminRoute.ts`
- Test: `cms/src/lib/__tests__/adminRoute.test.ts`
- Modify: `cms/src/app/(payload)/layout.tsx`
- Modify: `cms/src/components/RouteSync.tsx`

- [ ] **Step 1: 写失败测试**

Create `cms/src/lib/__tests__/adminRoute.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { adminHtmlClasses, isAdminShellPath, isCustomAdminViewPath } from '../adminRoute'

describe('adminRoute', () => {
  it('marks authenticated admin pages as admin shell', () => {
    expect(isAdminShellPath('/admin/collections/pages')).toBe(true)
    expect(isAdminShellPath('/admin/globals/site-settings')).toBe(true)
    expect(isAdminShellPath('/admin/account')).toBe(true)
  })

  it('excludes auth and editor pages from the shell', () => {
    expect(isAdminShellPath('/admin/login')).toBe(false)
    expect(isAdminShellPath('/admin/forgot')).toBe(false)
    expect(isAdminShellPath('/admin/reset')).toBe(false)
    expect(isAdminShellPath('/admin/collections/pages/44')).toBe(false)
  })

  it('detects custom pages that provide their own header', () => {
    expect(isCustomAdminViewPath('/admin/collections/pages')).toBe(true)
    expect(isCustomAdminViewPath('/admin/collections/pages/')).toBe(true)
    expect(isCustomAdminViewPath('/admin/globals/menu')).toBe(true)
    expect(isCustomAdminViewPath('/admin/globals/site-settings')).toBe(true)
    expect(isCustomAdminViewPath('/admin/collections/media')).toBe(false)
  })

  it('builds html classes for server and client rendering', () => {
    expect(adminHtmlClasses('/admin/globals/menu')).toBe('admin-shell admin-custom-page')
    expect(adminHtmlClasses('/admin/collections/pages/44')).toBe('ed-route')
    expect(adminHtmlClasses('/admin/login')).toBe('')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
cd /Users/ansh/Develop/ai_workspace/zhonghui-website/cms
npx vitest run src/lib/__tests__/adminRoute.test.ts
```

Expected: FAIL，提示找不到 `../adminRoute`。

- [ ] **Step 3: 实现路由 helper**

Create `cms/src/lib/adminRoute.ts`:

```ts
import { isEditorPath } from './editorRoute'

const AUTH_PATH = /^\/admin\/(login|forgot|reset|logout)(?:\/|$)/
const CUSTOM_VIEW_PATHS = [
  /^\/admin\/collections\/pages\/?$/,
  /^\/admin\/globals\/(menu|site-settings)\/?$/,
]

function normalize(pathname?: string | null): string {
  return (pathname || '').replace(/\/+$/, '') || '/'
}

export function isAdminShellPath(pathname?: string | null): boolean {
  const path = normalize(pathname)
  return path.startsWith('/admin') && !AUTH_PATH.test(path) && !isEditorPath(path)
}

export function isCustomAdminViewPath(pathname?: string | null): boolean {
  const path = normalize(pathname)
  return CUSTOM_VIEW_PATHS.some((pattern) => pattern.test(path))
}

export function adminHtmlClasses(pathname?: string | null): string {
  const classes: string[] = []
  if (isEditorPath(pathname)) classes.push('ed-route')
  if (isAdminShellPath(pathname)) classes.push('admin-shell')
  if (isCustomAdminViewPath(pathname)) classes.push('admin-custom-page')
  return classes.join(' ')
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/lib/__tests__/adminRoute.test.ts`

Expected: PASS（4 tests）。

- [ ] **Step 5: 服务端首屏写入类名**

Modify `cms/src/app/(payload)/layout.tsx`:

```tsx
import { adminHtmlClasses } from '@/lib/adminRoute'
```

Remove:

```tsx
import { isEditorPath } from '@/lib/editorRoute'
```

Replace the layout body:

```tsx
const Layout = async ({ children }: Args) => {
  const h = await headers()
  const htmlClass = adminHtmlClasses(h.get('x-pathname'))
  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunction}
      htmlProps={htmlClass ? { className: htmlClass } : undefined}
    >
      <RouteSync />
      {children}
    </RootLayout>
  )
}
```

- [ ] **Step 6: 客户端路由同步**

Replace `cms/src/components/RouteSync.tsx`:

```tsx
'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { adminHtmlClasses } from '@/lib/adminRoute'

const SHELL_CLASSES = ['ed-route', 'admin-shell', 'admin-custom-page'] as const

export default function RouteSync() {
  const pathname = usePathname()

  useEffect(() => {
    const classes = adminHtmlClasses(pathname).split(' ').filter(Boolean)
    for (const name of SHELL_CLASSES) {
      document.documentElement.classList.toggle(name, classes.includes(name))
    }
  }, [pathname])

  return null
}
```

- [ ] **Step 7: 类型检查并提交**

Run:

```bash
npx tsc --noEmit
git add src/lib/adminRoute.ts src/lib/__tests__/adminRoute.test.ts src/app/\(payload\)/layout.tsx src/components/RouteSync.tsx
git commit -m "feat(admin): add shell-aware route classes"
```

Expected: `tsc` 无输出，提交成功。

---

### Task 2: 设计令牌、外壳与共享组件样式

**Files:**
- Create: `cms/src/components/admin/admin-theme.css`
- Modify: `cms/src/app/(payload)/layout.tsx`

- [ ] **Step 1: 创建设计令牌与外壳 CSS**

Create `cms/src/components/admin/admin-theme.css` with the foundation below. Keep all selectors scoped under `html.admin-shell` or `zc-*` so the public site is unaffected.

```css
:root {
  --zc-bg: #f7f5f6;
  --zc-surface: #fff;
  --zc-border: #ede4e8;
  --zc-border-strong: #e2d5db;
  --zc-text: #332b2f;
  --zc-muted: #7c6b73;
  --zc-soft: #a08b95;
  --zc-primary: #c2185b;
  --zc-primary-hover: #a1144b;
  --zc-accent: #e60039;
  --zc-success: #1b7a3a;
  --zc-success-bg: #eaf6ee;
  --zc-danger: #b42318;
  --zc-danger-bg: #fdecec;
  --zc-warning: #9a5b00;
  --zc-warning-bg: #fff6e5;
  --zc-sidebar: #242126;
  --zc-sidebar-hover: #312c31;
  --zc-sidebar-active: #3b353a;
  --zc-sidebar-text: #c7bbc1;
  --zc-sidebar-soft: #8d7f86;
  --zc-radius-card: 10px;
  --zc-radius-control: 6px;
  --zc-radius-modal: 12px;
  --zc-control: 36px;
  --zc-shadow-card: 0 1px 2px rgba(60, 30, 45, .04);
  --zc-shadow-pop: 0 14px 40px rgba(35, 20, 28, .16);
}

html.admin-shell body {
  background: var(--zc-bg);
  color: var(--zc-text);
}

/* Hide Payload chrome and reserve the sidebar column. */
html.admin-shell .app-header,
html.admin-shell .template-default > .nav .nav__header {
  display: none !important;
}

html.admin-shell .template-default > .nav,
html.admin-shell .template-default > aside.nav {
  position: fixed !important;
  inset: 0 auto 0 0;
  z-index: 50;
  width: 224px !important;
  max-width: 224px;
  height: 100vh;
  padding: 0 !important;
  border: 0;
  background: var(--zc-sidebar);
  transform: none !important;
  transition: width .18s ease;
}

html.admin-shell .template-default {
  min-height: 100vh;
}

html.admin-shell .template-default__wrap {
  margin-left: 224px;
  min-height: 100vh;
  transition: margin-left .18s ease;
}

html.admin-shell.zc-sidebar-collapsed .template-default > .nav,
html.admin-shell.zc-sidebar-collapsed .template-default > aside.nav {
  width: 64px !important;
  max-width: 64px;
}

html.admin-shell.zc-sidebar-collapsed .template-default__wrap {
  margin-left: 64px;
}

html.admin-shell.admin-custom-page .doc-header {
  display: none !important;
}

html.ed-route .nav,
html.ed-route .app-header,
html.ed-route .zc-mobilebar {
  display: none !important;
}

html.ed-route .template-default__wrap {
  margin-left: 0 !important;
}

/* Shared page header / breadcrumb */
.zc-page {
  box-sizing: border-box;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 26px 32px 44px;
}

.zc-crumb {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 20px;
  color: var(--zc-soft);
  font-size: 11px;
}

.zc-crumb a:hover { color: var(--zc-primary); }
.zc-crumb .sep { opacity: .55; }
.zc-crumb .current { color: var(--zc-text); }

.zc-page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 9px 0 18px;
  border-bottom: 1px solid var(--zc-border);
}

.zc-page-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.3;
  letter-spacing: -.01em;
}

.zc-page-desc {
  margin: 5px 0 0;
  color: var(--zc-muted);
  font-size: 12px;
}

.zc-page-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* Buttons */
.zc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: var(--zc-control);
  padding: 0 14px;
  border: 1px solid var(--zc-primary);
  border-radius: var(--zc-radius-control);
  background: var(--zc-primary);
  color: #fff;
  font-size: 13px;
  font-family: inherit;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
}

.zc-btn:hover { background: var(--zc-primary-hover); border-color: var(--zc-primary-hover); }
.zc-btn.secondary { background: #fff; border-color: var(--zc-border-strong); color: #5a4a52; }
.zc-btn.secondary:hover { border-color: var(--zc-primary); color: var(--zc-primary); }
.zc-btn.text { background: transparent; border-color: transparent; color: var(--zc-muted); padding: 0 8px; }
.zc-btn.text:hover { background: #f9f2f5; color: var(--zc-primary); }
.zc-btn.danger { background: transparent; border-color: transparent; color: var(--zc-danger); padding: 0 8px; }
.zc-btn.danger:hover { background: var(--zc-danger-bg); }
.zc-btn:disabled { opacity: .5; cursor: default; }

/* Cards */
.zc-card {
  background: var(--zc-surface);
  border: 1px solid var(--zc-border);
  border-radius: var(--zc-radius-card);
  box-shadow: var(--zc-shadow-card);
  padding: 20px;
}

.zc-card + .zc-card { margin-top: 14px; }
.zc-card-title { margin: 0; color: var(--zc-primary); font-size: 14px; line-height: 1.4; }
.zc-card-hint { margin: 3px 0 0; color: var(--zc-muted); font-size: 12px; }
.zc-card-head { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 14px; }

/* Forms */
.zc-input {
  width: 100%;
  height: var(--zc-control);
  padding: 0 11px;
  border: 1px solid var(--zc-border-strong);
  border-radius: var(--zc-radius-control);
  background: #fff;
  color: var(--zc-text);
  font: inherit;
  font-size: 13px;
  outline: none;
  transition: border-color .12s, box-shadow .12s;
}

.zc-input:focus {
  border-color: var(--zc-primary);
  box-shadow: 0 0 0 3px rgba(194, 24, 91, .12);
}

/* Table shell */
.zc-table-card {
  background: var(--zc-surface);
  border: 1px solid var(--zc-border);
  border-radius: var(--zc-radius-card);
  box-shadow: var(--zc-shadow-card);
  overflow: hidden;
}
.zc-table-scroll { overflow-x: auto; }

/* Toast */
.zc-toast {
  position: fixed;
  top: 20px;
  right: 24px;
  z-index: 4000;
  padding: 10px 16px;
  border: 1px solid #bfe3c9;
  border-radius: 8px;
  background: var(--zc-success-bg);
  color: var(--zc-success);
  box-shadow: var(--zc-shadow-pop);
  font-size: 13px;
}
.zc-toast.is-error { border-color: #f3c1c1; background: var(--zc-danger-bg); color: var(--zc-danger); }

/* Mobile toolbar */
html.admin-shell .zc-mobilebar {
  display: none;
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 30;
  height: 52px;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border-bottom: 1px solid var(--zc-border);
  background: rgba(255,255,255,.94);
  backdrop-filter: blur(10px);
}
html.admin-shell .zc-mobilebar__spacer { flex: 1; }

@media (max-width: 899px) {
  html.admin-shell .template-default > .nav,
  html.admin-shell .template-default > aside.nav {
    width: 238px !important;
    max-width: 238px;
    transform: translateX(-100%) !important;
    transition: transform .22s ease;
  }
  html.admin-shell.zc-nav-open .template-default > .nav,
  html.admin-shell.zc-nav-open .template-default > aside.nav {
    transform: translateX(0) !important;
  }
  html.admin-shell .template-default__wrap,
  html.admin-shell.zc-sidebar-collapsed .template-default__wrap {
    margin-left: 0;
    padding-top: 52px;
  }
  html.admin-shell .zc-mobilebar { display: flex; }
  .zc-page { padding: 20px 20px 36px; }
  .zc-page-head { flex-direction: column; align-items: stretch; gap: 14px; }
  .zc-page-actions { justify-content: flex-start; }
}
```

- [ ] **Step 2: 全局引入**

Modify `cms/src/app/(payload)/layout.tsx` imports:

```tsx
import './custom.scss'
import '@/components/admin/admin-theme.css'
```

- [ ] **Step 3: 验证编辑器仍全屏**

Run the app, open `http://admin.localhost:8080/admin/collections/pages/44`.

Expected: 编辑器没有左侧栏和默认顶栏；样式与改造前一致。此时自定义 Nav 尚未注册，非编辑器页仍显示默认导航，但 `admin-shell` 已可隐藏默认顶栏。

- [ ] **Step 4: 提交**

```bash
git add src/components/admin/admin-theme.css src/app/\(payload\)/layout.tsx
git commit -m "feat(admin): add design tokens and shell layout"
```

---

### Task 3: 自定义左侧导航与移动工具条

**Files:**
- Create: `cms/src/components/admin/icons.tsx`
- Create: `cms/src/components/admin/AdminNav.tsx`
- Create: `cms/src/components/admin/AdminMobileBar.tsx`
- Create: `cms/public/brand/footer-logo.png`（从 `img/footLogo.png` 复制白色 Logo）
- Modify: `cms/src/components/admin/admin-theme.css`
- Modify: `cms/src/payload.config.ts`

- [ ] **Step 1: 准备白色品牌 Logo**

Run:

```bash
cd /Users/ansh/Develop/ai_workspace/zhonghui-website
cp img/footLogo.png cms/public/brand/footer-logo.png
```

Expected: 新文件存在，访问 `http://admin.localhost:8080/brand/footer-logo.png` 返回 200。

- [ ] **Step 2: 创建图标集合**

Create `cms/src/components/admin/icons.tsx`:

```tsx
import React from 'react'

export type AdminIconName =
  | 'pages' | 'media' | 'menu' | 'settings' | 'users'
  | 'chevronLeft' | 'chevronDown' | 'chevronRight'
  | 'external' | 'logout' | 'burger' | 'account'

const paths: Record<AdminIconName, React.ReactNode> = {
  pages: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></>,
  media: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
  menu: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.92 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  chevronLeft: <path d="m15 18-6-6 6-6"/>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
  chevronRight: <path d="m9 18 6-6-6-6"/>,
  external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
  burger: <path d="M3 6h18M3 12h18M3 18h18"/>,
  account: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
}

export function AdminIcon({
  name,
  size = 18,
  className,
}: {
  name: AdminIconName
  size?: number
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  )
}
```

- [ ] **Step 3: 创建 AdminNav**

Create `cms/src/components/admin/AdminNav.tsx`:

```tsx
'use client'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth, useConfig } from '@payloadcms/ui'
import { AdminIcon, type AdminIconName } from './icons'

const SIDEBAR_KEY = 'zhonghui.admin.sidebar'

type NavItem = { label: string; path: string; icon: AdminIconName }

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: '内容',
    items: [
      { label: '页面', path: '/collections/pages', icon: 'pages' },
      { label: '媒体库', path: '/collections/media', icon: 'media' },
      { label: '菜单', path: '/globals/menu', icon: 'menu' },
      { label: '站点设置', path: '/globals/site-settings', icon: 'settings' },
    ],
  },
  {
    label: '系统',
    items: [{ label: '用户', path: '/collections/users', icon: 'users' }],
  },
]

export default function AdminNav() {
  const pathname = usePathname()
  const { config } = useConfig()
  const { user, logOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  const adminRoute = config.routes.admin || '/admin'
  const email = user?.email || ''
  const name = (user as { name?: string } | null)?.name || email || '管理员'
  const initial = name.slice(0, 1).toUpperCase()

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY) === 'collapsed'
      setCollapsed(saved)
      document.documentElement.classList.toggle('zc-sidebar-collapsed', saved)
    } catch {
      setCollapsed(false)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.remove('zc-nav-open')
    setAccountOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!accountOpen) return
    const close = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [accountOpen])

  const toggleCollapse = () => {
    setCollapsed((current) => {
      const next = !current
      document.documentElement.classList.toggle('zc-sidebar-collapsed', next)
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? 'collapsed' : 'expanded')
      } catch {
        /* ignore storage errors */
      }
      return next
    })
  }

  const closeMobile = () => document.documentElement.classList.remove('zc-nav-open')

  const handleLogout = async () => {
    await logOut()
    window.location.assign(`${adminRoute}/login`)
  }

  return (
    <div className={`zc-sidebar${collapsed ? ' is-collapsed' : ''}`}>
      <button
        className="zc-scrim"
        aria-label="关闭导航"
        onClick={closeMobile}
        type="button"
      />

      <div className="zc-brand-row">
        <Link className="zc-brand" href={`${adminRoute}/collections/pages`} onClick={closeMobile}>
          <img alt="中惠文化" className="zc-brand-logo" src="/brand/footer-logo.png" />
          <span className="zc-brand-mark">中</span>
        </Link>
        <button
          aria-label={collapsed ? '展开侧栏' : '折叠侧栏'}
          className="zc-collapse"
          onClick={toggleCollapse}
          title={collapsed ? '展开侧栏' : '折叠侧栏'}
          type="button"
        >
          <AdminIcon name={collapsed ? 'chevronRight' : 'chevronLeft'} />
        </button>
      </div>

      <nav className="zc-nav" aria-label="后台导航">
        {GROUPS.map((group) => (
          <div className="zc-nav-group" key={group.label}>
            <div className="zc-nav-label">{group.label}</div>
            {group.items.map((item) => {
              const href = `${adminRoute}${item.path}`
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  aria-current={active ? 'page' : undefined}
                  className={`zc-nav-item${active ? ' is-active' : ''}`}
                  href={href}
                  key={item.path}
                  onClick={closeMobile}
                  prefetch={false}
                  title={item.label}
                >
                  <AdminIcon name={item.icon} />
                  <span className="zc-nav-text">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="zc-sidebar-foot">
        <a className="zc-foot-link" href="/" rel="noreferrer" target="_blank" title="查看网站">
          <AdminIcon name="external" />
          <span className="zc-nav-text">查看网站</span>
        </a>

        <div className="zc-account-wrap" ref={accountRef}>
          <button
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            className="zc-account"
            onClick={() => setAccountOpen((open) => !open)}
            type="button"
          >
            <span className="zc-avatar">{initial}</span>
            <span className="zc-account-name">{name}</span>
            <AdminIcon className="zc-account-chev" name="chevronDown" size={14} />
          </button>
          {accountOpen ? (
            <div className="zc-account-pop" role="menu">
              <div className="zc-account-who">
                <b>{name}</b>
                <span>{email}</span>
              </div>
              <Link href={`${adminRoute}/account`} onClick={() => setAccountOpen(false)} role="menuitem">
                <AdminIcon name="account" size={15} />
                账号设置
              </Link>
              <button onClick={handleLogout} role="menuitem" type="button">
                <AdminIcon name="logout" size={15} />
                退出登录
              </button>
            </div>
          ) : null}
        </div>

        <button className="zc-foot-collapse" onClick={toggleCollapse} title={collapsed ? '展开侧栏' : '收起侧栏'} type="button">
          <AdminIcon name={collapsed ? 'chevronRight' : 'chevronLeft'} />
          <span className="zc-nav-text">{collapsed ? '展开侧栏' : '收起侧栏'}</span>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 创建移动工具条**

Create `cms/src/components/admin/AdminMobileBar.tsx`:

```tsx
'use client'
import React from 'react'
import Link from 'next/link'
import { useAuth, useConfig } from '@payloadcms/ui'
import { AdminIcon } from './icons'

export default function AdminMobileBar() {
  const { config } = useConfig()
  const { user } = useAuth()
  const adminRoute = config.routes.admin || '/admin'
  const email = user?.email || ''
  const name = (user as { name?: string } | null)?.name || email || '管理员'

  return (
    <div className="zc-mobilebar">
      <button
        aria-label="打开导航"
        className="zc-mobilebar__button"
        onClick={() => document.documentElement.classList.toggle('zc-nav-open')}
        type="button"
      >
        <AdminIcon name="burger" size={20} />
      </button>
      <Link href={`${adminRoute}/collections/pages`}>
        <img alt="中惠文化" className="zc-mobilebar__logo" src="/brand/footer-logo.png" />
      </Link>
      <span className="zc-mobilebar__spacer" />
      <Link aria-label="账号" className="zc-avatar" href={`${adminRoute}/account`}>
        {name.slice(0, 1).toUpperCase()}
      </Link>
    </div>
  )
}
```

- [ ] **Step 5: 注册组件**

Modify `cms/src/payload.config.ts`:

```ts
admin: {
  user: Users.slug,
  components: {
    Nav: '/components/admin/AdminNav',
    header: ['/components/admin/AdminMobileBar'],
    graphics: {
      Logo: '/components/Logo',
      Icon: '/components/Icon',
    },
  },
  // ...
}
```

Keep the existing `importMap`, `meta`, etc.

- [ ] **Step 6: 重新生成 import map**

Run:

```bash
cd /Users/ansh/Develop/ai_workspace/zhonghui-website/cms
npm run generate:importmap
```

Expected: `importMap.js` 新增 `AdminNav` 与 `AdminMobileBar` 3 个引用。

- [ ] **Step 7: 追加导航 CSS**

Append to `cms/src/components/admin/admin-theme.css`:

```css
html.admin-shell .nav {
  color: var(--zc-sidebar-text);
}

.zc-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100vh;
  color: var(--zc-sidebar-text);
  font-size: 13px;
}

.zc-brand-row {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 14px 0 18px;
  flex: none;
}

.zc-brand { display: flex; align-items: center; flex: 1; min-width: 0; }
.zc-brand-logo { display: block; height: 27px; width: auto; }
.zc-brand-mark {
  display: none;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--zc-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}

.zc-collapse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex: none;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--zc-sidebar-soft);
  cursor: pointer;
}
.zc-collapse:hover { background: var(--zc-sidebar-hover); color: #fff; }

.zc-nav { flex: 1; overflow-y: auto; padding: 4px 10px 14px; }
.zc-nav-group { margin-bottom: 18px; }
.zc-nav-label {
  margin-bottom: 6px;
  padding: 0 10px;
  color: var(--zc-sidebar-soft);
  font-size: 10px;
  letter-spacing: .12em;
  white-space: nowrap;
}

.zc-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  margin-bottom: 3px;
  padding: 0 10px;
  border-radius: 6px;
  color: var(--zc-sidebar-text);
  white-space: nowrap;
}
.zc-nav-item:hover { background: var(--zc-sidebar-hover); color: #fff; }
.zc-nav-item.is-active { background: var(--zc-sidebar-active); color: #fff; font-weight: 600; }
.zc-nav-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--zc-accent);
}
.zc-nav-item svg { flex: none; opacity: .8; }
.zc-nav-item.is-active svg { opacity: 1; }

.zc-sidebar-foot { flex: none; padding: 10px; border-top: 1px solid rgba(255,255,255,.06); }

.zc-foot-link,
.zc-account,
.zc-foot-collapse {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--zc-sidebar-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.zc-foot-link:hover,
.zc-account:hover,
.zc-foot-collapse:hover { background: var(--zc-sidebar-hover); color: #fff; }

.zc-account { height: 46px; margin-top: 4px; }
.zc-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: 50%;
  background: linear-gradient(140deg, #8a5a70, #c2185b);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}
.zc-account-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.zc-account-chev { margin-left: auto; opacity: .6; }

.zc-account-wrap { position: relative; }
.zc-account-pop {
  position: absolute;
  left: 0;
  bottom: 52px;
  z-index: 80;
  width: 196px;
  padding: 6px;
  border: 1px solid var(--zc-border);
  border-radius: 10px;
  background: #fff;
  box-shadow: var(--zc-shadow-pop);
}
.zc-account-who { padding: 9px 10px; margin-bottom: 5px; border-bottom: 1px solid #f5eef1; color: var(--zc-text); }
.zc-account-who b { display: block; font-size: 12px; }
.zc-account-who span { color: var(--zc-soft); font-size: 11px; }
.zc-account-pop a,
.zc-account-pop button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 9px;
  border: 0;
  border-radius: 5px;
  background: none;
  color: var(--zc-muted);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.zc-account-pop a:hover,
.zc-account-pop button:hover { background: #faf5f7; color: var(--zc-primary); }
.zc-account-pop button:last-child:hover { color: var(--zc-danger); }

html.admin-shell.zc-sidebar-collapsed .zc-brand { justify-content: center; flex: 0 0 auto; }
html.admin-shell.zc-sidebar-collapsed .zc-brand-logo { display: none; }
html.admin-shell.zc-sidebar-collapsed .zc-brand-mark { display: inline-flex; }
html.admin-shell.zc-sidebar-collapsed .zc-collapse { display: none; }
html.admin-shell.zc-sidebar-collapsed .zc-nav { padding: 4px 8px 14px; }
html.admin-shell.zc-sidebar-collapsed .zc-nav-label {
  height: 1px;
  margin: 10px 6px;
  padding: 0;
  background: rgba(255,255,255,.07);
  overflow: hidden;
  color: transparent;
}
html.admin-shell.zc-sidebar-collapsed .zc-nav-item { justify-content: center; padding: 0; }
html.admin-shell.zc-sidebar-collapsed .zc-nav-text,
html.admin-shell.zc-sidebar-collapsed .zc-account-name,
html.admin-shell.zc-sidebar-collapsed .zc-account-chev { display: none; }
html.admin-shell.zc-sidebar-collapsed .zc-sidebar-foot { padding: 10px 8px; }
html.admin-shell.zc-sidebar-collapsed .zc-foot-link,
html.admin-shell.zc-sidebar-collapsed .zc-account { justify-content: center; padding: 0; }
html.admin-shell.zc-sidebar-collapsed .zc-account { height: 38px; }
html.admin-shell.zc-sidebar-collapsed .zc-foot-collapse { justify-content: center; padding: 0; }
html.admin-shell.zc-sidebar-collapsed .zc-foot-collapse .zc-nav-text { display: none; }
html.admin-shell.zc-sidebar-collapsed .zc-foot-collapse svg { transform: rotate(180deg); }

html.admin-shell .zc-mobilebar__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--zc-muted);
  cursor: pointer;
}
html.admin-shell .zc-mobilebar__logo { height: 22px; filter: brightness(.35) saturate(2); }
html.admin-shell .zc-mobilebar .zc-avatar { text-decoration: none; }

html.admin-shell .zc-scrim { display: none; }

@media (max-width: 899px) {
  html.admin-shell.zc-nav-open .zc-scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 40;
    border: 0;
    background: rgba(25, 16, 21, .42);
    backdrop-filter: blur(2px);
  }
  html.admin-shell .zc-sidebar { width: 238px; }
  html.admin-shell .zc-collapse { display: none; }
  html.admin-shell .zc-brand-logo { display: block; }
  html.admin-shell .zc-brand-mark { display: none; }
  html.admin-shell .zc-nav-label {
    height: auto;
    margin: 0 0 6px;
    padding: 0 10px;
    background: none;
    color: var(--zc-sidebar-soft);
  }
  html.admin-shell .zc-nav-item { justify-content: flex-start; padding: 0 10px; }
  html.admin-shell .zc-nav-text,
  html.admin-shell .zc-account-name,
  html.admin-shell .zc-account-chev { display: inline; }
  html.admin-shell .zc-foot-link,
  html.admin-shell .zc-account { justify-content: flex-start; padding: 0 10px; }
  html.admin-shell .zc-foot-collapse { display: none; }
}
```

- [ ] **Step 8: 验证导航**

Run dev server, open `http://admin.localhost:8080/admin/globals/site-settings`.

Expected:
- 默认顶栏消失，左侧深色导航出现。
- 当前「站点设置」高亮并有左侧玫红条。
- 折叠按钮可切换 224/64，刷新后保持。
- 移动宽度 <900px 时出现顶部工具条和抽屉。

- [ ] **Step 9: 提交**

```bash
git add src/components/admin/icons.tsx src/components/admin/AdminNav.tsx src/components/admin/AdminMobileBar.tsx src/components/admin/admin-theme.css src/payload.config.ts 'src/app/(payload)/admin/importMap.js'
git commit -m "feat(admin): replace payload nav with branded sidebar"
```

---

### Task 4: 默认首页跳转到页面列表

**Files:**
- Create: `cms/src/components/admin/DashboardRedirect.tsx`
- Modify: `cms/src/payload.config.ts`

- [ ] **Step 1: 创建跳转组件**

Create `cms/src/components/admin/DashboardRedirect.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default function DashboardRedirect() {
  redirect('/admin/collections/pages')
}
```

- [ ] **Step 2: 注册 dashboard 视图**

Modify `cms/src/payload.config.ts` 的 `admin.components.views`：

```ts
components: {
  Nav: '/components/admin/AdminNav',
  header: ['/components/admin/AdminMobileBar'],
  views: {
    dashboard: { Component: '/components/admin/DashboardRedirect' },
  },
  graphics: {
    Logo: '/components/Logo',
    Icon: '/components/Icon',
  },
},
```

- [ ] **Step 3: 生成 import map 并验证**

```bash
npm run generate:importmap
```

Open `http://admin.localhost:8080/admin`.

Expected: 自动跳转到 `/admin/collections/pages`。

- [ ] **Step 4: 提交**

```bash
git add src/components/admin/DashboardRedirect.tsx src/payload.config.ts 'src/app/(payload)/admin/importMap.js'
git commit -m "feat(admin): use pages list as admin home"
```

---

### Task 5: 共享面包屑与页头组件

**Files:**
- Create: `cms/src/components/admin/AdminPageHeader.tsx`
- Test: `cms/src/components/admin/__tests__/AdminPageHeader.test.tsx`

- [ ] **Step 1: 写失败测试**

Create `cms/src/components/admin/__tests__/AdminPageHeader.test.tsx`:

```tsx
// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AdminPageHeader } from '../AdminPageHeader'

const render = (node: React.ReactNode) => renderToStaticMarkup(node)

describe('AdminPageHeader', () => {
  it('renders breadcrumb links and the current page', () => {
    const html = render(
      <AdminPageHeader
        breadcrumbs={[
          { label: '首页', href: '/admin/collections/pages' },
          { label: '站点设置' },
        ]}
        title="站点设置"
        description="保存后需要重建站点"
      />,
    )
    expect(html).toContain('href="/admin/collections/pages"')
    expect(html).toContain('class="current">站点设置')
    expect(html).toContain('<h1 class="zc-page-title">站点设置</h1>')
  })

  it('renders actions beside the title', () => {
    const html = render(
      <AdminPageHeader
        breadcrumbs={[{ label: '首页' }]}
        title="页面"
        actions={<button type="button">新建页面</button>}
      />,
    )
    expect(html).toContain('zc-page-actions')
    expect(html).toContain('新建页面')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/components/admin/__tests__/AdminPageHeader.test.tsx`

Expected: FAIL，找不到组件。

- [ ] **Step 3: 实现组件**

Create `cms/src/components/admin/AdminPageHeader.tsx`:

```tsx
import React from 'react'
import Link from 'next/link'

export type AdminBreadcrumb = {
  label: string
  href?: string
}

export function AdminPageHeader({
  breadcrumbs,
  title,
  description,
  actions,
}: {
  breadcrumbs: AdminBreadcrumb[]
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <>
      <nav aria-label="面包屑" className="zc-crumb">
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <span className="sep">/</span> : null}
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span className="current">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
      <div className="zc-page-head">
        <div>
          <h1 className="zc-page-title">{title}</h1>
          {description ? <p className="zc-page-desc">{description}</p> : null}
        </div>
        {actions ? <div className="zc-page-actions">{actions}</div> : null}
      </div>
    </>
  )
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/components/admin/__tests__/AdminPageHeader.test.tsx`

Expected: PASS（2 tests）。

- [ ] **Step 5: 提交**

```bash
git add src/components/admin/AdminPageHeader.tsx src/components/admin/__tests__/AdminPageHeader.test.tsx
git commit -m "feat(admin): add shared page header and breadcrumbs"
```

---

### Task 6: 页面列表视觉重构

**Files:**
- Modify: `cms/src/components/PagesListView.tsx`
- Modify: `cms/src/components/pages-list.css`

- [ ] **Step 1: 替换页头**

In `PagesListView.tsx`, add import:

```tsx
import { AdminPageHeader } from './admin/AdminPageHeader'
```

Replace the existing `<div className="pl-head">…</div>` block with:

```tsx
<AdminPageHeader
  breadcrumbs={[{ label: '首页' }]}
  title="页面"
  description="管理站点页面、路由与发布状态。修改后需重建站点使静态站生效。"
  actions={
    <>
      <button className="zc-btn secondary" disabled={rebuilding} onClick={rebuildSite} type="button">
        {rebuilding ? '构建中…' : '重建站点'}
      </button>
      <button className="zc-btn" onClick={() => setModal({ mode: 'create', title: '', route: '/' })} type="button">
        新建页面
      </button>
    </>
  }
/>
```

- [ ] **Step 2: 统一 Toast 与表格容器**

Replace the toast markup:

```tsx
{toast ? <div className={`zc-toast${toast.kind === 'error' ? ' is-error' : ''}`}>{toast.text}</div> : null}
```

Wrap the table:

```tsx
<div className="zc-table-card">
  <div className="zc-table-scroll">
    <table className="pl-table">…</table>
  </div>
</div>
```

Keep table contents unchanged.

- [ ] **Step 3: 统一弹窗按钮**

In the modal actions, replace:

```tsx
<button type="button" className="pl-primary" disabled={saving} onClick={saveModal}>
```

with:

```tsx
<button type="button" className="zc-btn" disabled={saving} onClick={saveModal}>
```

Replace 取消 button class with `zc-btn secondary`.

- [ ] **Step 4: 更新 CSS**

Replace the top of `pages-list.css` through `.pl-head-actions` with:

```css
.pl-wrap {
  box-sizing: border-box;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 26px 32px 44px;
  color: var(--zc-text);
  font-family: inherit;
}
.pl-muted { color: var(--zc-muted); font-size: 13px; }
```

Remove `.pl-head`, `.pl-head h1`, `.pl-head-actions`, `.pl-primary`, `.pl-secondary` rules. Keep modal/toast rules, but change hard-coded colors to `var(--zc-*)` and reuse `.zc-btn` in markup.

Add:

```css
.pl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.pl-table th,
.pl-table td {
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #f5eef1;
  text-align: left;
  white-space: nowrap;
}
.pl-table th {
  height: 40px;
  background: #fbf9fa;
  color: var(--zc-muted);
  font-size: 11px;
  font-weight: 600;
}
.pl-table tbody tr:last-child td { border-bottom: 0; }
.pl-table tbody tr:hover td { background: #fdf8fa; }
.pl-table code {
  padding: 2px 7px;
  border-radius: 4px;
  background: #fff1f6;
  color: var(--zc-primary);
  font-size: 11px;
}
.pl-actions { justify-content: flex-end; }
.pl-actions button,
.pl-actions a {
  border: 0;
  background: none;
  color: var(--zc-primary);
  padding: 5px 7px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.pl-actions button:hover,
.pl-actions a:hover { background: #fff1f6; }
.pl-actions .pl-danger { color: var(--zc-danger); }
.pl-actions .pl-danger:hover { background: var(--zc-danger-bg); }
```

Update `.pl-status` colors to `var(--zc-success-bg)` / `var(--zc-success)` and draft to `#f2eef0` / `var(--zc-muted)`.

- [ ] **Step 5: 验证**

Open `http://admin.localhost:8080/admin/collections/pages`.

Expected:
- 左侧导航高亮「页面」。
- 内容区显示面包屑「首页」+ 大标题 + 说明 + 两个按钮。
- 表格白卡、行悬停、状态胶囊与预览一致。
- 新建/编辑弹窗、删除、重建站点仍可用。

- [ ] **Step 6: 提交**

```bash
git add src/components/PagesListView.tsx src/components/pages-list.css
git commit -m "feat(admin): restyle pages list"
```

---

### Task 7: 菜单页视觉重构

**Files:**
- Modify: `cms/src/components/MenuEditorView.tsx`
- Modify: `cms/src/components/menu-editor.css`

- [ ] **Step 1: 替换页头**

Add import:

```tsx
import { AdminPageHeader } from './admin/AdminPageHeader'
```

Replace `<div className="me-head">…</div>` with:

```tsx
<AdminPageHeader
  breadcrumbs={[
    { label: '首页', href: '/admin/collections/pages' },
    { label: '菜单' },
  ]}
  title="菜单"
  description="修改会自动保存；保存后请在页面列表点「重建站点」使静态站生效。"
  actions={
    <>
      <span className={`me-save is-${saveState}`}>
        {saveState === 'saving' ? '保存中…' : null}
        {saveState === 'saved' ? `已自动保存${savedAt ? ` · ${savedAt}` : ''}` : null}
        {saveState === 'error' ? (
          <>
            保存失败
            <button type="button" onClick={retrySave}>重试</button>
          </>
        ) : null}
      </span>
      <button type="button" className="zc-btn" onClick={() => openCreate(null)}>添加菜单项</button>
    </>
  }
/>
```

- [ ] **Step 2: 统一 Toast、表格和弹窗**

Toast:

```tsx
{toast ? <div className={`zc-toast${toast.kind === 'error' ? ' is-error' : ''}`}>{toast.text}</div> : null}
```

Table wrapper:

```tsx
<div className="zc-table-card">
  <div className="zc-table-scroll">
    <table className="me-table">…</table>
  </div>
</div>
```

Modal action buttons: use `zc-btn` / `zc-btn secondary`.

- [ ] **Step 3: 更新 CSS**

Replace `.me-wrap` / `.me-head` block at the top of `menu-editor.css` with:

```css
.me-wrap {
  box-sizing: border-box;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 26px 32px 44px;
  color: var(--zc-text);
  font-family: inherit;
}
.me-save { display: inline-flex; align-items: center; gap: 6px; color: var(--zc-success); font-size: 11px; white-space: nowrap; }
.me-save::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.me-save.is-saving { color: var(--zc-warning); }
.me-save.is-error { color: var(--zc-danger); }
.me-save button { padding: 2px 8px; border: 1px solid #e3b4b4; border-radius: 4px; background: #fff; color: var(--zc-danger); font-size: 11px; cursor: pointer; }
.me-muted { color: var(--zc-muted); font-size: 13px; }
```

Remove `.me-head*`, `.me-btn`, `.me-primary`, `.me-toast` rules.

Table styles:

```css
.me-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.me-table th, .me-table td { height: 48px; padding: 0 16px; border-bottom: 1px solid #f5eef1; text-align: left; vertical-align: middle; }
.me-table th { height: 40px; background: #fbf9fa; color: var(--zc-muted); font-size: 11px; }
.me-table tbody tr:last-child td { border-bottom: 0; }
.me-table tbody tr:hover td { background: #fdf8fa; }
.me-table tr.is-over td { box-shadow: inset 0 2px 0 var(--zc-accent); }
.me-table code { padding: 2px 7px; border-radius: 4px; background: #fff1f6; color: var(--zc-primary); font-size: 11px; }
.me-child td:first-child { position: relative; padding-left: 44px; }
.me-child td:first-child::before { content: '↳'; position: absolute; left: 24px; color: #c0aab5; }
.me-handle { margin-right: 7px; color: #c9b7bf; cursor: grab; letter-spacing: -2px; }
.me-ops { display: flex; justify-content: flex-end; gap: 2px; flex-wrap: wrap; }
.me-ops button { border: 0; background: none; color: var(--zc-primary); padding: 5px 7px; border-radius: 4px; font-size: 12px; cursor: pointer; }
.me-ops button:hover { background: #fff1f6; }
.me-ops button:disabled { opacity: .35; cursor: default; }
.me-ops .me-danger { color: var(--zc-danger); }
.me-ops .me-danger:hover { background: var(--zc-danger-bg); }
```

Modal styles: use `var(--zc-radius-modal)`, `var(--zc-shadow-pop)`, inputs with theme tokens. Keep existing layout.

- [ ] **Step 4: 验证**

Open `/admin/globals/menu`.

Expected:
- 面包屑「首页 / 菜单」、标题与预览一致。
- 表格可拖拽，↑↓、编辑、添加子菜单、删除仍正常。
- 修改后显示“保存中…”→“已自动保存”。

- [ ] **Step 5: 提交**

```bash
git add src/components/MenuEditorView.tsx src/components/menu-editor.css
git commit -m "feat(admin): restyle menu editor"
```

---

### Task 8: 站点设置视觉重构

**Files:**
- Modify: `cms/src/components/SiteSettingsView.tsx`
- Modify: `cms/src/components/site-settings-editor.css`

- [ ] **Step 1: 替换页头并移除旧头部**

Add import:

```tsx
import { AdminPageHeader } from './admin/AdminPageHeader'
```

Delete the `<div className="ss-head">…</div>` block. Insert after toast:

```tsx
<AdminPageHeader
  breadcrumbs={[
    { label: '首页', href: '/admin/collections/pages' },
    { label: '站点设置' },
  ]}
  title="站点设置"
  description="保存后，请在页面列表点「重建站点」使静态站生效。"
  actions={
    <>
      <button type="button" className="zc-btn secondary" onClick={reset}>恢复默认</button>
      <button type="button" className="zc-btn" disabled={!dirty || saving} onClick={save}>
        {saving ? '保存中…' : '保存更改'}
      </button>
    </>
  }
/>
```

- [ ] **Step 2: 合并为四张主卡片**

Replace the two `<div className="ss-group">…</div>` wrappers with four cards. The outer structure becomes:

```tsx
<div className="ss-cards">
  <section className="zc-card">
    <div className="zc-card-head">
      <div>
        <h2 className="zc-card-title">页头</h2>
        <p className="zc-card-hint">导航 Logo 与语言切换。</p>
      </div>
      <span className="ss-card-sub">导航区域</span>
    </div>
    <div className="ss-grid2">
      {/* 导航 Logo */}
      {/* 当前语言名称 / 其它语言名称 / 其它语言链接 */}
    </div>
  </section>

  <section className="zc-card">
    <div className="zc-card-head">
      <div>
        <h2 className="zc-card-title">页脚</h2>
        <p className="zc-card-hint">页脚 Logo、联系方式、二维码与版权。</p>
      </div>
      <span className="ss-card-sub">页脚区域</span>
    </div>
    <div className="ss-grid2">
      {/* 页脚 Logo */}
      {/* 版权信息 */}
    </div>
    <div className="ss-subhead">页脚信息</div>
    {/* footerInfo rows + add button */}
  </section>

  <section className="zc-card">
    <div className="zc-card-head">
      <div>
        <h2 className="zc-card-title">二维码</h2>
        <p className="zc-card-hint">数量不限，可上传图片；未上传时显示占位。</p>
      </div>
    </div>
    {/* qr-grid + add button */}
  </section>

  <section className="zc-card">
    <div className="zc-card-head">
      <div>
        <h2 className="zc-card-title">联系按钮</h2>
        <p className="zc-card-hint">不选择页面时，页脚不显示联系按钮。</p>
      </div>
    </div>
    <div className="ss-grid2">{/* 按钮文字 / 链接页面 */}</div>
  </section>
</div>
```

Keep all existing handlers, field values, upload logic and QR logic unchanged; only move JSX into the four cards.

- [ ] **Step 3: 统一底部保存与 Toast**

Bottom actions:

```tsx
<div className="ss-bottom">
  <button type="button" className="zc-btn secondary" onClick={reset}>恢复默认</button>
  <button type="button" className="zc-btn" disabled={!dirty || saving} onClick={save}>
    {saving ? '保存中…' : '保存更改'}
  </button>
</div>
```

Toast:

```tsx
{toast ? <div className={`zc-toast${toast.kind === 'error' ? ' is-error' : ''}`}>{toast.text}</div> : null}
```

- [ ] **Step 4: 重写设置页 CSS**

Replace `site-settings-editor.css` with token-based styles. Keep all class names used by the JSX (`ss-wrap`, `ss-grid2`, `ss-media`, `ss-thumb`, `ss-upload`, `ss-file`, `ss-rows`, `ss-row`, `ss-add`, `ss-qr-grid`, `ss-bottom`, `ss-card-sub`, `ss-subhead`). A minimal complete version:

```css
.ss-wrap {
  box-sizing: border-box;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 26px 32px 44px;
  color: var(--zc-text);
  font-family: inherit;
}

.ss-cards { display: grid; gap: 14px; padding-top: 18px; }
.ss-card-sub { color: var(--zc-soft); font-size: 11px; white-space: nowrap; }
.ss-subhead { margin: 16px 0 7px; color: #6b5b63; font-size: 12px; }

.ss-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 18px; }
.ss-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; color: #6b5b63; font-size: 12px; }
.ss-field small { color: var(--zc-soft); font-size: 11px; }
.ss-field .zc-input { height: var(--zc-control); }

.ss-media { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.ss-thumb {
  width: 102px;
  height: 62px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--zc-border);
  border-radius: 7px;
  background: #fff7fa;
}
.ss-thumb img { max-width: 88%; max-height: 80%; object-fit: contain; }
.ss-thumb.ss-thumb-dark { background: var(--zc-primary); }
.ss-thumb.ss-thumb-dark img { max-width: 84%; }
.ss-thumb.ss-empty { border-style: dashed; color: var(--zc-soft); font-size: 11px; }

.ss-upload {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  overflow: hidden;
  border: 1px solid var(--zc-border-strong);
  border-radius: 6px;
  background: #fff;
  color: #5a4a52;
  font-size: 12px;
  cursor: pointer;
}
.ss-upload:hover { border-color: var(--zc-primary); color: var(--zc-primary); }
.ss-upload.is-disabled { opacity: .55; cursor: default; }
.ss-file { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

.ss-rows { display: flex; flex-direction: column; }
.ss-row { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid #f5eef1; }
.ss-row:last-child { border-bottom: 0; }
.ss-row .ss-handle { width: 14px; flex: none; color: #c9b7bf; cursor: grab; letter-spacing: -2px; }
.ss-row .zc-input { height: 34px; }
.ss-row .ss-label-input { flex: 0 0 176px; }
.ss-row .ss-grow { flex: 1; min-width: 0; }
.ss-row .ss-mini {
  height: 28px;
  min-width: 28px;
  padding: 0 8px;
  border: 1px solid var(--zc-border-strong);
  border-radius: 5px;
  background: #fff;
  color: #5a4a52;
  font-size: 11px;
  cursor: pointer;
}
.ss-row .ss-mini:hover { border-color: var(--zc-primary); color: var(--zc-primary); }
.ss-row .ss-mini:disabled { opacity: .35; cursor: default; }
.ss-row .ss-danger { color: var(--zc-danger); }
.ss-add {
  margin-top: 8px;
  padding: 7px 0;
  border: 0;
  background: none;
  color: var(--zc-primary);
  font-size: 12px;
  cursor: pointer;
}

.ss-qr-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.ss-qr-card { padding: 12px; border: 1px solid #f0e6ea; border-radius: 8px; background: #fdfbfc; }
.ss-qr-card .zc-input { height: 32px; margin-bottom: 10px; }
.ss-qr-thumb { width: 100%; height: 74px; margin-bottom: 9px; display: flex; align-items: center; justify-content: center; border: 1px dashed var(--zc-border-strong); border-radius: 7px; background: #fff; color: var(--zc-soft); font-size: 11px; }
.ss-qr-actions { display: flex; gap: 7px; }
.ss-qr-actions .ss-upload { flex: 1; justify-content: center; }
.ss-qr-actions .ss-mini { flex: 1; justify-content: center; }

.ss-bottom { display: flex; justify-content: flex-end; gap: 8px; padding-top: 2px; }

.ss-danger-link { border: 0; background: none; color: var(--zc-danger); font-size: 12px; cursor: pointer; }

@media (max-width: 1100px) {
  .ss-qr-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 899px) {
  .ss-wrap { padding: 20px 20px 36px; }
  .ss-grid2 { grid-template-columns: 1fr; }
  .ss-qr-grid { grid-template-columns: 1fr; }
  .ss-row { flex-wrap: wrap; }
  .ss-row .ss-label-input { flex: 1 1 120px; }
  .ss-row .ss-grow { flex: 1 1 150px; }
}
```

In JSX, use the new class names (`ss-qr-grid`, `ss-qr-card`, `ss-qr-thumb`, `ss-qr-actions`, `ss-mini`, `ss-label-input`, `ss-grow`, `ss-danger`) and `zc-input` for inputs/selects.

- [ ] **Step 5: 验证**

Open `/admin/globals/site-settings`.

Expected:
- 面包屑 + 标题/说明 + 恢复默认/保存。
- 四张卡片：页头、页脚、二维码、联系按钮。
- 上传、移除、增删行、增删二维码、保存、Toast 均正常。
- 空版权保存后重建站点不显示版权。

- [ ] **Step 6: 提交**

```bash
git add src/components/SiteSettingsView.tsx src/components/site-settings-editor.css
git commit -m "feat(admin): restyle site settings"
```

---

### Task 9: 页面编辑器顶栏与移除 API/版本入口

**Files:**
- Modify: `cms/src/editor/TopBar.tsx`
- Modify: `cms/src/editor/editor.css`

- [ ] **Step 1: 移除 API 与版本链接**

In `TopBar.tsx`, replace the `<nav className="ed-docnav">…</nav>` block with:

```tsx
<nav className="ed-docnav" aria-label="页面导航">
  <a className="is-active" href={`/admin/collections/pages/${id}`}>编辑</a>
</nav>
```

Delete:

```tsx
<a href={`/admin/collections/pages/${id}/versions`}>版本</a>
<a href={`/admin/collections/pages/${id}/api`}>API</a>
```

- [ ] **Step 2: 顶栏加入面包屑样式**

Replace topbar content structure with:

```tsx
<div className="ed-topbar">
  <a className="ed-back" href="/admin/collections/pages" title="返回页面列表">← 页面列表</a>
  <span className="ed-crumb-sep">/</span>
  <span className="ed-title">{title}</span>
  <span className="ed-status">
    {status === 'published' ? '已发布' : '草稿'}{dirty ? ' · 未保存' : ''}
  </span>
  <span className="ed-spacer" />
  <nav className="ed-docnav" aria-label="页面导航">
    <a className="is-active" href={`/admin/collections/pages/${id}`}>编辑</a>
  </nav>
  <div className="ed-actions">
    <a className="ed-account" href="/admin/account" title="账号">账号</a>
    <button onClick={onPreview}>预览</button>
    <button onClick={onSave}>保存</button>
    <button
      className="ed-publish"
      onClick={onPublish}
      disabled={busy}
      title={busy ? '发布/构建中，请稍候' : undefined}
    >
      {buttonLabel}
    </button>
  </div>
</div>
```

- [ ] **Step 3: 调整顶栏 CSS**

In `editor.css`, update `.ed-topbar` to:

```css
.ed-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 18px;
  background: #fff;
  border-bottom: 1px solid var(--zc-border, #ede4e8);
  color: var(--zc-text, #332b2f);
  font-size: 13px;
}
.ed-crumb-sep { color: #a08b95; }
.ed-title { font-weight: 600; }
.ed-status {
  padding: 3px 8px;
  border-radius: 99px;
  background: #fff1f6;
  color: var(--zc-primary, #c2185b);
  font-size: 11px;
}
```

Remove `.ed-docnav a` rules for version/API if present; keep active link style.

- [ ] **Step 4: 验证**

Open `/admin/collections/pages/44`.

Expected:
- 顶栏只有返回、标题/状态、编辑、账号、预览/保存/发布。
- 没有 API、版本入口。
- 保存、预览、发布仍正常。
- 没有左侧栏（编辑器保持全屏）。

- [ ] **Step 5: 提交**

```bash
git add src/editor/TopBar.tsx src/editor/editor.css
git commit -m "feat(editor): remove api and version links from topbar"
```

---

### Task 10: 默认 Payload 页面与登录页视觉覆盖

**Files:**
- Modify: `cms/src/app/(payload)/custom.scss`
- Modify: `cms/src/components/admin/admin-theme.css`

- [ ] **Step 1: 隐藏默认文档头中的 API/版本入口**

Append to `admin-theme.css`:

```css
html.admin-shell .doc-header a[href*="/api"],
html.admin-shell .doc-header a[href*="/versions"] {
  display: none !important;
}

html.admin-shell .doc-header {
  margin: 26px 32px 0;
  max-width: 1360px;
  border-bottom: 1px solid var(--zc-border);
  background: transparent;
}

html.admin-shell .doc-header__header {
  padding-bottom: 18px;
}

html.admin-shell .doc-header h1 {
  font-size: 24px;
  letter-spacing: -.01em;
}
```

For Media/Users default list pages, keep Payload's table but align surfaces:

```css
html.admin-shell .collection-list,
html.admin-shell .list-header,
html.admin-shell .table {
  --theme-elevation-0: #ffffff;
}

html.admin-shell .table {
  border: 1px solid var(--zc-border);
  border-radius: var(--zc-radius-card);
  overflow: hidden;
}

html.admin-shell .table thead th {
  background: #fbf9fa;
  color: var(--zc-muted);
  font-size: 11px;
}

html.admin-shell .table tbody tr:hover {
  background: #fdf8fa;
}
```

- [ ] **Step 2: 登录页统一背景与主按钮**

Append to `cms/src/app/(payload)/custom.scss`:

```scss
html:not(.admin-shell) .login {
  background: #f7f5f6;
}

html:not(.admin-shell) .login__form {
  border: 1px solid #ede4e8;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(60, 30, 45, .08);
}

html:not(.admin-shell) .login .btn--style-primary {
  background: #c2185b;
  border-color: #c2185b;
}
```

If selectors do not match the installed Payload version, keep the existing login layout and only add the background rule; do not break the form.

- [ ] **Step 3: 验证**

Open:
- `/admin/collections/media`
- `/admin/collections/users`
- `/admin/login`（退出后）

Expected:
- 媒体库/用户页保留原生结构，侧栏正常，API/版本链接不显示。
- 页面底色、表格、按钮与新主题协调。
- 登录页表单可正常使用。

- [ ] **Step 4: 提交**

```bash
git add 'src/app/(payload)/custom.scss' src/components/admin/admin-theme.css
git commit -m "feat(admin): theme default payload views and login"
```

---

### Task 11: 全量验证与收尾

**Files:**
- No code changes expected; fix issues found and commit per fix.

- [ ] **Step 1: 类型检查与测试**

```bash
cd /Users/ansh/Develop/ai_workspace/zhonghui-website/cms
npx tsc --noEmit
npm test -- --run
```

Expected:
- `tsc` 无错误。
- 所有测试通过（当前基线 134 + 新增测试）。

- [ ] **Step 2: 桌面端 Playwright 检查（1280px）**

逐项确认：

- `/admin/collections/pages`：页面列表、面包屑、按钮、表格。
- `/admin/globals/menu`：菜单表格、保存状态、拖拽/排序/弹窗。
- `/admin/globals/site-settings`：四张卡片、上传、保存 Toast。
- `/admin/collections/pages/44`：编辑器顶栏无 API/版本。
- `/admin/collections/media`、`/admin/collections/users`：默认视图主题化。
- 折叠侧栏后主内容左移，刷新后保持折叠。

- [ ] **Step 3: 移动端 Playwright 检查（390px）**

- 顶部 52px 工具条出现。
- 点击菜单按钮打开抽屉，遮罩点击/Esc 关闭。
- 页面内容单列，无横向溢出。
- 表格可横向滚动，操作列可见。

- [ ] **Step 4: 功能回归**

- 菜单新增/编辑/删除/拖拽后自动保存。
- 站点设置上传 Logo/二维码、保存、恢复默认。
- 页面列表新建、编辑信息、删除、重建站点。
- 页面编辑器保存、预览、发布。

- [ ] **Step 5: 修复发现的问题**

每修复一个问题单独提交，例如：

```bash
git add src/components/admin/admin-theme.css
git commit -m "fix(admin): correct mobile drawer spacing"
```

- [ ] **Step 6: 最终状态确认**

```bash
git status --short
git log --oneline -5
```

Expected: 只包含本次任务的预期文件；无调试截图、临时文件或未使用的导入。

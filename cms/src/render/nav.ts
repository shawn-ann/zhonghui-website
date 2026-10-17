import { esc, safeUrl } from './primitives'

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
    label: '赴美J1交流项目',
    link: '/project-iccp/',
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

export const LANG_LINK = 'https://example-en.invalid/'
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
  return `<li><a href="${esc(href)}"${active}>${esc(m.label)}${caret}</a>${sub}</li>`
}

export function renderNav(activeRoute: string): string {
  const menu = NAV_ITEMS.map((m) => item(m, activeRoute)).join('')
  return `<header><div class="container nav">
    <a class="logo" href="/"><img src="${esc(LOGO_SRC)}" alt="中惠文化"></a>
    <button class="nav-toggle" type="button" aria-label="菜单" aria-expanded="false">☰</button>
    <div class="nav-right">
      <ul class="nav-menu">${menu}</ul>
      <div class="nav-lang"><a class="active" href="#">中文</a><span class="sep">|</span><a href="${esc(safeUrl(LANG_LINK) || '#')}">EN</a></div>
    </div>
  </div></header>`
}

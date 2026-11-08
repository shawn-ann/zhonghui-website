import { hrefOf } from './assets'
import type { MenuNode, SiteSettings } from '../render/types'

function isActiveLink(link: string, activeRoute: string): boolean {
  if (link === activeRoute) return true
  return link !== '/' && activeRoute.startsWith(link)
}

function NavItem({ item, activeRoute }: { item: MenuNode; activeRoute: string }) {
  const hasChildren = Boolean(item.children?.length)
  const active = item.link
    ? isActiveLink(item.link, activeRoute)
    : Boolean(item.children?.some((c) => c.link && isActiveLink(c.link, activeRoute)))
  const label = (
    <>
      {item.label}
      {hasChildren ? <span className="caret"> ▾</span> : null}
    </>
  )
  return (
    <li className={active ? 'active' : undefined}>
      {item.link ? (
        <a href={hrefOf(item.link)}>{label}</a>
      ) : (
        <span className="nav-no-link" role="button" tabIndex={0}>{label}</span>
      )}
      {hasChildren ? (
        <div className="dropdown">
          {item.children!.map((c) => (
            <a key={`${c.label}-${c.link}`} href={hrefOf(c.link)}>{c.label}</a>
          ))}
        </div>
      ) : null}
    </li>
  )
}

export function SiteNav({
  activeRoute = '',
  menu = [],
  settings,
}: {
  activeRoute?: string
  menu?: MenuNode[]
  settings: SiteSettings
}) {
  return (
    <header>
      <div className="container nav">
        <a className="logo" href="/"><img src={settings.logo} alt="中惠文化" /></a>
        <button className="nav-toggle" type="button" aria-label="菜单" aria-expanded="false">☰</button>
        <div className="nav-right">
          <ul className="nav-menu">
            {menu.map((m) => <NavItem key={`${m.label}-${m.link}`} item={m} activeRoute={activeRoute} />)}
          </ul>
          <div className="nav-lang">
            <a className="active" href="#">{settings.langCurrentLabel}</a>
            {settings.langOtherUrl?.trim() ? (
              <>
                <span className="sep">|</span>
                <a href={hrefOf(settings.langOtherUrl)}>{settings.langOtherLabel}</a>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}

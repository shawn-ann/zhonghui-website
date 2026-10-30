import { hrefOf } from './assets'
import type { MenuNode, SiteSettings } from '../render/types'

function NavItem({ item, activeRoute }: { item: MenuNode; activeRoute: string }) {
  const active = item.link === activeRoute
  return (
    <li>
      <a href={hrefOf(item.link)} {...(active ? { className: 'active' } : {})}>
        {item.label}
        {item.children?.length ? <span className="caret"> ▾</span> : null}
      </a>
      {item.children?.length ? (
        <div className="dropdown">
          {item.children.map((c) => (
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
            <span className="sep">|</span>
            <a href={hrefOf(settings.langOtherUrl)}>{settings.langOtherLabel}</a>
          </div>
        </div>
      </div>
    </header>
  )
}

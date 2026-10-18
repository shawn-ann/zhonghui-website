import { NAV_ITEMS, LANG_LINK, LOGO_SRC, hrefOf, type MenuItem } from './assets'

function NavItem({ item, activeRoute }: { item: MenuItem; activeRoute: string }) {
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
            <a key={c.label} href={hrefOf(c.link)}>{c.label}</a>
          ))}
        </div>
      ) : null}
    </li>
  )
}

export function SiteNav({ activeRoute = '' }: { activeRoute?: string }) {
  return (
    <header>
      <div className="container nav">
        <a className="logo" href="/"><img src={LOGO_SRC} alt="中惠文化" /></a>
        <button className="nav-toggle" type="button" aria-label="菜单" aria-expanded="false">☰</button>
        <div className="nav-right">
          <ul className="nav-menu">
            {NAV_ITEMS.map((m) => <NavItem key={m.label} item={m} activeRoute={activeRoute} />)}
          </ul>
          <div className="nav-lang">
            <a className="active" href="#">中文</a>
            <span className="sep">|</span>
            <a href={hrefOf(LANG_LINK)}>EN</a>
          </div>
        </div>
      </div>
    </header>
  )
}

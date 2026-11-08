'use client'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth, useConfig } from '@payloadcms/ui'
import { AdminIcon, type AdminIconName } from './icons'
import BuildStatusLine from './BuildStatusLine'

const SIDEBAR_KEY = 'zhonghui.admin.sidebar'

type NavItem = { label: string; path: string; icon: AdminIconName }
type NavGroup = { label: string; items: NavItem[]; collapsible?: boolean }

const GROUPS: NavGroup[] = [
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
    label: '文章管理',
    collapsible: true,
    items: [
      { label: '分类管理', path: '/collections/case-categories', icon: 'menu' },
      { label: '文章列表', path: '/collections/cases', icon: 'pages' },
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
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(['文章管理']))
  const accountRef = useRef<HTMLDivElement>(null)

  const adminRoute = config.routes.admin || '/admin'
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || '/'
  const email = user?.email || ''
  const name = (user as { name?: string } | null)?.name || '管理员'
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
    if (pathname?.includes('/collections/cases') || pathname?.includes('/case-categories')) {
      setOpenGroups((current) => new Set(current).add('文章管理'))
    }
  }, [pathname])

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!document.documentElement.classList.contains('zc-nav-open')) return
      if ((event.target as Element).closest('.zc-mobilebar__button')) return
      const sidebar = document.querySelector('.zc-sidebar')
      if (sidebar && !sidebar.contains(event.target as Node)) closeMobile()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobile()
        setAccountOpen(false)
      }
    }
    document.addEventListener('click', onDocumentClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('click', onDocumentClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

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
        // storage may be unavailable in private mode
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
      <div className="zc-brand-row">
        <Link className="zc-brand" href={`${adminRoute}/collections/pages`} onClick={closeMobile}>
          <img alt="中惠文化" className="zc-brand-logo" src="/brand/admin-logo.png" />
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
        {GROUPS.map((group) => {
          const open = !group.collapsible || openGroups.has(group.label)
          return (
            <div className={`zc-nav-group${group.collapsible ? ' is-collapsible' : ''}`} key={group.label}>
              {group.collapsible ? (
                <button
                  aria-expanded={open}
                  className="zc-nav-parent"
                  onClick={() => setOpenGroups((current) => {
                    const next = new Set(current)
                    if (next.has(group.label)) next.delete(group.label)
                    else next.add(group.label)
                    return next
                  })}
                  type="button"
                >
                  <AdminIcon name="pages" />
                  <span className="zc-nav-text">{group.label}</span>
                  <AdminIcon className="zc-nav-chevron" name={open ? 'chevronDown' : 'chevronRight'} size={14} />
                </button>
              ) : <div className="zc-nav-label">{group.label}</div>}
              {open ? (
                <div className={group.collapsible ? 'zc-nav-children' : undefined}>
                  {group.items.map((item) => {
                    const href = `${adminRoute}${item.path}`
                    const active = pathname === href || Boolean(pathname?.startsWith(`${href}/`))
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
              ) : null}
            </div>
          )
        })}
      </nav>

      <div className="zc-sidebar-foot">
        <BuildStatusLine />
        <a className="zc-foot-link" href={publicSiteUrl} rel="noreferrer" target="_blank" title="查看网站">
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

      </div>
    </div>
  )
}

import type { MenuNode, SiteConfig, SiteSettings } from '../render/types'

export const DEFAULT_SETTINGS: SiteSettings = {
  logo: '/assets/brand/logo.jpg',
  footerLogo: '/assets/brand/footer-logo.png',
  footerInfo: [
    { label: '📍 地址：', text: '北京东城区绿景馨园东区12号楼' },
    { label: '📞 电话：', text: '010-64159286' },
    { label: '✉ 邮箱：', text: 'info@zhonghui.com' },
    { label: '🌐 中文官网：', text: 'www.chinaaupairs.com' },
    { label: '🌐 英文官网：', text: 'www.aupaircn.com' },
  ],
  footerQr: [
    { label: '公众号' },
    { label: '咨询微信' },
    { label: '视频号' },
  ],
  copyright: '',
  langCurrentLabel: '中文',
  langOtherLabel: 'EN',
  langOtherUrl: '',
}

function pageRoute(page: unknown, routes?: Map<string, string>): string | undefined {
  if (!page) return undefined
  if (typeof page === 'object') {
    const raw = page as { route?: string; id?: string | number }
    return raw.route || (raw.id != null ? routes?.get(String(raw.id)) : undefined)
  }
  return routes?.get(String(page))
}

function resolveMenu(
  items: any,
  routes?: Map<string, string>,
  categoryRoutes?: Map<string, string>,
): MenuNode[] {
  if (!Array.isArray(items)) return []
  return items.flatMap((item) => {
    const type = item?.linkType || 'page'
    let link: string | undefined
    if (type === 'caseCategory') {
      const category = item?.caseCategory
      const id = category && typeof category === 'object' ? category.id : category
      link = id != null ? categoryRoutes?.get(String(id)) : undefined
    } else if (type === 'external') link = item?.externalUrl || undefined
    else link = pageRoute(item?.page, routes)

    const children = resolveMenu(item?.children, routes, categoryRoutes)
    if (!link) {
      if (!children.length) return []
      return [{ label: String(item?.label ?? ''), link: '', children }]
    }
    return [{
      label: String(item?.label ?? ''),
      link,
      children,
    }]
  })
}

export function buildSiteConfig(
  menuRaw: any,
  settingsRaw: any,
  routes?: Map<string, string>,
  categoryRoutes?: Map<string, string>,
): SiteConfig {
  const raw = settingsRaw || {}
  const contactRoute = pageRoute(raw.footerContactPage, routes)
  const settings: SiteSettings = {
    logo: raw.logo?.url || DEFAULT_SETTINGS.logo,
    footerLogo: raw.footerLogo?.url || DEFAULT_SETTINGS.footerLogo,
    footerInfo: Array.isArray(raw.footerInfo) && raw.footerInfo.length
      ? raw.footerInfo.map((i: any) => ({ label: String(i?.label ?? ''), text: String(i?.text ?? '') }))
      : DEFAULT_SETTINGS.footerInfo,
    footerQr: Array.isArray(raw.footerQr)
      ? raw.footerQr.map((q: any) => ({ label: String(q?.label ?? ''), image: q?.image?.url || undefined }))
      : DEFAULT_SETTINGS.footerQr,
    footerContact: contactRoute
      ? { label: raw.footerContactLabel || '联系我们', link: contactRoute }
      : undefined,
    copyright: typeof raw.copyright === 'string' ? raw.copyright : DEFAULT_SETTINGS.copyright,
    langCurrentLabel: raw.langCurrentLabel || DEFAULT_SETTINGS.langCurrentLabel,
    langOtherLabel: raw.langOtherLabel || DEFAULT_SETTINGS.langOtherLabel,
    langOtherUrl: typeof raw.langOtherUrl === 'string' ? raw.langOtherUrl : DEFAULT_SETTINGS.langOtherUrl,
  }
  return {
    menu: resolveMenu(menuRaw?.items, routes, categoryRoutes),
    settings,
  }
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  menu: [{ label: '首页', link: '/' }],
  settings: DEFAULT_SETTINGS,
}

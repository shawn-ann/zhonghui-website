import { safeUrl } from '../render/primitives'

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

export const FOOTER_LOGO = '/assets/brand/footer-logo.png'

export interface FooterInfo {
  label: string
  text: string
}

export const FOOTER_INFO: FooterInfo[] = [
  { label: '📍 地址：', text: '北京东城区绿景馨园东区12号楼' },
  { label: '📞 电话：', text: '010-64159286' },
  { label: '✉ 邮箱：', text: 'info@zhonghui.com' },
  { label: '🌐 中文官网：', text: 'www.chinaaupairs.com' },
  { label: '🌐 英文官网：', text: 'www.aupaircn.com' },
]

export const FOOTER_QR = ['公众号', '咨询微信', '视频号']
export const FOOTER_COPYRIGHT = 'Copyright © 2026 中惠文化　·　京ICP备XXXXXXXX号'

export function hrefOf(link?: string): string {
  return safeUrl(link) || '#'
}

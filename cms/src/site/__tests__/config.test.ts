import { describe, it, expect } from 'vitest'
import { buildSiteConfig, DEFAULT_SETTINGS } from '../config'

describe('buildSiteConfig', () => {
  it('resolves menu page relationships and skips missing pages', () => {
    const site = buildSiteConfig({
      items: [
        { label: '首页', page: { id: 1, route: '/' } },
        { label: '关于', page: 2 },
        { label: '无效', page: null },
        {
          label: '项目',
          page: { id: 3, route: '/project/' },
          children: [{ label: 'SWT', page: { id: 4, route: '/project-swt/' } }],
        },
      ],
    }, null, new Map([['2', '/about/']]))

    expect(site.menu).toEqual([
      { label: '首页', link: '/', children: [] },
      { label: '关于', link: '/about/', children: [] },
      { label: '项目', link: '/project/', children: [{ label: 'SWT', link: '/project-swt/', children: [] }] },
    ])
  })

  it('resolves case category and external menu links', () => {
    const site = buildSiteConfig({
      items: [
        { label: '学员视频', linkType: 'caseCategory', caseCategory: 7 },
        { label: '外链', linkType: 'external', externalUrl: 'https://x.test' },
        { label: '旧页面', page: { id: 1, route: '/old/' } },
      ],
    }, null, new Map(), new Map([['7', '/blog/video/']]))

    expect(site.menu.map((m) => m.link)).toEqual([
      '/blog/video/', 'https://x.test', '/old/',
    ])
  })

  it('uses settings values and defaults', () => {
    const site = buildSiteConfig({}, {
      logo: { url: '/media/logo.png' },
      footerInfo: [{ label: '电话', text: '123' }],
      footerQr: [{ label: '公众号', image: { url: '/media/qr.png' } }],
      footerContactLabel: '找到我们',
      footerContactPage: { id: 2, route: '/contact/' },
      copyright: '© Test',
      langCurrentLabel: '中文',
      langOtherLabel: 'EN',
      langOtherUrl: 'https://en.example.com/',
    })

    expect(site.settings.logo).toBe('/media/logo.png')
    expect(site.settings.footerLogo).toBe(DEFAULT_SETTINGS.footerLogo)
    expect(site.settings.footerInfo).toEqual([{ label: '电话', text: '123' }])
    expect(site.settings.footerQr[0].image).toBe('/media/qr.png')
    expect(site.settings.footerContact).toEqual({ label: '找到我们', link: '/contact/' })
    expect(site.settings.copyright).toBe('© Test')
    expect(site.settings.langOtherUrl).toBe('https://en.example.com/')
  })

  it('keeps an explicitly empty QR list and blank copyright', () => {
    const site = buildSiteConfig({}, { footerQr: [], copyright: '' })
    expect(site.settings.footerQr).toEqual([])
    expect(site.settings.copyright).toBe('')
  })

  it('falls back to defaults when globals are missing', () => {
    const site = buildSiteConfig(null, null)
    expect(site.menu).toEqual([])
    expect(site.settings.footerInfo).toEqual(DEFAULT_SETTINGS.footerInfo)
    expect(site.settings.footerContact).toBeUndefined()
  })
})

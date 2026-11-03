import { describe, expect, it } from 'vitest'
import { casePath, categoryPath, normalizeRedirects, renderRedirectHtml } from '../redirects'

describe('case redirects', () => {
  it('builds case and category paths', () => {
    expect(categoryPath('study-case')).toBe('/blog/study-case/')
    expect(casePath('study-case', 'xiaocao')).toBe('/blog/study-case/xiaocao/')
  })

  it('collapses chains and removes self redirects', () => {
    expect(normalizeRedirects([
      { from: '/blog/old/a/', to: '/blog/new/a/' },
      { from: '/blog/new/a/', to: '/blog/newer/a/' },
      { from: '/blog/self/', to: '/blog/self/' },
    ])).toEqual([
      { from: '/blog/old/a/', to: '/blog/newer/a/' },
      { from: '/blog/new/a/', to: '/blog/newer/a/' },
    ])
  })

  it('deduplicates and keeps the last target', () => {
    expect(normalizeRedirects([
      { from: '/blog/a/', to: '/blog/b/' },
      { from: '/blog/a/', to: '/blog/c/' },
    ])).toEqual([{ from: '/blog/a/', to: '/blog/c/' }])
  })

  it('renders a meta refresh page', () => {
    const html = renderRedirectHtml('/blog/study-case/xiaocao/')
    expect(html).toContain('http-equiv="refresh"')
    expect(html).toContain('/blog/study-case/xiaocao/')
    expect(html).toContain('rel="canonical"')
  })
})

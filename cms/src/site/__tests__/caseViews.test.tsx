import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CaseDetailView, CaseListView } from '../cases'
import type { PageDoc } from '../../render/types'

const render = (node: React.ReactNode) => renderToStaticMarkup(node)

const category = { id: 1, title: '案例分享', slug: 'study-case', pageSize: 12, banner: '/media/category-banner.jpg' }

const listPage = (overrides: Partial<PageDoc> = {}): PageDoc => ({
  title: '案例分享',
  route: '/blog/study-case/',
  blocks: [],
  template: {
    kind: 'caseList',
    items: [{
      id: 1, title: '小曹同学的赴美之旅', slug: 'xiaocao', categoryId: 1,
      categorySlug: 'study-case', categoryTitle: '案例分享', cover: '/media/a.jpg',
      publishedAt: '2025-07-02', body: null,
    }],
    page: 1, pageCount: 2, pageSize: 12, basePath: '/blog/study-case/',
    title: '案例分享', subtitle: '每一段旅程', banner: '/media/banner.jpg',
  },
  ...overrides,
})

const detailPage = (): PageDoc => ({
  title: '小曹同学的赴美之旅',
  route: '/blog/study-case/xiaocao/',
  blocks: [],
  template: {
    kind: 'caseDetail',
    category,
    item: {
      id: 1, title: '小曹同学的赴美之旅', slug: 'xiaocao', categoryId: 1,
      categorySlug: 'study-case', categoryTitle: '案例分享', cover: '/media/cover.jpg',
      publishedAt: '2025-07-02', body: { root: { children: [] } },
    },
  },
})

describe('case views', () => {
  it('renders a card grid with title over the cover and no date/summary', () => {
    const html = render(<CaseListView page={listPage()} />)
    expect(html).toContain('banner--split')
    expect(html).toContain('banner-pattern')
    expect(html).toContain('/assets/pattern-box-5.svg')
    expect(html).toContain('case-grid')
    expect(html).toContain('小曹同学的赴美之旅')
    expect(html).toContain('/blog/study-case/xiaocao/')
    expect(html).toContain('/media/a.jpg')
    expect(html).not.toContain('2025-07-02')
    expect(html).toContain('case-pagination')
  })

  it('renders an empty state', () => {
    const page = listPage()
    ;(page.template as any).items = []
    ;(page.template as any).pageCount = 1
    const html = render(<CaseListView page={page} />)
    expect(html).toContain('暂无案例')
    expect(html).not.toContain('case-pagination')
  })

  it('puts the category title above the card grid', () => {
    const html = render(<CaseListView page={listPage()} />)
    const title = html.indexOf('case-list-title')
    const grid = html.indexOf('case-grid')
    expect(title).toBeGreaterThan(-1)
    expect(title).toBeLessThan(grid)
    expect(html).toContain('案例分享')
  })

  it('hides the pagination when everything fits on one page', () => {
    const page = listPage()
    ;(page.template as any).pageCount = 1
    const html = render(<CaseListView page={page} />)
    expect(html).not.toContain('case-pagination')
  })

  it('renders preview pagination links that the preview link lock lets through', () => {
    const hrefForPage = (n: number) => `/preview/case-categories/7?page=${n}`
    const html = render(<CaseListView page={listPage()} hrefForPage={hrefForPage} />)
    expect(html).toContain('href="/preview/case-categories/7?page=2"')
    expect(html).toContain('data-preview-nav')
    expect(html).toContain('aria-current="page"')
  })

  it('renders the category-style banner with a decorative background and no cover in the body', () => {
    const html = render(<CaseDetailView page={detailPage()} />)
    expect(html).toContain('banner--split')
    expect(html).toContain('/media/category-banner.jpg')
    expect(html).toContain('banner-pattern')
    expect(html).toContain('中惠文化 · 真实案例分享')
    expect(html).toContain('case-detail-title')
    expect(html).toContain('2025-07-02')
    expect(html).toContain('article-body')
    expect(html).not.toContain('case-detail-cover')
    expect(html).not.toContain('case-detail-hero')
    expect(html).not.toContain('case-banner')
  })
})

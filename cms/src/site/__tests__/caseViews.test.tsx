import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CaseDetailView, CaseListView } from '../cases'
import type { PageDoc } from '../../render/types'

const render = (node: React.ReactNode) => renderToStaticMarkup(node)

const category = { id: 1, title: '案例分享', slug: 'study-case', pageSize: 12, order: 0 }

const listPage = (overrides: Partial<PageDoc> = {}): PageDoc => ({
  title: '案例分享',
  route: '/blog/',
  blocks: [],
  template: {
    kind: 'caseList',
    items: [{
      id: 1, title: '小曹同学的赴美之旅', slug: 'xiaocao', categoryId: 1,
      categorySlug: 'study-case', categoryTitle: '案例分享', cover: '/media/a.jpg',
      publishedAt: '2025-07-02', body: null,
    }],
    page: 1, pageCount: 2, pageSize: 12, basePath: '/blog/',
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

  it('renders the cover hero with title and date', () => {
    const html = render(<CaseDetailView page={detailPage()} />)
    expect(html).toContain('case-detail-hero')
    expect(html).toContain('小曹同学的赴美之旅')
    expect(html).toContain('2025-07-02')
    expect(html).toContain('article-body')
    expect(html).not.toContain('返回列表')
  })
})

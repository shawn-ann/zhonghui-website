import { describe, expect, it } from 'vitest'
import { buildCasePages, caseListPageAt, paginateCases } from '../casePages'
import type { CaseCategory, CaseItem } from '../../render/types'

const category: CaseCategory = {
  id: 1, title: '案例分享', slug: 'study-case', pageSize: 2,
}

const item = (slug: string, publishedAt: string, categorySlug = 'study-case'): CaseItem => ({
  id: slug, title: `标题 ${slug}`, slug,
  categoryId: categorySlug === 'study-case' ? 1 : 2,
  categorySlug, categoryTitle: categorySlug === 'study-case' ? '案例分享' : '学员视频',
  cover: `/media/${slug}.jpg`, publishedAt, body: { root: { children: [] } },
})

describe('paginateCases', () => {
  it('splits into pages and keeps a single empty page', () => {
    expect(paginateCases([1, 2, 3] as never[], 2)).toEqual([[1, 2], [3]])
    expect(paginateCases([], 12)).toEqual([[]])
  })
})

describe('buildCasePages', () => {
  const items = [
    item('a', '2025-07-02'),
    item('b', '2025-07-05'),
    item('c', '2025-06-30'),
  ]

  it('builds category pages without page/1 and sorted by date', () => {
    const pages = buildCasePages([category], items)
    const first = pages.find((p) => p.route === '/blog/study-case/')
    const second = pages.find((p) => p.route === '/blog/study-case/page/2/')
    expect(first?.template).toMatchObject({ kind: 'caseList', page: 1, pageCount: 2, pageSize: 2 })
    expect((first?.template as any).items.map((i: CaseItem) => i.slug)).toEqual(['b', 'a'])
    expect(second?.template).toMatchObject({ kind: 'caseList', page: 2 })
    expect(pages.find((p) => p.route === '/blog/study-case/page/1/')).toBeUndefined()
    expect(pages.find((p) => p.route === '/blog/')).toBeUndefined()
  })

  it('builds category pages and detail routes', () => {
    const pages = buildCasePages([category], items)
    expect(pages.find((p) => p.route === '/blog/study-case/')?.template).toMatchObject({ kind: 'caseList', page: 1 })
    expect(pages.find((p) => p.route === '/blog/study-case/page/2/')).toBeTruthy()
    const detail = pages.find((p) => p.route === '/blog/study-case/b/')
    expect(detail?.template).toMatchObject({ kind: 'caseDetail' })
    expect((detail?.template as any).item.title).toBe('标题 b')
  })

  it('keeps an empty category page', () => {
    const empty: CaseCategory = { ...category, id: 2, title: '学员视频', slug: 'video' }
    const pages = buildCasePages([empty], [])
    const list = pages.find((p) => p.route === '/blog/video/')
    expect(list?.template).toMatchObject({ kind: 'caseList', items: [], pageCount: 1 })
  })

  it('uses the category banner and subtitle for its list page', () => {
    const themed: CaseCategory = { ...category, banner: '/media/banner.jpg', subtitle: '真实故事' }
    const pages = buildCasePages([themed], items)
    expect(pages.find((p) => p.route === '/blog/study-case/')?.template).toMatchObject({
      banner: '/media/banner.jpg', subtitle: '真实故事',
    })
  })
})

describe('caseListPageAt', () => {
  const pages = buildCasePages([category], [
    item('a', '2025-07-02'),
    item('b', '2025-07-05'),
    item('c', '2025-06-30'),
  ])

  it('picks a list page by 1-based page number', () => {
    expect(caseListPageAt(pages, 1)?.route).toBe('/blog/study-case/')
    expect(caseListPageAt(pages, 2)?.route).toBe('/blog/study-case/page/2/')
  })

  it('clamps out-of-range and invalid page numbers', () => {
    expect(caseListPageAt(pages, 0)?.route).toBe('/blog/study-case/')
    expect(caseListPageAt(pages, 99)?.route).toBe('/blog/study-case/page/2/')
    expect(caseListPageAt(pages, Number.NaN)?.route).toBe('/blog/study-case/')
  })
})

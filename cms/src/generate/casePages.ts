import type {
  CaseCategory,
  CaseItem,
  CaseListTemplate,
  PageDoc,
} from '../render/types'

export function paginateCases<T>(items: T[], pageSize: number): T[][] {
  const size = Math.max(1, Math.trunc(pageSize) || 1)
  const pages: T[][] = []
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size))
  return pages.length ? pages : [[]]
}

function sorted(items: CaseItem[]): CaseItem[] {
  return [...items].sort((a, b) => {
    const byDate = String(b.publishedAt).localeCompare(String(a.publishedAt))
    if (byDate) return byDate
    const byCreated = String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    if (byCreated) return byCreated
    const an = Number(a.id)
    const bn = Number(b.id)
    return Number.isFinite(an) && Number.isFinite(bn)
      ? bn - an
      : String(b.id).localeCompare(String(a.id))
  })
}

function routeFor(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}page/${page}/`
}

function listPage(
  basePath: string,
  page: number,
  pageCount: number,
  pageSize: number,
  items: CaseItem[],
  title: string,
  subtitle: string | undefined,
  banner: string | undefined,
  category?: CaseCategory,
  seo?: { title?: string; description?: string },
): PageDoc {
  const template: CaseListTemplate = {
    kind: 'caseList',
    category,
    items,
    page,
    pageCount,
    pageSize,
    basePath,
    title,
    subtitle,
    banner,
  }
  return { title, route: routeFor(basePath, page), blocks: [], template, seo }
}

/**
 * 把分类与案例组合成可直接进入静态生成管线的列表/分页/详情页面。
 * 第 1 页不带 /page/1/；空分类仍生成一个空列表页。
 */
export function buildCasePages(
  categories: CaseCategory[],
  items: CaseItem[],
): PageDoc[] {
  const pages: PageDoc[] = []
  const all = sorted(items)
  const categoryById = new Map(categories.map((category) => [String(category.id), category]))
  for (const category of categories) {
    const categoryItems = all.filter((item) => String(item.categoryId) === String(category.id))
    const size = Math.max(1, Math.trunc(category.pageSize) || 12)
    const chunks = paginateCases(categoryItems, size)
    const basePath = `/blog/${category.slug}/`
    chunks.forEach((pageItems, index) => {
      pages.push(listPage(
        basePath, index + 1, chunks.length, size, pageItems,
        category.title, category.subtitle, category.banner, category,
        { title: category.seoTitle, description: category.seoDescription },
      ))
    })
  }

  for (const item of all) {
    const category = categoryById.get(String(item.categoryId))
    if (!category) continue
    pages.push({
      title: item.title,
      route: `/blog/${category.slug}/${item.slug}/`,
      blocks: [],
      template: { kind: 'caseDetail', item, category },
      seo: { title: item.seoTitle || item.title, description: item.seoDescription },
    })
  }

  return pages
}

/** 预览用：按 1 起页码取某个分类的列表页，越界或非法值夹到首/尾页。 */
export function caseListPageAt(pages: PageDoc[], requested: number): PageDoc | undefined {
  const list = pages.filter((page) => page.template?.kind === 'caseList')
  if (!list.length) return undefined
  const index = Math.min(Math.max(1, Math.trunc(requested) || 1), list.length) - 1
  return list[index]
}

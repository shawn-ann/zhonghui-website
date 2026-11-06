import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { buildCasePages, caseListPageAt } from '@/generate/casePages'
import { mapCaseCategory, mapCaseItem } from '@/generate/loadSiteData'
import { buildSiteConfig } from '@/site/config'
import type { CaseCategory } from '@/render/types'
import { SiteBody } from '@/site/SiteDocument'
import { SiteScripts } from '@/site/SiteScripts'

export const dynamic = 'force-dynamic'

async function loadPreview(id: string, requestedPage = 1) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return null
  try {
    const [rawCategory, casesRes, categoriesRes, menuRaw, settingsRaw] = await Promise.all([
      payload.findByID({ collection: 'case-categories', id, depth: 1 }),
      payload.find({
        collection: 'cases',
        where: { category: { equals: id }, _status: { equals: 'published' } },
        limit: 1000,
        depth: 1,
        sort: '-publishedAt',
      }),
      payload.find({ collection: 'case-categories', limit: 1000, depth: 0, sort: 'title' }),
      payload.findGlobal({ slug: 'menu', depth: 1 }).catch(() => null),
      payload.findGlobal({ slug: 'site-settings', depth: 1 }).catch(() => null),
    ])
    const category = mapCaseCategory(rawCategory)
    if (!category) return null
    const categories: CaseCategory[] = categoriesRes.docs
      .map(mapCaseCategory)
      .filter((c): c is CaseCategory => c !== null)
    const categoryMap = new Map(categories.map((c) => [String(c.id), c]))
    const items = casesRes.docs
      .map((raw) => mapCaseItem(raw, categoryMap))
      .filter((item): item is NonNullable<typeof item> => item !== null)
    const page = caseListPageAt(buildCasePages([category], items), requestedPage)
    if (!page) return null
    const categoryRoutes = new Map(categories.map((c) => [String(c.id), `/blog/${c.slug}/`]))
    return { page, site: buildSiteConfig(menuRaw, settingsRaw, new Map(), categoryRoutes) }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await loadPreview(id)
  return data ? { title: data.page.title } : {}
}

export default async function CategoryPreviewPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const { id } = await params
  const query = await searchParams
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page
  const requested = Number(rawPage)
  const data = await loadPreview(id, Number.isFinite(requested) ? requested : 1)
  if (!data) notFound()
  const previewBase = `/preview/case-categories/${id}`
  const hrefForPage = (page: number) => page <= 1 ? previewBase : `${previewBase}?page=${page}`
  return (
    <>
      <SiteBody page={data.page} site={data.site} caseListHref={hrefForPage} />
      <SiteScripts lockLinks />
    </>
  )
}

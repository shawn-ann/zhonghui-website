import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { mapCaseCategory, mapCaseItem } from '@/generate/loadSiteData'
import { buildSiteConfig } from '@/site/config'
import type { CaseCategory, PageDoc } from '@/render/types'
import { SiteBody } from '@/site/SiteDocument'
import { SiteScripts } from '@/site/SiteScripts'

export const dynamic = 'force-dynamic'

async function loadPreview(id: string) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return null
  try {
    const [raw, categoriesRes, menuRaw, settingsRaw] = await Promise.all([
      payload.findByID({ collection: 'cases', id, draft: true, depth: 1 }) as Promise<Record<string, any>>,
      payload.find({ collection: 'case-categories', limit: 1000, depth: 0, sort: 'title' }),
      payload.findGlobal({ slug: 'menu', depth: 1 }).catch(() => null),
      payload.findGlobal({ slug: 'site-settings', depth: 1 }).catch(() => null),
    ])
    const categories: CaseCategory[] = categoriesRes.docs
      .map(mapCaseCategory)
      .filter((category): category is CaseCategory => category !== null)
    const categoryId = raw.category && typeof raw.category === 'object' ? raw.category.id : raw.category
    const category = categories.find((c) => String(c.id) === String(categoryId))
      ?? mapCaseCategory(raw.category)
    if (!category) return null
    const categoryMap = new Map(categories.map((c) => [String(c.id), c]))
    const item = mapCaseItem(raw, categoryMap, { allowDraft: true })
    if (!item) return null
    const page: PageDoc = {
      title: item.title,
      route: `/blog/${category.slug}/${item.slug}/`,
      blocks: [],
      template: { kind: 'caseDetail', item, category },
      seo: { title: item.seoTitle || item.title, description: item.seoDescription },
    }
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

export default async function CasePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await loadPreview(id)
  if (!data) notFound()
  return (
    <>
      <SiteBody page={data.page} site={data.site} />
      <SiteScripts lockLinks />
    </>
  )
}

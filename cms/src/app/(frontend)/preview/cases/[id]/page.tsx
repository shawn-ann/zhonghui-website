import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { loadSiteData, resolveMedia } from '@/generate/loadSiteData'
import type { CaseCategory, CaseItem, PageDoc } from '@/render/types'
import { SiteBody } from '@/site/SiteDocument'
import { SiteScripts } from '@/site/SiteScripts'

export const dynamic = 'force-dynamic'

async function loadPreview(id: string) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return null
  try {
    const raw = await payload.findByID({ collection: 'cases', id, draft: true, depth: 1 }) as any
    const categoryRaw = raw.category && typeof raw.category === 'object'
      ? raw.category
      : await payload.findByID({ collection: 'case-categories', id: raw.category, depth: 0 })
    if (!categoryRaw) return null
    const category: CaseCategory = {
      id: categoryRaw.id,
      title: String(categoryRaw.title || ''),
      slug: String(categoryRaw.slug || ''),
      banner: resolveMedia(categoryRaw.banner) || undefined,
      subtitle: categoryRaw.subtitle || undefined,
      pageSize: Number(categoryRaw.pageSize) || 12,
      seoTitle: categoryRaw.seoTitle || undefined,
      seoDescription: categoryRaw.seoDescription || undefined,
    }
    const item: CaseItem = {
      id: raw.id,
      title: String(raw.title || ''),
      slug: String(raw.slug || ''),
      categoryId: category.id,
      categorySlug: category.slug,
      categoryTitle: category.title,
      cover: resolveMedia(raw.cover),
      publishedAt: String(raw.publishedAt || ''),
      createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
      body: raw.body,
      seoTitle: raw.seoTitle || undefined,
      seoDescription: raw.seoDescription || undefined,
    }
    const page: PageDoc = {
      title: item.title,
      route: `/blog/${category.slug}/${item.slug}/`,
      blocks: [],
      template: { kind: 'caseDetail', item, category },
      seo: { title: item.seoTitle || item.title, description: item.seoDescription },
    }
    const data = await loadSiteData(payload as any)
    return { page, site: data.site }
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

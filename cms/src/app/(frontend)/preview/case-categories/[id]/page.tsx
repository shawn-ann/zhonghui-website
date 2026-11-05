import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { loadSiteData } from '@/generate/loadSiteData'
import { SiteBody } from '@/site/SiteDocument'
import { SiteScripts } from '@/site/SiteScripts'

export const dynamic = 'force-dynamic'

async function loadPreview(id: string) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return null
  try {
    const category = await payload.findByID({ collection: 'case-categories', id, depth: 0 })
    const data = await loadSiteData(payload as any)
    const page = data.pages.find((p) =>
      p.template?.kind === 'caseList' && String(p.template.category?.id) === String(category.id))
    return page ? { page, site: data.site } : null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await loadPreview(id)
  return data ? { title: data.page.title } : {}
}

export default async function CategoryPreviewPage({ params }: { params: Promise<{ id: string }> }) {
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

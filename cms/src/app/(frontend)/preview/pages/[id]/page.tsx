import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { mapPageDoc, resolveMedia } from '@/generate/loadSiteData'
import { SiteBody } from '@/site/SiteDocument'
import { SiteScripts } from '@/site/SiteScripts'

export const dynamic = 'force-dynamic'

async function loadPreview(id: string) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return null
  try {
    const doc = await payload.findByID({ collection: 'pages', id, draft: true })
    const pages = await payload.find({ collection: 'pages', limit: 1000, depth: 0, draft: true })
    const routes = new Map<string, string>(
      pages.docs.map((d: any) => [String(d.id), String(d.route ?? '')]),
    )
    return { doc, routes }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data: any = await loadPreview(id)
  if (!data?.doc) return {}
  return { title: data.doc.seo?.title || data.doc.title, description: data.doc.seo?.description }
}

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data: any = await loadPreview(id)
  if (!data?.doc) notFound()

  return (
    <>
      <SiteBody page={mapPageDoc(data.doc, resolveMedia, data.routes)} />
      <SiteScripts lockLinks />
    </>
  )
}

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
    return await payload.findByID({ collection: 'pages', id, draft: true })
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doc: any = await loadPreview(id)
  if (!doc) return {}
  return { title: doc.seo?.title || doc.title, description: doc.seo?.description }
}

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doc: any = await loadPreview(id)
  if (!doc) notFound()

  return (
    <>
      <SiteBody page={mapPageDoc(doc, resolveMedia)} />
      <SiteScripts lockLinks />
    </>
  )
}

import { getPayload } from 'payload'
import config from '@payload-config'
import { renderDocument } from '@/render/document'
import { mapPageDoc, resolveMedia } from '@/generate/loadSiteData'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await params
  let doc: any
  try {
    doc = await payload.findByID({ collection: 'pages', id, draft: true })
  } catch {
    return new Response('Not found', { status: 404 })
  }
  if (!doc) return new Response('Not found', { status: 404 })

  const html = renderDocument(mapPageDoc(doc, resolveMedia), { mode: 'external' })
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}

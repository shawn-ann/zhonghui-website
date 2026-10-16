import { readFileSync } from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '@payload-config'
import { renderDocument } from '@/render/document'
import { mapPageDoc, resolveMedia } from '@/generate/loadSiteData'

// 运行目录为 cms/，用 cwd 定位资源，避免相对层级问题。
const read = (rel: string) => readFileSync(path.resolve(process.cwd(), rel), 'utf-8')
const CSS = read('src/render/styles/base.css')
const MAIN_JS = read('src/render/styles/main.js')
const SWIPER_CSS = read('src/static/swiper-bundle.min.css')
const SWIPER_JS = read('src/static/swiper-bundle.min.js')

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

  const html = renderDocument(mapPageDoc(doc, resolveMedia), {
    mode: 'inline',
    css: CSS,
    mainJs: MAIN_JS,
    swiperCss: SWIPER_CSS,
    swiperJs: SWIPER_JS,
  })
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}

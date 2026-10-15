import type { Block, PageDoc, SiteData } from '../render/types'

type MediaResolver = (media: unknown) => string

export function mapPageDoc(raw: Record<string, any>, resolveMedia: MediaResolver): PageDoc {
  const blocks: Block[] = (raw.blocks || []).map((b: Record<string, any>): Block => {
    if (b.blockType === 'text') {
      return { type: 'text', title: b.title || undefined, body: b.body, align: b.align || 'left', bg: b.bg || undefined, alt: !!b.alt }
    }
    return {
      type: 'image',
      media: resolveMedia(b.media),
      altText: b.altText || undefined,
      link: b.link || undefined,
      bg: b.bg || undefined,
      alt: !!b.alt,
    }
  })
  return {
    title: raw.title,
    route: raw.route,
    blocks,
    seo: raw.seo ? { title: raw.seo.title || undefined, description: raw.seo.description || undefined } : undefined,
  }
}

export async function loadSiteData(payload: { find: (args: any) => Promise<{ docs: any[] }> }): Promise<SiteData> {
  const res = await payload.find({
    collection: 'pages',
    where: { status: { equals: 'published' } },
    limit: 1000,
    depth: 1,
  })
  const resolveMedia = (m: unknown): string => (m && typeof m === 'object' && 'url' in (m as any) ? (m as any).url : String(m || ''))
  return { pages: res.docs.map((d) => mapPageDoc(d, resolveMedia)) }
}

import { lexicalToHtml } from '../render/richText'
import type { Block, GridCell, PageDoc, SiteData } from '../render/types'

type MediaResolver = (media: unknown) => string

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

export function mapBlock(raw: Record<string, any>, resolveMedia: MediaResolver): Block | null {
  const bg = raw.bg || undefined
  const alt = !!raw.alt
  switch (raw.blockType) {
    case 'text':
      return { type: 'text', title: raw.title || undefined, body: raw.body, align: raw.align || 'left', bg, alt }
    case 'image':
      return { type: 'image', media: resolveMedia(raw.media), altText: raw.altText || undefined, link: raw.link || undefined, bg, alt }
    case 'imageText':
      return { type: 'imageText', media: resolveMedia(raw.media), title: raw.title || undefined, desc: raw.desc || undefined, link: raw.link || undefined, bg, alt }
    case 'button':
      return { type: 'button', label: raw.label, link: raw.link || '', style: raw.style || 'primary', bg, alt }
    case 'banner':
      return {
        type: 'banner',
        variant: raw.variant || 'split',
        title: raw.title || undefined,
        sub: raw.sub || undefined,
        image: raw.image ? resolveMedia(raw.image) : undefined,
        pattern: raw.pattern ? resolveMedia(raw.pattern) : undefined,
        bg,
        alt,
      }
    case 'grid':
    case 'gridInner': {
      const cells: GridCell[] = arr<Record<string, any>>(raw.cells).map((c) => ({
        components: arr<Record<string, any>>(c.components)
          .map((child) => mapBlock(child, resolveMedia))
          .filter((x): x is Block => x !== null),
      }))
      return { type: 'grid', columns: raw.columns || 3, gap: raw.gap || 'md', cells, bg, alt }
    }
    case 'gallery':
      return {
        type: 'gallery',
        images: arr<Record<string, any>>(raw.images).map((i) => resolveMedia(i.image)).filter(Boolean),
        columns: raw.columns || 3,
        bg,
        alt,
      }
    case 'slider':
      return { type: 'slider', images: arr<Record<string, any>>(raw.images).map((i) => resolveMedia(i.image)).filter(Boolean), bg }
    case 'richtext':
      return { type: 'richtext', html: lexicalToHtml(raw.content), bg, alt }
    default:
      return null
  }
}

export function mapPageDoc(raw: Record<string, any>, resolveMedia: MediaResolver): PageDoc {
  return {
    title: raw.title,
    route: raw.route,
    blocks: arr<Record<string, any>>(raw.blocks)
      .map((b) => mapBlock(b, resolveMedia))
      .filter((x): x is Block => x !== null),
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
  const resolveMedia = (m: unknown): string => {
    if (m && typeof m === 'object' && 'url' in (m as any)) return String((m as any).url || '')
    return ''
  }
  return { pages: res.docs.map((d) => mapPageDoc(d, resolveMedia)) }
}

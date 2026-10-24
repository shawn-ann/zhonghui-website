import { lexicalToHtml } from '../render/richText'
import type { Block, PageDoc, SiteData } from '../render/types'

type MediaResolver = (media: unknown) => string
type PageRoutes = Map<string, string>

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

function resolveBlockLink(raw: Record<string, any>, routes?: PageRoutes) {
  const rel = raw.internalPage
  const relObj = rel && typeof rel === 'object' ? rel : null
  const internalPageId = relObj?.id ?? (rel != null ? rel : undefined)
  const internalRoute = relObj?.route
    ?? (internalPageId != null ? routes?.get(String(internalPageId)) : undefined)
  const linkType: 'none' | 'internal' | 'external' = raw.linkType || (raw.link ? 'external' : 'none')
  const externalUrl = raw.externalUrl || (raw.linkType ? undefined : raw.link) || undefined
  const link = linkType === 'internal'
    ? (internalRoute || undefined)
    : linkType === 'external'
      ? externalUrl
      : undefined
  return { link, linkType, internalPageId, internalRoute, externalUrl }
}

export function mapBlock(raw: Record<string, any>, resolveMedia: MediaResolver, routes?: PageRoutes): Block | null {
  const bg = raw.bg || undefined
  const alt = !!raw.alt
  switch (raw.blockType) {
    case 'heading':
      return {
        type: 'heading',
        title: String(raw.title ?? ''),
        subtitle: raw.subtitle || undefined,
        titleColor: raw.titleColor || undefined,
        subtitleColor: raw.subtitleColor || undefined,
        align: raw.align === 'left' ? 'left' : 'center',
        padding: raw.padding || undefined,
        bg,
        alt,
      }
    case 'section': {
      const children = arr<Record<string, any>>(raw.children)
        .map((c) => mapBlock(c, resolveMedia, routes))
        .filter((x): x is Block => x !== null)
      return {
        type: 'section',
        bgImage: raw.bgImage || undefined,
        bgColor: raw.bgColor || undefined,
        bgGradient: raw.bgGradient || undefined,
        bgHeight: raw.bgHeight > 0 ? Number(raw.bgHeight) : undefined,
        paddingY: raw.paddingY || 'md',
        children,
      }
    }
    case 'text':
      return {
        type: 'text',
        title: raw.title || undefined,
        body: String(raw.body ?? ''),
        titleColor: raw.titleColor || undefined,
        bodyColor: raw.bodyColor || undefined,
        align: raw.align === 'center' ? 'center' : 'left',
        padding: raw.padding || undefined,
        bg,
        alt,
      }
    case 'image':
      return { type: 'image', media: resolveMedia(raw.media), altText: raw.altText || undefined, link: raw.link || undefined, padding: raw.padding || undefined, bg, alt }
    case 'imageText':
      return {
        type: 'imageText',
        media: resolveMedia(raw.media),
        title: raw.title || undefined,
        desc: raw.desc || undefined,
        titleColor: raw.titleColor || undefined,
        descColor: raw.descColor || undefined,
        ...resolveBlockLink(raw, routes),
        padding: raw.padding || undefined,
        bg,
        alt,
      }
    case 'iconCard':
      return {
        type: 'iconCard',
        icon: resolveMedia(raw.icon),
        title: raw.title || undefined,
        desc: raw.desc || undefined,
        ...resolveBlockLink(raw, routes),
        bgImage: raw.bgImage || undefined,
        bgColor: raw.bgColor || undefined,
        iconColor: raw.iconColor || undefined,
        titleColor: raw.titleColor || undefined,
        descColor: raw.descColor || undefined,
      }
    case 'button':
      return { type: 'button', label: String(raw.label ?? ''), link: raw.link || '', style: raw.style === 'outline' ? 'outline' : 'primary', padding: raw.padding || undefined, bg, alt }
    case 'banner':
      return {
        type: 'banner',
        variant: raw.variant === 'centered' ? 'centered' : 'split',
        title: raw.title || undefined,
        sub: raw.sub || undefined,
        titleColor: raw.titleColor || undefined,
        subColor: raw.subColor || undefined,
        image: raw.image ? resolveMedia(raw.image) : undefined,
        pattern: raw.pattern ? resolveMedia(raw.pattern) : undefined,
        bg,
        alt,
      }
    case 'grid':
    case 'gridInner': {
      const children = arr<Record<string, any>>(raw.children)
        .map((child) => mapBlock(child, resolveMedia, routes))
        .filter((x): x is Block => x !== null)
      return {
        type: 'grid',
        columns: raw.columns || 3,
        gap: raw.gap === 'sm' || raw.gap === 'lg' ? raw.gap : 'md',
        bgImage: raw.bgImage || undefined,
        bgColor: raw.bgColor || undefined,
        children,
      }
    }
    case 'gallery':
      return {
        type: 'gallery',
        images: arr<Record<string, any>>(raw.images).map((i) => resolveMedia(i.image)).filter(Boolean),
        columns: raw.columns || 3,
        padding: raw.padding || undefined,
        bg,
        alt,
      }
    case 'slider':
      return { type: 'slider', images: arr<Record<string, any>>(raw.images).map((i) => resolveMedia(i.image)).filter(Boolean), bg }
    case 'richtext':
      return { type: 'richtext', html: lexicalToHtml(raw.content), padding: raw.padding || undefined, bg, alt }
    default:
      return null
  }
}

export function mapPageDoc(raw: Record<string, any>, resolveMedia: MediaResolver, routes?: PageRoutes): PageDoc {
  return {
    title: String(raw.title ?? ''),
    route: String(raw.route ?? ''),
    blocks: arr<Record<string, any>>(raw.blocks)
      .map((b) => mapBlock(b, resolveMedia, routes))
      .filter((x): x is Block => x !== null),
    seo: raw.seo ? { title: raw.seo.title || undefined, description: raw.seo.description || undefined } : undefined,
  }
}

export function resolveMedia(m: unknown): string {
  if (m && typeof m === 'object' && 'url' in (m as any)) return String((m as any).url || '')
  return ''
}

export async function loadSiteData(payload: { find: (args: any) => Promise<{ docs: any[] }> }): Promise<SiteData> {
  const res = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    limit: 1000,
    depth: 1,
  })
  const routes = new Map<string, string>(res.docs.map((d) => [String(d.id), String(d.route ?? '')]))
  return { pages: res.docs.map((d) => mapPageDoc(d, resolveMedia, routes)) }
}

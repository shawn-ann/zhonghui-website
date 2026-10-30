import { lexicalToHtml } from '../render/richText'
import type { Block, PageDoc, SiteData } from '../render/types'
import { buildSiteConfig } from '../site/config'

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
        paddingCustom: raw.paddingCustom > 0 ? Number(raw.paddingCustom) : undefined,
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
        fontSize: raw.fontSize > 0 ? Number(raw.fontSize) : undefined,
        fontWeight: ['400', '600', '700'].includes(raw.fontWeight) ? raw.fontWeight : undefined,
        maxWidth: raw.maxWidth > 0 ? Number(raw.maxWidth) : undefined,
        marginTop: raw.marginTop > 0 ? Number(raw.marginTop) : undefined,
        bg,
        alt,
      }
    case 'image':
      return {
        type: 'image',
        media: resolveMedia(raw.media),
        altText: raw.altText || undefined,
        link: raw.link || undefined,
        aspectRatio: ['auto', '1:1', '4:3', '3:4', '16:9'].includes(raw.aspectRatio) ? raw.aspectRatio : 'auto',
        fit: raw.fit === 'contain' ? 'contain' : 'cover',
        padding: raw.padding || undefined,
        bg,
        alt,
      }
    case 'imageText':
      return {
        type: 'imageText',
        media: resolveMedia(raw.media),
        title: raw.title || undefined,
        subtitle: raw.subtitle || undefined,
        subtitleColor: raw.subtitleColor || undefined,
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
        columnRatio: ['equal', 'leftNarrow', 'leftWide'].includes(raw.columnRatio) ? raw.columnRatio : 'equal',
        alignItems: ['stretch', 'start', 'center', 'end'].includes(raw.alignItems) ? raw.alignItems : 'stretch',
        bgImage: raw.bgImage || undefined,
        bgColor: raw.bgColor || undefined,
        children,
      }
    }
    case 'infoList':
      return {
        type: 'infoList',
        title: raw.title || undefined,
        titleAlign: raw.titleAlign === 'center' ? 'center' : 'left',
        items: arr<Record<string, any>>(raw.items).map((i) => ({
          label: i.label || undefined,
          desc: String(i.desc ?? ''),
        })),
        showDots: raw.showDots !== false,
      }
    case 'iconList':
      return {
        type: 'iconList',
        items: arr<Record<string, any>>(raw.items).map((i) => ({
          icon: resolveMedia(i.icon),
          title: String(i.title ?? ''),
          desc: i.desc || undefined,
        })),
        iconPosition: ['left', 'right', 'alternate'].includes(raw.iconPosition) ? raw.iconPosition : 'left',
        iconColor: raw.iconColor || undefined,
      }
    case 'stack':
      return {
        type: 'stack',
        gap: raw.gap === 'sm' || raw.gap === 'lg' ? raw.gap : 'md',
        bgImage: raw.bgImage ? resolveMedia(raw.bgImage) : undefined,
        bgColor: raw.bgColor || undefined,
        padding: raw.padding > 0 ? Number(raw.padding) : undefined,
        children: arr<Record<string, any>>(raw.children)
          .map((child) => mapBlock(child, resolveMedia, routes))
          .filter((x): x is Block => x !== null),
      }
    case 'hscroll':
      return {
        type: 'hscroll',
        timeline: raw.timeline === true,
        children: arr<Record<string, any>>(raw.children)
          .map((child) => mapBlock(child, resolveMedia, routes))
          .filter((x): x is Block => x !== null),
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
  }
}

export function resolveMedia(m: unknown): string {
  if (m && typeof m === 'object' && 'url' in (m as any)) return String((m as any).url || '')
  return ''
}

export async function loadSiteData(payload: {
  find: (args: any) => Promise<{ docs: any[] }>
  findGlobal?: (args: any) => Promise<any>
}): Promise<SiteData> {
  const res = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    limit: 1000,
    depth: 1,
  })
  const routes = new Map<string, string>(res.docs.map((d) => [String(d.id), String(d.route ?? '')]))
  let menuRaw: any = null
  let settingsRaw: any = null
  if (payload.findGlobal) {
    ;[menuRaw, settingsRaw] = await Promise.all([
      payload.findGlobal({ slug: 'menu', depth: 1 }).catch(() => null),
      payload.findGlobal({ slug: 'site-settings', depth: 1 }).catch(() => null),
    ])
  }
  return {
    pages: res.docs.map((d) => mapPageDoc(d, resolveMedia, routes)),
    site: buildSiteConfig(menuRaw, settingsRaw, routes),
  }
}

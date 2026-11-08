import { lexicalToHtml } from '../render/richText'
import { normalizeColumnRatio } from '../render/columnRatio'
import { effectiveRowColumns } from '../render/gridRows'
import type { Block, CaseCategory, CaseItem, PageDoc, SiteData } from '../render/types'
import { buildSiteConfig } from '../site/config'
import { buildCasePages } from './casePages'

type MediaResolver = (media: unknown) => string
type PageRoutes = Map<string, string>

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

function resolveBlockLink(raw: Record<string, any>, routes?: PageRoutes, caseRoutes?: PageRoutes) {
  const rel = raw.internalPage
  const relObj = rel && typeof rel === 'object' ? rel : null
  const internalPageId = relObj?.id ?? (rel != null ? rel : undefined)
  const internalRoute = relObj?.route
    ?? (internalPageId != null ? routes?.get(String(internalPageId)) : undefined)
  const caseRel = raw.caseItem
  const caseObj = caseRel && typeof caseRel === 'object' ? caseRel : null
  const caseItemId = caseObj?.id ?? (caseRel != null ? caseRel : undefined)
  const caseRoute = caseObj?.publishedPath
    ?? (caseItemId != null ? caseRoutes?.get(String(caseItemId)) : undefined)
  const linkType: 'none' | 'internal' | 'external' | 'case' = raw.linkType || (raw.link ? 'external' : 'none')
  const externalUrl = raw.externalUrl || (raw.linkType ? undefined : raw.link) || undefined
  const link = linkType === 'internal'
    ? (internalRoute || undefined)
    : linkType === 'case'
      ? (caseRoute || undefined)
      : linkType === 'external'
        ? externalUrl
        : undefined
  return { link, linkType, internalPageId, internalRoute, externalUrl, caseItemId, caseRoute }
}

export function mapBlock(raw: Record<string, any>, resolveMedia: MediaResolver, routes?: PageRoutes, caseRoutes?: PageRoutes): Block | null {
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
        .map((c) => mapBlock(c, resolveMedia, routes, caseRoutes))
        .filter((x): x is Block => x !== null)
      return {
        type: 'section',
        bgImage: raw.bgImage || undefined,
        bgColor: raw.bgColor || undefined,
        bgGradient: raw.bgGradient || undefined,
        bgHeight: raw.bgHeight > 0 ? Number(raw.bgHeight) : undefined,
        paddingY: raw.paddingY || 'md',
        paddingCustom: raw.paddingCustom > 0 ? Number(raw.paddingCustom) : undefined,
        contentGap: raw.contentGap > 0 ? Number(raw.contentGap) : undefined,
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
        ...resolveBlockLink(raw, routes, caseRoutes),
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
        imageRatio: ['auto', '1:1', '4:3', '3:4', '16:9'].includes(raw.imageRatio) ? raw.imageRatio : 'auto',
        imageFit: raw.imageFit === 'contain' ? 'contain' : raw.imageFit === 'cover' ? 'cover' : undefined,
        variant: raw.variant === 'qr' ? 'qr' : undefined,
        titleColor: raw.titleColor || undefined,
        descColor: raw.descColor || undefined,
        ...resolveBlockLink(raw, routes, caseRoutes),
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
        ...resolveBlockLink(raw, routes, caseRoutes),
        bgImage: raw.bgImage || undefined,
        bgColor: raw.bgColor || undefined,
        iconColor: raw.iconColor || undefined,
        iconFrame: raw.iconFrame === 'none' ? 'none' : undefined,
        iconSize: Number(raw.iconSize) > 0 ? Math.min(96, Math.max(16, Math.trunc(Number(raw.iconSize)))) : undefined,
        titleColor: raw.titleColor || undefined,
        descColor: raw.descColor || undefined,
        variant: raw.variant === 'compact' ? 'compact' : 'default',
      }
    case 'button':
      return { type: 'button', label: String(raw.label ?? ''), ...resolveBlockLink(raw, routes, caseRoutes), style: raw.style === 'outline' ? 'outline' : 'primary', padding: raw.padding || undefined, bg, alt }
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
        .map((child) => mapBlock(child, resolveMedia, routes, caseRoutes))
        .filter((x): x is Block => x !== null)
      return {
        type: 'grid',
        layout: raw.blockType === 'grid' && raw.layout === 'rows' ? 'rows' : 'flow',
        columns: raw.columns || 3,
        gap: raw.gap === 'sm' || raw.gap === 'lg' ? raw.gap : 'md',
        columnRatio: normalizeColumnRatio(raw.columnRatio, raw.columns || 3),
        alignItems: ['stretch', 'start', 'center', 'end'].includes(raw.alignItems) ? raw.alignItems : 'stretch',
        bgImage: raw.bgImage || undefined,
        bgColor: raw.bgColor || undefined,
        padding: raw.padding ? Math.max(0, Math.trunc(Number(raw.padding))) : undefined,
        children,
      }
    }
    case 'gridRow': {
      const columns = effectiveRowColumns(raw)
      return {
        type: 'gridRow',
        columns,
        gap: raw.gap === 'sm' || raw.gap === 'lg' ? raw.gap : 'md',
        columnRatio: normalizeColumnRatio(raw.columnRatio, columns),
        children: arr<Record<string, any>>(raw.children)
          .map((child) => mapBlock(child, resolveMedia, routes, caseRoutes))
          .filter((x): x is Block => x !== null),
      }
    }
    case 'gridCell':
      return {
        type: 'gridCell',
        children: arr<Record<string, any>>(raw.children)
          .map((child) => mapBlock(child, resolveMedia, routes, caseRoutes))
          .filter((x): x is Block => x !== null),
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
    case 'steps':
      return {
        type: 'steps',
        title: raw.title || undefined,
        start: Number.isFinite(Number(raw.start)) ? Math.max(0, Math.trunc(Number(raw.start))) : 1,
        connector: raw.connector !== false,
        steps: arr<Record<string, any>>(raw.steps).map((s) => ({
          title: String(s.title ?? ''),
          desc: s.desc || undefined,
        })),
      }
    case 'zigzag':
      return {
        type: 'zigzag',
        title: raw.title || undefined,
        showLine: raw.showLine !== false,
        items: arr<Record<string, any>>(raw.items).map((i) => ({
          icon: resolveMedia(i.icon) || undefined,
          text: String(i.text ?? ''),
          side: ['left', 'right'].includes(i.side) ? i.side : 'auto',
        })),
      }
    case 'entries':
      return {
        type: 'entries',
        title: raw.title || undefined,
        collapsible: raw.collapsible === true,
        items: arr<Record<string, any>>(raw.items).map((i) => ({
          label: String(i.label ?? ''),
          text: String(i.text ?? ''),
        })),
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
        bgImage: typeof raw.bgImage === 'string' ? raw.bgImage : raw.bgImage ? resolveMedia(raw.bgImage) : undefined,
        bgColor: raw.bgColor || undefined,
        padding: raw.padding > 0 ? Number(raw.padding) : undefined,
        children: arr<Record<string, any>>(raw.children)
          .map((child) => mapBlock(child, resolveMedia, routes, caseRoutes))
          .filter((x): x is Block => x !== null),
      }
    case 'hscroll':
      return {
        type: 'hscroll',
        timeline: raw.timeline === true,
        children: arr<Record<string, any>>(raw.children)
          .map((child) => mapBlock(child, resolveMedia, routes, caseRoutes))
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
      return { type: 'richtext', html: lexicalToHtml(raw.content), content: raw.content || undefined, padding: raw.padding || undefined, bg, alt }
    default:
      return null
  }
}

export function mapPageDoc(raw: Record<string, any>, resolveMedia: MediaResolver, routes?: PageRoutes, caseRoutes?: PageRoutes): PageDoc {
  return {
    title: String(raw.title ?? ''),
    route: String(raw.route ?? ''),
    blocks: arr<Record<string, any>>(raw.blocks)
      .map((b) => mapBlock(b, resolveMedia, routes, caseRoutes))
      .filter((x): x is Block => x !== null),
  }
}

export function resolveMedia(m: unknown): string {
  if (m && typeof m === 'object' && 'url' in (m as any)) return String((m as any).url || '')
  return ''
}

export function mapCaseCategory(raw: Record<string, any>): CaseCategory | null {
  const slug = String(raw?.slug ?? '').trim()
  const title = String(raw?.title ?? '').trim()
  if (!slug || !title) return null
  return {
    id: raw.id,
    title,
    slug,
    banner: resolveMedia(raw.banner) || undefined,
    subtitle: raw.subtitle || undefined,
    pageSize: Math.max(1, Math.trunc(Number(raw.pageSize) || 12)),
    seoTitle: raw.seoTitle || undefined,
    seoDescription: raw.seoDescription || undefined,
  }
}

export function mapCaseItem(
  raw: Record<string, any>,
  categories: Map<string, CaseCategory>,
  options: { allowDraft?: boolean } = {},
): CaseItem | null {
  if (!options.allowDraft && raw?._status && raw._status !== 'published') return null
  const slug = String(raw?.slug ?? '').trim()
  const title = String(raw?.title ?? '').trim()
  const categoryId = raw?.category && typeof raw.category === 'object' ? raw.category.id : raw?.category
  const category = categoryId != null ? categories.get(String(categoryId)) : undefined
  if (!slug || !title || !category) return null
  return {
    id: raw.id,
    title,
    slug,
    categoryId: category.id,
    categorySlug: category.slug,
    categoryTitle: category.title,
    cover: resolveMedia(raw.cover),
    publishedAt: String(raw.publishedAt ?? ''),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    body: raw.body ?? null,
    seoTitle: raw.seoTitle || undefined,
    seoDescription: raw.seoDescription || undefined,
  }
}

export async function loadSiteData(payload: {
  find: (args: any) => Promise<{ docs: any[] }>
  findGlobal?: (args: any) => Promise<any>
}): Promise<SiteData> {
  const [res, categoryRes, caseRes, redirectRes] = await Promise.all([
    payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      depth: 1,
    }),
    payload.find({ collection: 'case-categories', limit: 1000, depth: 1, sort: 'title' }).catch(() => ({ docs: [] })),
    payload.find({
      collection: 'cases',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      depth: 1,
    }).catch(() => ({ docs: [] })),
    payload.find({ collection: 'case-redirects', limit: 1000, depth: 0 }).catch(() => ({ docs: [] })),
  ])
  const routes = new Map<string, string>(res.docs.map((d) => [String(d.id), String(d.route ?? '')]))
  const categories = categoryRes.docs.map(mapCaseCategory).filter((x): x is CaseCategory => x !== null)
  const categoryById = new Map(categories.map((category) => [String(category.id), category]))
  const cases = caseRes.docs
    .map((raw) => mapCaseItem(raw, categoryById))
    .filter((x): x is CaseItem => x !== null)
  let menuRaw: any = null
  let settingsRaw: any = null
  if (payload.findGlobal) {
    ;[menuRaw, settingsRaw] = await Promise.all([
      payload.findGlobal({ slug: 'menu', depth: 1 }).catch(() => null),
      payload.findGlobal({ slug: 'site-settings', depth: 1 }).catch(() => null),
    ])
  }
  const caseRoutes = new Map(
    cases.map((item) => [String(item.id), `/blog/${item.categorySlug}/${item.slug}/`]),
  )
  const casePages = buildCasePages(categories, cases)
  const categoryRoutes = new Map(categories.map((category) => [String(category.id), `/blog/${category.slug}/`]))
  const redirects = redirectRes.docs
    .map((raw) => ({ from: String(raw?.from ?? '').trim(), to: String(raw?.to ?? '').trim() }))
    .filter((r) => r.from && r.to)
  return {
    pages: [...res.docs.map((d) => mapPageDoc(d, resolveMedia, routes, caseRoutes)), ...casePages],
    site: buildSiteConfig(menuRaw, settingsRaw, routes, categoryRoutes),
    redirects,
  }
}

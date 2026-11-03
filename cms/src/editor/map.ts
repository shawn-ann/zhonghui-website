import { mapBlock, resolveMedia } from '../generate/loadSiteData'
import type { EditorDoc, Block } from './types'
import { newId } from './state'

function withIds(rawBlock: any, mapped: Block): Block {
  const id = rawBlock?.id != null ? String(rawBlock.id) : newId()
  const b = { ...mapped, _id: id, _raw: rawBlock }
  if ((b.type === 'section' || b.type === 'grid' || b.type === 'gridRow' || b.type === 'gridCell' || b.type === 'hscroll' || b.type === 'stack') && Array.isArray(rawBlock?.children) && Array.isArray((b as any).children)) {
    ;(b as any).children = (b as any).children.map((child: Block, i: number) =>
      withIds(rawBlock.children[i], child),
    )
  }
  return b
}

export function docToEditorDoc(raw: any): EditorDoc {
  const rawBlocks = Array.isArray(raw?.blocks) ? raw.blocks : []
  const blocks: Block[] = rawBlocks.map((rb: any) => {
    const mapped = mapBlock(rb, resolveMedia)
    if (mapped) return withIds(rb, mapped)
    // Unknown/unmapped block types are kept as a passthrough so a save does not delete them.
    return { type: '_unknown', _id: rb?.id != null ? String(rb.id) : newId(), _raw: rb } as unknown as Block
  })
  return {
    id: raw.id,
    title: raw.title,
    route: raw.route,
    blocks,
    _status: raw._status,
  }
}

type MediaId = number | string

function resolveMediaId(value: unknown, urlToId: Map<string, MediaId>, fallback?: unknown): MediaId | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    if (/^\d+$/.test(value)) return Number(value)
    const id = urlToId.get(value)
    if (id != null) return id
    // A non-empty url that is not in the map: fall back to the raw value so an
    // unresolved/new upload is never silently dropped.
    return fallback != null ? resolveMediaId(fallback, urlToId) : null
  }
  if (typeof value === 'object' && 'id' in (value as any)) return (value as any).id
  return null
}

function writeLink(out: any, b: Block) {
  const link = b as {
    link?: string
    linkType?: 'none' | 'internal' | 'external'
    internalPageId?: string | number
    externalUrl?: string
  }
  if (link.linkType !== undefined) {
    out.linkType = link.linkType
    out.internalPage = link.internalPageId ?? null
    out.externalUrl = link.externalUrl ?? null
    out.link = null
  } else if (link.link !== undefined) {
    out.link = link.link
  }
}

function serializeBlock(b: Block, urlToId: Map<string, MediaId>): any {
  const raw = (b as any)._raw
  if ((b as { type: string }).type === '_unknown') return raw
  const out: any = { blockType: raw?.blockType ?? b.type, id: b._id }
  if (b.bg !== undefined) out.bg = b.bg
  if (b.alt !== undefined) out.alt = b.alt

  switch (b.type) {
    case 'heading':
      out.title = b.title
      if (b.subtitle !== undefined) out.subtitle = b.subtitle
      if (b.titleColor !== undefined) out.titleColor = b.titleColor
      if (b.subtitleColor !== undefined) out.subtitleColor = b.subtitleColor
      out.align = b.align ?? 'center'
      if ((b as any).padding > 0) out.padding = (b as any).padding
      break
    case 'banner':
      out.variant = b.variant
      if (b.title !== undefined) out.title = b.title
      if (b.sub !== undefined) out.sub = b.sub
      if (b.titleColor !== undefined) out.titleColor = b.titleColor
      if (b.subColor !== undefined) out.subColor = b.subColor
      out.image = resolveMediaId(b.image, urlToId, raw?.image)
      out.pattern = resolveMediaId(b.pattern, urlToId, raw?.pattern)
      break
    case 'text':
      if (b.title !== undefined) out.title = b.title
      out.body = b.body
      if (b.titleColor !== undefined) out.titleColor = b.titleColor
      if (b.bodyColor !== undefined) out.bodyColor = b.bodyColor
      out.align = b.align ?? 'left'
      if (b.fontSize !== undefined) out.fontSize = b.fontSize
      if (b.fontWeight !== undefined) out.fontWeight = b.fontWeight
      if (b.maxWidth !== undefined) out.maxWidth = b.maxWidth
      if (b.marginTop !== undefined) out.marginTop = b.marginTop
      if (b.padding && b.padding > 0) out.padding = b.padding
      break
    case 'image':
      out.media = resolveMediaId(b.media, urlToId, raw?.media)
      if (b.altText !== undefined) out.altText = b.altText
      writeLink(out, b)
      if (b.aspectRatio !== undefined) out.aspectRatio = b.aspectRatio
      if (b.fit !== undefined) out.fit = b.fit
      if (b.padding && b.padding > 0) out.padding = b.padding
      break
    case 'imageText':
      out.media = resolveMediaId(b.media, urlToId, raw?.media)
      if (b.title !== undefined) out.title = b.title
      if (b.subtitle !== undefined) out.subtitle = b.subtitle
      if (b.subtitleColor !== undefined) out.subtitleColor = b.subtitleColor
      if (b.desc !== undefined) out.desc = b.desc
      if (b.imageRatio !== undefined) out.imageRatio = b.imageRatio
      if (b.imageFit !== undefined) out.imageFit = b.imageFit
      if (b.variant !== undefined) out.variant = b.variant
      if (b.titleColor !== undefined) out.titleColor = b.titleColor
      if (b.descColor !== undefined) out.descColor = b.descColor
      writeLink(out, b)
      if (b.padding && b.padding > 0) out.padding = b.padding
      break
    case 'iconCard':
      out.icon = resolveMediaId(b.icon, urlToId, raw?.icon)
      if (b.title !== undefined) out.title = b.title
      if (b.desc !== undefined) out.desc = b.desc
      if (b.titleColor !== undefined) out.titleColor = b.titleColor
      if (b.descColor !== undefined) out.descColor = b.descColor
      writeLink(out, b)
      if (b.bgImage !== undefined) out.bgImage = b.bgImage
      if (b.bgColor !== undefined) out.bgColor = b.bgColor
      if (b.iconColor !== undefined) out.iconColor = b.iconColor
      if (b.iconFrame !== undefined) out.iconFrame = b.iconFrame
      if (b.iconSize !== undefined) out.iconSize = b.iconSize
      if (b.variant !== undefined) out.variant = b.variant
      break
    case 'button':
      out.label = b.label
      writeLink(out, b)
      if (b.style !== undefined) out.style = b.style
      if (b.padding && b.padding > 0) out.padding = b.padding
      break
    case 'richtext':
      out.content = b.content ?? raw?.content ?? null
      if (b.padding && b.padding > 0) out.padding = b.padding
      break
    case 'section':
      out.paddingY = b.paddingY || 'md'
      if (b.paddingCustom !== undefined) out.paddingCustom = b.paddingCustom
      if (b.contentGap !== undefined) out.contentGap = b.contentGap
      if (b.bgImage !== undefined) out.bgImage = b.bgImage
      if (b.bgColor !== undefined) out.bgColor = b.bgColor
      if (b.bgGradient !== undefined) out.bgGradient = b.bgGradient
      if (b.bgHeight !== undefined) out.bgHeight = b.bgHeight
      out.children = editorToPayloadBlocks(b.children || [], urlToId)
      break
    case 'grid':
      out.columns = b.columns
      out.layout = b.layout === 'rows' ? 'rows' : 'flow'
      if (b.gap !== undefined) out.gap = b.gap
      if (b.columnRatio !== undefined) out.columnRatio = b.columnRatio
      if (b.alignItems !== undefined) out.alignItems = b.alignItems
      if (b.bgImage !== undefined) out.bgImage = b.bgImage
      if (b.bgColor !== undefined) out.bgColor = b.bgColor
      out.children = editorToPayloadBlocks(b.children || [], urlToId)
      break
    case 'gridRow':
      out.columns = b.columns
      if (b.gap !== undefined) out.gap = b.gap
      if (b.columnRatio !== undefined) out.columnRatio = b.columnRatio
      out.children = editorToPayloadBlocks(b.children || [], urlToId)
      break
    case 'gridCell':
      out.children = editorToPayloadBlocks(b.children || [], urlToId)
      break
    case 'infoList':
      if (b.title !== undefined) out.title = b.title
      out.titleAlign = b.titleAlign || 'left'
      out.items = (b.items || []).map((i) => ({ label: i.label || '', desc: i.desc || '' }))
      out.showDots = b.showDots !== false
      break
    case 'iconList':
      out.items = (b.items || []).map((i, index) => ({
        icon: resolveMediaId(i.icon, urlToId, raw?.items?.[index]?.icon),
        title: i.title,
        desc: i.desc || '',
      })).filter((i) => i.icon != null)
      out.iconPosition = b.iconPosition || 'left'
      if (b.iconColor !== undefined) out.iconColor = b.iconColor
      break
    case 'hscroll':
      out.timeline = b.timeline === true
      out.children = editorToPayloadBlocks(b.children || [], urlToId)
      break
    case 'stack':
      out.gap = b.gap || 'md'
      if (b.bgImage !== undefined) out.bgImage = resolveMediaId(b.bgImage, urlToId, raw?.bgImage)
      if (b.bgColor !== undefined) out.bgColor = b.bgColor
      if (b.padding !== undefined) out.padding = b.padding
      out.children = editorToPayloadBlocks(b.children || [], urlToId)
      break
    case 'gallery': {
      const rawImages = Array.isArray(raw?.images) ? raw.images : []
      out.images = (b.images || [])
        .map((url, i) => ({ image: resolveMediaId(url, urlToId, rawImages[i]?.image) }))
        .filter((i) => i.image != null)
      if (b.columns !== undefined) out.columns = b.columns
      if (b.padding && b.padding > 0) out.padding = b.padding
      break
    }
    case 'slider': {
      const rawImages = Array.isArray(raw?.images) ? raw.images : []
      out.images = (b.images || [])
        .map((url, i) => ({ image: resolveMediaId(url, urlToId, rawImages[i]?.image) }))
        .filter((i) => i.image != null)
      break
    }
  }
  return out
}

export function editorToPayloadBlocks(blocks: Block[], urlToId: Map<string, MediaId>): any[] {
  return (blocks || []).map((b) => serializeBlock(b, urlToId))
}

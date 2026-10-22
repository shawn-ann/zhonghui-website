import { mapBlock, resolveMedia } from '../generate/loadSiteData'
import type { EditorDoc, Block } from './types'
import { newId } from './state'

function withIds(rawBlock: any, mapped: Block): Block {
  const id = rawBlock?.id != null ? String(rawBlock.id) : newId()
  const b = { ...mapped, _id: id, _raw: rawBlock }
  if (b.type === 'section' && Array.isArray(rawBlock?.children) && Array.isArray((b as any).children)) {
    ;(b as any).children = (b as any).children.map((child: Block, i: number) =>
      withIds(rawBlock.children[i], child),
    )
  }
  if (b.type === 'grid' && Array.isArray(rawBlock?.children) && Array.isArray((b as any).children)) {
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
    seo: raw.seo,
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
      if (b.padding && b.padding > 0) out.padding = b.padding
      break
    case 'image':
      out.media = resolveMediaId(b.media, urlToId, raw?.media)
      if (b.altText !== undefined) out.altText = b.altText
      if (b.link !== undefined) out.link = b.link
      if (b.padding && b.padding > 0) out.padding = b.padding
      break
    case 'imageText':
      out.media = resolveMediaId(b.media, urlToId, raw?.media)
      if (b.title !== undefined) out.title = b.title
      if (b.desc !== undefined) out.desc = b.desc
      if (b.titleColor !== undefined) out.titleColor = b.titleColor
      if (b.descColor !== undefined) out.descColor = b.descColor
      if (b.link !== undefined) out.link = b.link
      if (b.padding && b.padding > 0) out.padding = b.padding
      break
    case 'iconCard':
      out.icon = resolveMediaId(b.icon, urlToId, raw?.icon)
      if (b.title !== undefined) out.title = b.title
      if (b.desc !== undefined) out.desc = b.desc
      if (b.titleColor !== undefined) out.titleColor = b.titleColor
      if (b.descColor !== undefined) out.descColor = b.descColor
      if (b.link !== undefined) out.link = b.link
      if (b.bgImage !== undefined) out.bgImage = b.bgImage
      if (b.bgColor !== undefined) out.bgColor = b.bgColor
      if (b.iconColor !== undefined) out.iconColor = b.iconColor
      break
    case 'button':
      out.label = b.label
      out.link = b.link
      if (b.style !== undefined) out.style = b.style
      if (b.padding && b.padding > 0) out.padding = b.padding
      break
    case 'richtext':
      out.content = raw?.content ?? null
      if (b.padding && b.padding > 0) out.padding = b.padding
      break
    case 'section':
      out.paddingY = b.paddingY || 'md'
      if (b.bgImage !== undefined) out.bgImage = b.bgImage
      if (b.bgColor !== undefined) out.bgColor = b.bgColor
      if (b.bgGradient !== undefined) out.bgGradient = b.bgGradient
      if (b.bgHeight !== undefined) out.bgHeight = b.bgHeight
      out.children = editorToPayloadBlocks(b.children || [], urlToId)
      break
    case 'grid':
      out.columns = b.columns
      if (b.gap !== undefined) out.gap = b.gap
      if (b.bgImage !== undefined) out.bgImage = b.bgImage
      if (b.bgColor !== undefined) out.bgColor = b.bgColor
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

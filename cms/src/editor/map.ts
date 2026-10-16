import { mapBlock, resolveMedia } from '../generate/loadSiteData'
import type { EditorDoc, Block } from './types'
import { newId } from './state'

function withIds(rawBlock: any, mapped: Block): Block {
  const id = rawBlock?.id != null ? String(rawBlock.id) : newId()
  const b = { ...mapped, _id: id, _raw: rawBlock }
  if (b.type === 'grid' && Array.isArray(rawBlock?.cells) && Array.isArray((b as any).cells)) {
    ;(b as any).cells = (b as any).cells.map((cell: any, ci: number) => {
      const rawCell = rawBlock.cells[ci]
      return {
        ...cell,
        components: (cell.components || []).map((comp: Block, i: number) =>
          withIds(rawCell?.components?.[i], comp),
        ),
      }
    })
  }
  return b
}

export function docToEditorDoc(raw: any): EditorDoc {
  const rawBlocks = Array.isArray(raw?.blocks) ? raw.blocks : []
  const blocks: Block[] = rawBlocks
    .map((rb: any) => {
      const mapped = mapBlock(rb, resolveMedia)
      return mapped ? withIds(rb, mapped) : null
    })
    .filter((x: Block | null): x is Block => x !== null)
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

function resolveMediaId(value: unknown, urlToId: Map<string, MediaId>): MediaId | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    if (/^\d+$/.test(value)) return Number(value)
    return urlToId.get(value) ?? null
  }
  if (typeof value === 'object' && 'id' in (value as any)) return (value as any).id
  return null
}

function serializeBlock(b: Block, urlToId: Map<string, MediaId>): any {
  const raw = (b as any)._raw
  const out: any = { blockType: raw?.blockType ?? b.type, id: b._id }
  if (b.bg !== undefined) out.bg = b.bg
  if (b.alt !== undefined) out.alt = b.alt

  switch (b.type) {
    case 'banner':
      out.variant = b.variant
      if (b.title !== undefined) out.title = b.title
      if (b.sub !== undefined) out.sub = b.sub
      out.image = resolveMediaId(b.image, urlToId)
      out.pattern = resolveMediaId(b.pattern, urlToId)
      break
    case 'text':
      if (b.title !== undefined) out.title = b.title
      out.body = b.body
      out.align = b.align ?? 'left'
      break
    case 'image':
      out.media = resolveMediaId(b.media, urlToId)
      if (b.altText !== undefined) out.altText = b.altText
      if (b.link !== undefined) out.link = b.link
      break
    case 'imageText':
      out.media = resolveMediaId(b.media, urlToId)
      if (b.title !== undefined) out.title = b.title
      if (b.desc !== undefined) out.desc = b.desc
      if (b.link !== undefined) out.link = b.link
      break
    case 'button':
      out.label = b.label
      out.link = b.link
      if (b.style !== undefined) out.style = b.style
      break
    case 'richtext':
      out.content = raw?.content ?? null
      break
    case 'grid':
      out.columns = b.columns
      if (b.gap !== undefined) out.gap = b.gap
      out.cells = (b.cells || []).map((c) => ({
        components: editorToPayloadBlocks(c.components || [], urlToId),
      }))
      break
    case 'gallery':
      out.images = (b.images || [])
        .map((url) => ({ image: resolveMediaId(url, urlToId) }))
        .filter((i) => i.image != null)
      if (b.columns !== undefined) out.columns = b.columns
      break
    case 'slider':
      out.images = (b.images || [])
        .map((url) => ({ image: resolveMediaId(url, urlToId) }))
        .filter((i) => i.image != null)
      break
  }
  return out
}

export function editorToPayloadBlocks(blocks: Block[], urlToId: Map<string, MediaId>): any[] {
  return (blocks || []).map((b) => serializeBlock(b, urlToId))
}

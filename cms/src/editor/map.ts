import { mapBlock, resolveMedia } from '../generate/loadSiteData'
import type { EditorDoc, Block } from './types'
import { newId } from './state'

function withIds(rawBlock: any, mapped: Block): Block {
  const id = rawBlock?.id != null ? String(rawBlock.id) : newId()
  const b = { ...mapped, _id: id }
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

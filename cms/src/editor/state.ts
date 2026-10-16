import type { Block } from './types'

let seq = 0
export const newId = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`

export function ensureIds(blocks: Block[]): Block[] {
  return blocks.map((b) => (b._id ? b : { ...b, _id: newId() }))
}
export function addBlock(blocks: Block[], block: Block, index = blocks.length): Block[] {
  const next = blocks.slice()
  next.splice(index, 0, { ...block, _id: block._id ?? newId() })
  return next
}
export function moveBlock(blocks: Block[], from: number, to: number): Block[] {
  if (from < 0 || from >= blocks.length) return blocks.slice()
  const next = blocks.slice()
  const [item] = next.splice(from, 1)
  const target = Math.max(0, Math.min(to, blocks.length - 1))
  next.splice(target, 0, item)
  return next
}
export function removeBlock(blocks: Block[], index: number): Block[] {
  if (index < 0 || index >= blocks.length) return blocks.slice()
  return blocks.filter((_, i) => i !== index)
}
export function updateBlockField(blocks: Block[], index: number, key: string, value: unknown): Block[] {
  if (index < 0 || index >= blocks.length) return blocks.slice()
  const next = blocks.slice()
  next[index] = { ...next[index], [key]: value } as Block
  return next
}

/**
 * Path into a block tree, expressed as a flat list of indices navigated in a
 * type-aware way:
 * - root:      [i]              → top-level block i
 * - section:   [i, j, ...]      → section i's child j (then recurse on the child)
 * - grid:      [i, c, k, ...]   → grid i's cell c's component k (then recurse)
 */
export type Path = number[]

function insertAt(list: Block[], block: Block, index?: number): Block[] {
  const next = list.slice()
  const at = index == null ? next.length : Math.max(0, Math.min(index, next.length))
  next.splice(at, 0, block)
  return next
}

function removeAt(list: Block[], index: number): Block[] {
  if (index < 0 || index >= list.length) return list.slice()
  return list.filter((_, i) => i !== index)
}

export function findPath(blocks: Block[], id: string): Path | null {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    if (b._id === id) return [i]
    if (b.type === 'section') {
      const sub = findPath(b.children || [], id)
      if (sub) return [i, ...sub]
    }
    if (b.type === 'grid') {
      const cells = b.cells || []
      for (let c = 0; c < cells.length; c++) {
        const sub = findPath(cells[c].components || [], id)
        if (sub) return [i, c, ...sub]
      }
    }
  }
  return null
}

export function getAtPath(blocks: Block[], path: Path): Block | undefined {
  if (!path.length) return undefined
  let block: Block | undefined = blocks[path[0]]
  let rest = path.slice(1)
  while (block && rest.length) {
    if (block.type === 'section') {
      block = (block.children || [])[rest[0]]
      rest = rest.slice(1)
    } else if (block.type === 'grid') {
      const cell: { components?: Block[] } | undefined = (block.cells || [])[rest[0]]
      block = cell?.components?.[rest[1]]
      rest = rest.slice(2)
    } else {
      return undefined
    }
  }
  return rest.length ? undefined : block
}

export function updateAtPath(blocks: Block[], path: Path, newBlock: Block): Block[] {
  const [i, ...rest] = path
  if (i == null || i < 0 || i >= blocks.length) return blocks
  const cur = blocks[i]
  const next = blocks.slice()
  if (!rest.length) {
    next[i] = newBlock
    return next
  }
  if (cur.type === 'section') {
    next[i] = { ...cur, children: updateAtPath(cur.children || [], rest, newBlock) }
    return next
  }
  if (cur.type === 'grid') {
    const [c, ...rest2] = rest
    const cells = (cur.cells || []).slice()
    if (c == null || c < 0 || c >= cells.length) return blocks
    const cell = cells[c]
    cells[c] = { ...cell, components: updateAtPath(cell.components || [], rest2, newBlock) }
    next[i] = { ...cur, cells }
    return next
  }
  return blocks
}

export function removeAtPath(blocks: Block[], path: Path): Block[] {
  const [i, ...rest] = path
  if (i == null || i < 0 || i >= blocks.length) return blocks
  if (!rest.length) return removeAt(blocks, i)
  const cur = blocks[i]
  const next = blocks.slice()
  if (cur.type === 'section') {
    next[i] = { ...cur, children: removeAtPath(cur.children || [], rest) }
    return next
  }
  if (cur.type === 'grid') {
    const [c, ...rest2] = rest
    const cells = (cur.cells || []).slice()
    if (c == null || c < 0 || c >= cells.length) return blocks
    const cell = cells[c]
    cells[c] = { ...cell, components: removeAtPath(cell.components || [], rest2) }
    next[i] = { ...cur, cells }
    return next
  }
  return blocks
}

/**
 * Insert a block into the container identified by `parentPath` (path to the
 * parent block; [] means top level). Section children go to `children`, grid
 * children go to the first cell's `components`.
 */
export function insertInto(blocks: Block[], parentPath: Path, block: Block, index?: number): Block[] {
  const withId = { ...block, _id: block._id ?? newId() }
  if (!parentPath.length) return insertAt(blocks, withId, index)
  const parent = getAtPath(blocks, parentPath)
  if (!parent) return blocks
  if (parent.type === 'section') {
    return updateAtPath(blocks, parentPath, {
      ...parent,
      children: insertAt(parent.children || [], withId, index),
    })
  }
  if (parent.type === 'grid') {
    const cells = (parent.cells || []).slice()
    if (!cells.length) cells.push({ components: [] })
    const cell0 = cells[0]
    cells[0] = { ...cell0, components: insertAt(cell0.components || [], withId, index) }
    return updateAtPath(blocks, parentPath, { ...parent, cells })
  }
  return blocks
}

export function moveChild(list: Block[], from: number, dir: -1 | 1): Block[] {
  const to = from + dir
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return list.slice()
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function blockChildren(block: Block): Block[] {
  if (block.type === 'section') return block.children || []
  if (block.type === 'grid') return block.cells?.[0]?.components || []
  return []
}

export function withChildren(block: Block, children: Block[]): Block {
  if (block.type === 'section') return { ...block, children }
  if (block.type === 'grid') {
    const cells = (block.cells || []).slice()
    if (!cells.length) cells.push({ components: [] })
    cells[0] = { ...cells[0], components: children }
    return { ...block, cells }
  }
  return block
}

export function childPath(parentPath: Path, parent: Block, index: number): Path {
  const base = parent.type === 'grid' ? [...parentPath, 0] : parentPath
  return [...base, index]
}

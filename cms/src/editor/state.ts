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
  const next = blocks.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
export function removeBlock(blocks: Block[], index: number): Block[] {
  return blocks.filter((_, i) => i !== index)
}
export function updateBlockField(blocks: Block[], index: number, key: string, value: unknown): Block[] {
  const next = blocks.slice()
  next[index] = { ...next[index], [key]: value } as Block
  return next
}

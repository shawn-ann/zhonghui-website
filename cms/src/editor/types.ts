import type { Block } from '../render/types'
export type { Block }
export interface EditorDoc {
  id: number | string
  title: string
  route: string
  blocks: Block[]
  _status?: 'draft' | 'published'
}

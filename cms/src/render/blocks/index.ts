import type { Block } from '../types'
import { renderText } from './text'
import { renderImage } from './image'

export type Renderer = (b: Block) => string

export const renderers: Record<string, Renderer> = {
  text: (b) => renderText(b as Parameters<typeof renderText>[0]),
  image: (b) => renderImage(b as Parameters<typeof renderImage>[0]),
}

export function renderBlock(block: Block): string {
  const fn = renderers[block.type]
  return fn ? fn(block) : ''
}

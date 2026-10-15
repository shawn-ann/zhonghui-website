import type { Block } from '../types'
import { renderText } from './text'
import { renderImage } from './image'
import { renderImageText } from './imageText'
import { renderButton } from './button'

export type Renderer = (b: Block) => string

export const renderers: Record<string, Renderer> = {
  text: (b) => renderText(b as Parameters<typeof renderText>[0]),
  image: (b) => renderImage(b as Parameters<typeof renderImage>[0]),
  imageText: (b) => renderImageText(b as Parameters<typeof renderImageText>[0]),
  button: (b) => renderButton(b as Parameters<typeof renderButton>[0]),
}

export function renderBlock(block: Block): string {
  const fn = renderers[block.type]
  return fn ? fn(block) : ''
}

import type { Block } from '../types'
import { renderText } from './text'
import { renderImage } from './image'
import { renderImageText } from './imageText'
import { renderButton } from './button'
import { renderBanner } from './banner'
import { renderGrid } from './grid'
import { renderGallery } from './gallery'
import { renderSlider } from './slider'
import { renderRichText } from './richText'

export type Renderer = (b: Block) => string

export const renderers: Record<Block['type'], Renderer> = {
  text: (b) => renderText(b as never),
  image: (b) => renderImage(b as never),
  imageText: (b) => renderImageText(b as never),
  button: (b) => renderButton(b as never),
  banner: (b) => renderBanner(b as never),
  grid: (b) => renderGrid(b as never),
  gallery: (b) => renderGallery(b as never),
  slider: (b) => renderSlider(b as never),
  richtext: (b) => renderRichText(b as never),
}

export function renderBlock(block: Block): string {
  const fn = renderers[block.type]
  return fn ? fn(block) : ''
}

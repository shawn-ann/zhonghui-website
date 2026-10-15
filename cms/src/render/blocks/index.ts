import type { Block } from '../types'
import { renderText } from './text'
import { renderImage } from './image'
import { renderImageText } from './imageText'
import { renderButton } from './button'
import { renderBanner } from './banner'
import { renderGallery } from './gallery'
import { renderSlider } from './slider'
import { renderRichText } from './richText'

export type Renderer = (b: Block) => string

export const renderers: Record<string, Renderer> = {
  text: (b) => renderText(b as Parameters<typeof renderText>[0]),
  image: (b) => renderImage(b as Parameters<typeof renderImage>[0]),
  imageText: (b) => renderImageText(b as Parameters<typeof renderImageText>[0]),
  button: (b) => renderButton(b as Parameters<typeof renderButton>[0]),
  banner: (b) => renderBanner(b as Parameters<typeof renderBanner>[0]),
  gallery: (b) => renderGallery(b as Parameters<typeof renderGallery>[0]),
  slider: (b) => renderSlider(b as Parameters<typeof renderSlider>[0]),
  richtext: (b) => renderRichText(b as Parameters<typeof renderRichText>[0]),
}

export function renderBlock(block: Block): string {
  const fn = renderers[block.type]
  return fn ? fn(block) : ''
}

import { esc, safeUrl } from '../primitives'
import type { SliderBlock } from '../types'

export function renderSlider(b: SliderBlock): string {
  const slides = (b.images || [])
    .map((src) => safeUrl(src))
    .filter(Boolean)
    .map(
      (src) =>
        `<div class="swiper-slide"><div class="slide-inner"><img src="${esc(src)}" alt=""></div></div>`,
    )
    .join('')
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  return `<div class="memory-slider">
    <div class="container"${idAttr}>
      <div class="swiper memory-swiper">
        <div class="swiper-wrapper">${slides}</div>
        <span class="memory-arrow prev"><svg viewBox="0 0 27 44"><path d="M22,0l4.2,4.2L8.4,22l17.8,17.8L22,44L0,22L22,0z" fill="#fff"></path></svg></span>
        <span class="memory-arrow next"><svg viewBox="0 0 27 44"><path d="M22,0l4.2,4.2L8.4,22l17.8,17.8L22,44L0,22L22,0z" transform="rotate(180 13.5 22)" fill="#fff"></path></svg></span>
      </div>
    </div>
  </div>`
}

import type { CSSProperties } from 'react'

/** 把历史 bg 字符串语义转成 React style。 */
export function bgCss(bg?: string): CSSProperties | undefined {
  if (!bg) return undefined
  const v = String(bg).trim()
  if (!v) return undefined
  if (/^(linear-gradient|radial-gradient)/i.test(v)) return { background: v }
  if (/^(#|var\(|rgb|hsl)/i.test(v)) return { background: v }
  if (/\/|\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(v)) {
    return { backgroundImage: `url('${v}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  return { background: v }
}

/** 分栏背景图：独立于颜色，可与底色叠加。 */
export function bgImageCss(url?: string): CSSProperties | undefined {
  if (!url) return undefined
  const v = String(url).trim()
  if (!v) return undefined
  return { backgroundImage: `url('${v}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
}

export function isImageBg(bg?: string): boolean {
  if (!bg) return false
  const v = String(bg).trim()
  return /\//.test(v) && !/^(#|var\(|rgb|hsl|linear-gradient|radial-gradient)/i.test(v)
}

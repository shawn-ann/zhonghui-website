export const esc = (s: unknown): string =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  )

export function safeUrl(url?: string): string {
  if (!url) return ''
  const v = String(url).trim()
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(v)
  if (!m) return v
  const scheme = m[1].toLowerCase()
  return ['http', 'https', 'mailto', 'tel'].includes(scheme) ? v : ''
}

export function bgStyle(bg?: string): string {
  if (!bg) return ''
  const v = String(bg).trim()
  if (!v) return ''
  if (/^(linear-gradient|radial-gradient)/i.test(v)) return `style="background:${esc(v)};"`
  if (/^(#|var\(|rgb|hsl)/i.test(v)) return `style="background:${esc(v)};"`
  if (/\/|\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(v))
    return `style="background-image:url('${esc(v)}');background-size:cover;background-position:center;"`
  return `style="background:${esc(v)};"`
}

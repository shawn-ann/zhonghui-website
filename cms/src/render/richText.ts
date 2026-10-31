import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

const DANGEROUS = /(href|src)\s*=\s*("|')\s*(?:javascript|data|vbscript):[^"']*("|')/gi

export function sanitizeHtml(html: string): string {
  return html.replace(DANGEROUS, '$1="#"')
}

function escapeAttr(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

export function lexicalToHtml(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  try {
    return sanitizeHtml(convertLexicalToHTML({
      data: data as never,
      converters: ({ defaultConverters }) => ({
        ...defaultConverters,
        'rich-image': ({ node }) => {
          const src = String((node as { src?: string }).src || '')
          const alt = String((node as { alt?: string }).alt || '')
          if (!src) return ''
          return `<figure class="richtext-image"><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" /></figure>`
        },
        'image-row': ({ node }) => {
          const images = Array.isArray((node as { images?: unknown }).images)
            ? (node as { images: Array<{ src?: string; alt?: string }> }).images
            : []
          const html = images
            .filter((image) => image?.src)
            .map((image) => `<img src="${escapeAttr(String(image.src))}" alt="${escapeAttr(String(image.alt || ''))}" />`)
            .join('')
          const columns = Math.min(4, Math.max(1, Number((node as { columns?: number }).columns) || 3))
          return `<div class="richtext-gallery richtext-gallery-cols-${columns}">${html}</div>`
        },
      }),
    }))
  } catch {
    return ''
  }
}

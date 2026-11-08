import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

const DANGEROUS = /(href|src)\s*=\s*("|')\s*(?:javascript|data|vbscript):[^"']*("|')/gi

export function sanitizeHtml(html: string): string {
  return html.replace(DANGEROUS, '$1="#"')
}

function escapeAttr(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

function alignStyle(format: unknown, providedStyleTag?: string): string {
  const align = typeof format === 'string' ? format : ''
  const css = ['left', 'center', 'right', 'justify'].includes(align) ? `text-align:${align}` : ''
  if (!css) return providedStyleTag || ''
  if (!providedStyleTag) return ` style="${css}"`
  if (providedStyleTag.includes('style="')) {
    return providedStyleTag.replace(/style="([^"]*)"/, (_, current: string) => `style="${current};${css}"`)
  }
  return `${providedStyleTag} style="${css}"`
}

export function lexicalToHtml(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  try {
    return sanitizeHtml(convertLexicalToHTML({
      data: data as never,
      converters: ({ defaultConverters }) => ({
        ...defaultConverters,
        text: ({ node }) => {
          const n = node as { text?: string; format?: number; style?: string }
          let text = escapeAttr(String(n.text ?? ''))
          const format = Number(n.format) || 0
          if (format & 1) text = `<strong>${text}</strong>`
          if (format & 2) text = `<em>${text}</em>`
          if (format & 4) text = `<span style="text-decoration: line-through;">${text}</span>`
          if (format & 8) text = `<span style="text-decoration: underline;">${text}</span>`
          if (format & 16) text = `<code>${text}</code>`
          if (format & 32) text = `<sub>${text}</sub>`
          if (format & 64) text = `<sup>${text}</sup>`
          if (n.style) text = `<span style="${escapeAttr(String(n.style))}">${text}</span>`
          return text
        },
        paragraph: ({ node, nodesToHTML, providedStyleTag }) => {
          const n = node as { children?: unknown[]; format?: unknown }
          const children = nodesToHTML({ nodes: n.children as never })
          const attrs = alignStyle(n.format, providedStyleTag)
          return children?.length ? `<p${attrs}>${children.join('')}</p>` : `<p${attrs}><br /></p>`
        },
        heading: ({ node, nodesToHTML, providedStyleTag }) => {
          const n = node as { children?: unknown[]; format?: unknown; tag?: string }
          const children = nodesToHTML({ nodes: n.children as never }).join('')
          const tag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(String(n.tag)) ? String(n.tag) : 'h1'
          return `<${tag}${alignStyle(n.format, providedStyleTag)}>${children}</${tag}>`
        },
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

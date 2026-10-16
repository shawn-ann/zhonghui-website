import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

const DANGEROUS = /(href|src)\s*=\s*("|')\s*(?:javascript|data|vbscript):[^"']*("|')/gi

export function sanitizeHtml(html: string): string {
  return html.replace(DANGEROUS, '$1="#"')
}

export function lexicalToHtml(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  try {
    return sanitizeHtml(convertLexicalToHTML({ data: data as never }))
  } catch {
    return ''
  }
}

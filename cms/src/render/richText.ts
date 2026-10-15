import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

export function lexicalToHtml(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  try {
    return convertLexicalToHTML({ data: data as never })
  } catch {
    return ''
  }
}

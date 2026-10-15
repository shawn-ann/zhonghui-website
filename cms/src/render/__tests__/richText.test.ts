import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import { lexicalToHtml } from '../richText'
import type { RichTextBlock } from '../types'

describe('richtext renderer', () => {
  it('injects pre-converted html', () => {
    const b: RichTextBlock = { type: 'richtext', html: '<p>你好</p><ul><li>项</li></ul>' }
    const html = renderBlock(b)
    expect(html).toContain('<p>你好</p>')
    expect(html).toContain('<ul><li>项</li></ul>')
    expect(html).toContain('richtext')
  })
})

describe('lexicalToHtml', () => {
  it('returns empty string for empty input', () => {
    expect(lexicalToHtml(undefined)).toBe('')
  })
})

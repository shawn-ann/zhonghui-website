import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { blockNode } from '../../site/blocks'
import { lexicalToHtml, sanitizeHtml } from '../richText'
import type { RichTextBlock } from '../types'

describe('richtext renderer', () => {
  it('injects pre-converted html', () => {
    const b: RichTextBlock = { type: 'richtext', html: '<p>你好</p><ul><li>项</li></ul>' }
    const html = renderToStaticMarkup(blockNode(b))
    expect(html).toContain('<p>你好</p>')
    expect(html).toContain('<ul><li>项</li></ul>')
    expect(html).toContain('richtext')
  })
})

describe('lexicalToHtml', () => {
  it('returns empty string for empty input', () => {
    expect(lexicalToHtml(undefined)).toBe('')
  })

  it('drops dangerous URL from a link node', () => {
    const state = {
      root: {
        type: 'root',
        children: [
          {
            type: 'link',
            fields: { url: 'javascript:alert(1)', newTab: false },
            children: [{ type: 'text', text: 'click', version: 1 }],
            version: 3,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }
    const html = lexicalToHtml(state)
    expect(html).not.toContain('javascript:')
  })
})

describe('sanitizeHtml', () => {
  it('neutralizes javascript: and data: urls', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:')
    expect(sanitizeHtml('<img src="data:text/html,x">')).not.toContain('data:')
    expect(sanitizeHtml('<a href="https://ok.com">x</a>')).toContain('https://ok.com')
  })
  it('lexicalToHtml returns empty for null and non-object', () => {
    expect(lexicalToHtml(null)).toBe('')
    expect(lexicalToHtml('str')).toBe('')
  })
})

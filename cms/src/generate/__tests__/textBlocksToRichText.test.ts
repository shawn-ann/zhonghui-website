import { describe, it, expect } from 'vitest'
import { textBlocksToRichText } from '../textBlocksToRichText'

describe('textBlocksToRichText', () => {
  it('maps subheading text to h3 and body text to paragraphs', () => {
    const block = textBlocksToRichText([
      { body: '美国留学 · 奖学金计划', fontSize: 20, fontWeight: '700' },
      { body: '第一段正文', fontSize: 15 },
      { body: '英国留学', fontSize: 20, fontWeight: 700 },
      { body: '第二段正文', fontSize: 15 },
    ])

    expect(block.blockType).toBe('richtext')
    const children = block.content.root.children
    expect(children).toHaveLength(4)
    expect(children[0]).toMatchObject({ type: 'heading', tag: 'h3', children: [{ text: '美国留学 · 奖学金计划' }] })
    expect(children[1]).toMatchObject({ type: 'paragraph', children: [{ text: '第一段正文' }] })
    expect(children[2]).toMatchObject({ type: 'heading', tag: 'h3', children: [{ text: '英国留学' }] })
    expect(children[3]).toMatchObject({ type: 'paragraph', children: [{ text: '第二段正文' }] })
  })

  it('preserves text exactly and handles missing body as empty text', () => {
    const block = textBlocksToRichText([{ fontSize: 15 }])
    expect(block.content.root.children[0]).toMatchObject({ type: 'paragraph', children: [{ text: '' }] })
  })
})

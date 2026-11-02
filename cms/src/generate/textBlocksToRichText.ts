type TextBlockLike = { body?: unknown; fontSize?: unknown; fontWeight?: unknown }

const textNode = (text: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  type: 'text',
  version: 1,
})

const paragraph = (text: string) => ({
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'paragraph',
  version: 1,
  textFormat: 0,
})

const heading = (text: string) => ({
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'heading',
  version: 1,
  tag: 'h3',
})

export function textBlocksToRichText(blocks: TextBlockLike[]) {
  const children = blocks.map((block) => {
    const text = String(block.body ?? '')
    const subheading = Number(block.fontSize) === 20 && String(block.fontWeight) === '700'
    return subheading ? heading(text) : paragraph(text)
  })

  return {
    blockType: 'richtext' as const,
    content: {
      root: {
        children,
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    },
  }
}

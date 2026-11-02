// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { RichTextView } from '../blocks'
import type { RichTextBlock } from '../../render/types'

function block(text: string): RichTextBlock {
  return {
    type: 'richtext',
    _id: 'r',
    html: '',
    content: {
      root: {
        type: 'root', version: 1, direction: 'ltr', format: '', indent: 0,
        children: [
          {
            type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0,
            children: [{ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
          },
          {
            type: 'image-row', version: 1, columns: 2,
            images: [{ src: '/api/media/file/a.jpg', alt: 'A' }],
          },
        ],
      },
    },
  }
}

describe('editor rich text', () => {
  it('keeps image elements mounted while text changes', () => {
    const { container, rerender } = render(<RichTextView b={block('A')} editor />)
    const image = container.querySelector('.richtext img')
    expect(image).not.toBeNull()

    rerender(<RichTextView b={block('B')} editor />)

    expect(container.textContent).toContain('B')
    expect(container.querySelector('.richtext img')).toBe(image)
  })
})

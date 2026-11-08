// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import RichTextControl from '../RichTextControl'

const body = (text: string) => ({
  root: {
    type: 'root', version: 1, direction: null, format: '', indent: 0,
    children: [{
      type: 'paragraph', version: 1, direction: null, format: '', indent: 0, textFormat: 0,
      children: [{ type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text, children: [] }],
    }],
  },
})

describe('RichTextControl inline mode', () => {
  it('renders the editor directly without the modal trigger', () => {
    render(<RichTextControl inline label="正文" value={null} onChange={() => {}} />)
    expect(document.querySelector('.rt-toolbar')).toBeTruthy()
    expect(document.querySelector('.rt-content')).toBeTruthy()
    expect(document.querySelector('.rt-color input[type=color]')).toBeTruthy()
    expect(document.querySelector('.rt-color-value')).toBeTruthy()
    expect(document.querySelector('.rt-open')).toBeNull()
    expect(document.querySelector('.rt-modal')).toBeNull()
  })

  it('keeps the modal trigger by default', () => {
    render(<RichTextControl label="正文" value={null} onChange={() => {}} />)
    expect(document.querySelector('.rt-open')).toBeTruthy()
    expect(document.querySelector('.rt-modal')).toBeNull()
  })

  it('re-syncs the editor when the incoming value is replaced', async () => {
    const { rerender } = render(<RichTextControl inline label="正文" value={body('旧内容')} onChange={() => {}} />)
    await waitFor(() => expect(document.querySelector('.rt-content')?.textContent).toContain('旧内容'))

    rerender(<RichTextControl inline label="正文" value={body('新内容')} onChange={() => {}} />)
    await waitFor(() => expect(document.querySelector('.rt-content')?.textContent).toContain('新内容'))
  })
})

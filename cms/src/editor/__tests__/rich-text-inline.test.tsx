// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import RichTextControl from '../RichTextControl'

describe('RichTextControl inline mode', () => {
  it('renders the editor directly without the modal trigger', () => {
    render(<RichTextControl inline label="正文" value={null} onChange={() => {}} />)
    expect(document.querySelector('.rt-toolbar')).toBeTruthy()
    expect(document.querySelector('.rt-content')).toBeTruthy()
    expect(document.querySelector('.rt-open')).toBeNull()
    expect(document.querySelector('.rt-modal')).toBeNull()
  })

  it('keeps the modal trigger by default', () => {
    render(<RichTextControl label="正文" value={null} onChange={() => {}} />)
    expect(document.querySelector('.rt-open')).toBeTruthy()
    expect(document.querySelector('.rt-modal')).toBeNull()
  })
})

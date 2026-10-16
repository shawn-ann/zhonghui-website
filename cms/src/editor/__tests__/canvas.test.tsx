// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Canvas, { highlightSelection } from '../Canvas'
import { renderDocument } from '../../render/document'
import type { EditorDoc } from '../types'

const doc: EditorDoc = {
  id: 1,
  title: 'T',
  route: '/',
  blocks: [
    { type: 'text', body: 'x', _id: 'b1' },
    { type: 'text', body: 'y', _id: 'b2' },
  ],
}

describe('highlightSelection', () => {
  it('adds an outline to the selected section only', () => {
    const html = renderDocument(doc, { mode: 'external' })
    const out = highlightSelection(html, 'b2')
    const parsed = new DOMParser().parseFromString(out, 'text/html')
    expect(parsed.querySelector('[data-bid="b2"]')?.getAttribute('style')).toContain('outline')
    expect(parsed.querySelector('[data-bid="b1"]')?.getAttribute('style') || '').not.toContain('outline')
  })
  it('is a no-op when id is undefined', () => {
    const html = renderDocument(doc, { mode: 'external' })
    expect(highlightSelection(html)).toBe(html)
  })
})

describe('Canvas', () => {
  it('renders an iframe canvas', () => {
    const { container } = render(
      <Canvas doc={doc} onSelect={() => {}} onEditField={() => {}} />
    )
    expect(container.querySelector('iframe')).toBeTruthy()
  })
})

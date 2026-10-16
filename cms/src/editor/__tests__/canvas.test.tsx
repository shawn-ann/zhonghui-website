// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Canvas from '../Canvas'
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

describe('Canvas', () => {
  it('renders an iframe canvas', () => {
    const { container } = render(
      <Canvas doc={doc} onSelect={() => {}} onEditField={() => {}} />
    )
    expect(container.querySelector('iframe')).toBeTruthy()
  })
})

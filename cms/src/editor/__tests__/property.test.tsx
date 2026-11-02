// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PropertyPanel from '../PropertyPanel'
import type { Block } from '../types'

describe('PropertyPanel', () => {
  const block: Block = { type: 'text', body: 'hi', title: 't', _id: 'b1' }

  it('renders Chinese labels for a text block', () => {
    render(<PropertyPanel block={block} onChange={() => {}} />)
    for (const label of ['标题', '正文', '对齐', '背景', '浅粉底']) {
      expect(screen.getByText(label)).toBeTruthy()
    }
  })

  it('editing 正文 calls onChange with the new body', () => {
    const onChange = vi.fn()
    render(<PropertyPanel block={block} onChange={onChange} />)
    const textarea = screen.getByDisplayValue('hi')
    fireEvent.change(textarea, { target: { value: 'new body' } })
    expect(onChange).toHaveBeenCalledWith('body', 'new body')
  })

  it('shows a placeholder when no block is selected', () => {
    render(<PropertyPanel onChange={() => {}} />)
    expect(screen.getByText('未选中区块')).toBeTruthy()
  })
})

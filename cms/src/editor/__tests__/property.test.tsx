// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PropertyPanel from '../PropertyPanel'
import type { Block } from '../types'

describe('PropertyPanel', () => {
  const block: Block = { type: 'text', body: 'hi', title: 't', _id: 'b1' }

  it('renders Chinese labels for a text block', () => {
    render(<PropertyPanel block={block} onChange={() => {}} />)
    for (const label of ['标题', '正文', '对齐']) {
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

  it('selects a child when its name is clicked', () => {
    const onSelectChild = vi.fn()
    const section: Block = {
      type: 'section', _id: 's1', children: [{ type: 'heading', _id: 'h1', title: 'A' }],
    }
    render(<PropertyPanel block={section} onChange={() => {}} onSelectChild={onSelectChild} />)
    fireEvent.click(screen.getByTitle('点击编辑该组件'))
    expect(onSelectChild).toHaveBeenCalledWith('h1')
  })
})

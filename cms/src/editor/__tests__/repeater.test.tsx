// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RepeaterControl from '../RepeaterControl'

const field = {
  key: 'items',
  label: '条目',
  control: 'repeater' as const,
  addLabel: '添加条目',
  itemFields: [
    { key: 'label', label: '标签', control: 'text' as const },
    { key: 'desc', label: '说明', control: 'textarea' as const },
  ],
}

describe('RepeaterControl', () => {
  it('adds and removes items', () => {
    const onChange = vi.fn()
    render(<RepeaterControl field={field as any} value={[{ label: 'A', desc: 'B' }]} onChange={onChange} />)
    fireEvent.click(screen.getByText('添加条目'))
    expect(onChange).toHaveBeenCalledWith([{ label: 'A', desc: 'B' }, { label: '', desc: '' }])
    fireEvent.click(screen.getByTitle('删除条目 1'))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('moves items', () => {
    const onChange = vi.fn()
    render(<RepeaterControl field={field as any} value={[{ label: 'A' }, { label: 'B' }]} onChange={onChange} />)
    fireEvent.click(screen.getByTitle('下移条目 1'))
    expect(onChange).toHaveBeenCalledWith([{ label: 'B' }, { label: 'A' }])
  })
})

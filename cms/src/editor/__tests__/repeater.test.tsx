// @vitest-environment jsdom
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RepeaterControl from '../RepeaterControl'

const field = {
  key: 'items',
  label: '条目',
  control: 'repeater' as const,
  addLabel: '添加条目',
  titleKey: 'label',
  subtitleKey: 'desc',
  itemFields: [
    { key: 'label', label: '标签', control: 'text' as const },
    { key: 'desc', label: '说明', control: 'textarea' as const },
  ],
}

describe('RepeaterControl', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('adds items', () => {
    const onChange = vi.fn()
    render(<RepeaterControl field={field} value={[{ label: 'A', desc: 'B' }]} onChange={onChange} />)
    fireEvent.click(screen.getByText('添加条目'))
    expect(onChange).toHaveBeenCalledWith([{ label: 'A', desc: 'B' }, { label: '', desc: '' }])
  })

  it('confirms before removing', () => {
    const onChange = vi.fn()
    render(<RepeaterControl field={field} value={[{ label: 'A', desc: 'B' }]} onChange={onChange} />)
    fireEvent.click(screen.getByTitle('删除条目 1'))
    expect(window.confirm).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('duplicates an item after the source', () => {
    const onChange = vi.fn()
    render(<RepeaterControl field={field} value={[{ label: 'A', desc: 'B' }]} onChange={onChange} />)
    fireEvent.click(screen.getByTitle('复制条目 1'))
    expect(onChange).toHaveBeenCalledWith([{ label: 'A', desc: 'B' }, { label: 'A', desc: 'B' }])
  })

  it('shows row summary from configured keys', () => {
    render(<RepeaterControl field={field} value={[{ label: '食宿', desc: '免费' }]} onChange={() => {}} />)
    expect(screen.getByText('食宿')).toBeTruthy()
    expect(screen.getAllByText('免费').length).toBeGreaterThan(0)
  })
})

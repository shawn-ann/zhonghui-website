// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Palette from '../Palette'
import { PAGE_BLOCKS, BLOCKS } from '../blocks'

describe('Palette', () => {
  it('renders one thumbnail entry per page block, with Chinese labels', () => {
    render(<Palette onAdd={() => {}} />)
    expect(document.querySelectorAll('.ed-palette-item')).toHaveLength(PAGE_BLOCKS.length)
    for (const t of PAGE_BLOCKS) {
      expect(screen.getByTitle(`添加${BLOCKS[t].label}`)).toBeTruthy()
    }
  })
  it('calls onAdd on click', () => {
    const onAdd = vi.fn()
    render(<Palette onAdd={onAdd} />)
    fireEvent.click(screen.getByTitle('添加网格'))
    expect(onAdd).toHaveBeenCalledWith('grid')
  })
})

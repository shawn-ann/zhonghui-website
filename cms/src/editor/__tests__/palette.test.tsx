// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Palette from '../Palette'
import { PAGE_BLOCKS, BLOCKS } from '../blocks'

describe('Palette', () => {
  const PALETTE = PAGE_BLOCKS.filter((t) => t !== 'section')
  it('renders one thumbnail entry per content component (no section), with Chinese labels', () => {
    render(<Palette onAdd={() => {}} />)
    expect(document.querySelectorAll('.ed-palette-item')).toHaveLength(PALETTE.length)
    for (const t of PALETTE) {
      expect(screen.getByTitle(`添加${BLOCKS[t].label}`)).toBeTruthy()
    }
    expect(screen.queryByTitle('添加分栏')).toBeNull()
  })
  it('calls onAdd on click', () => {
    const onAdd = vi.fn()
    render(<Palette onAdd={onAdd} />)
    fireEvent.click(screen.getByTitle('添加文本'))
    expect(onAdd).toHaveBeenCalledWith('text')
  })
})

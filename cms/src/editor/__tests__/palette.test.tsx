// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Palette from '../Palette'
import { PAGE_BLOCKS, BLOCKS } from '../blocks'

describe('Palette', () => {
  const PALETTE = PAGE_BLOCKS.filter((t) => t !== 'section')
  it('renders one draggable thumbnail entry per content component (no section)', () => {
    render(<Palette />)
    const items = document.querySelectorAll('.ed-palette-item')
    expect(items).toHaveLength(PALETTE.length)
    items.forEach((el) => expect(el.getAttribute('draggable')).toBe('true'))
    for (const t of PALETTE) {
      expect(screen.getByTitle(`拖动添加${BLOCKS[t].label}`)).toBeTruthy()
    }
    expect(screen.queryByTitle('拖动添加分栏')).toBeNull()
  })
})

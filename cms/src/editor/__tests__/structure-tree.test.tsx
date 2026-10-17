// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StructureTree from '../StructureTree'

const blocks: any[] = [
  { type: 'section', _id: 's1', padding: 'md', children: [
    { type: 'heading', _id: 'h1', title: '项目一览' },
    { type: 'grid', _id: 'g1', columns: 3, children: [{ type: 'imageText', _id: 'i1', media: '', title: '美国 AuPair' }] },
  ] },
]

describe('StructureTree', () => {
  it('renders hierarchy with summaries', () => {
    render(<StructureTree blocks={blocks} onSelect={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('项目一览')).toBeTruthy()
    expect(screen.getByText('美国 AuPair')).toBeTruthy()
  })
  it('selects on click and deletes via ✕', () => {
    const onSelect = vi.fn(); const onDelete = vi.fn()
    render(<StructureTree blocks={blocks} onSelect={onSelect} onDelete={onDelete} />)
    fireEvent.click(screen.getByText('项目一览'))
    expect(onSelect).toHaveBeenCalled()
    const delBtns = screen.getAllByTitle('删除')
    fireEvent.click(delBtns[0])
    expect(onDelete).toHaveBeenCalled()
  })
})

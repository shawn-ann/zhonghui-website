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
    expect(screen.getAllByText('项目一览').length).toBeGreaterThan(0)
    expect(screen.getByText('美国 AuPair')).toBeTruthy()
  })
  it('selects on click and deletes via ✕', () => {
    const onSelect = vi.fn(); const onDelete = vi.fn()
    render(<StructureTree blocks={blocks} onSelect={onSelect} onDelete={onDelete} />)
    fireEvent.click(screen.getAllByText('项目一览')[0])
    expect(onSelect).toHaveBeenCalled()
    const delBtns = screen.getAllByTitle('删除')
    fireEvent.click(delBtns[0])
    expect(onDelete).toHaveBeenCalled()
  })
  it('shows top-level move buttons and calls onMoveTop', () => {
    const onMoveTop = vi.fn()
    const two: any[] = [...blocks, { type: 'text', _id: 't2', body: 'x' }]
    render(<StructureTree blocks={two} onSelect={() => {}} onDelete={() => {}} onMoveTop={onMoveTop} />)
    fireEvent.click(screen.getAllByTitle('下移')[0])
    expect(onMoveTop).toHaveBeenCalledWith(0, 1)
  })
})

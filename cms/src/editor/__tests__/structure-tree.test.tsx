// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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
  it('renders a page root and selects it', () => {
    const onSelectRoot = vi.fn()
    render(<StructureTree blocks={blocks} selectedId="s1" onSelect={() => {}} onSelectRoot={onSelectRoot} onDelete={() => {}} />)
    expect(screen.getByText('页面根目录')).toBeTruthy()
    expect(screen.getByText('1 个分栏')).toBeTruthy()
    fireEvent.click(screen.getByText('页面根目录'))
    expect(onSelectRoot).toHaveBeenCalled()
  })
  it('moves top-level sections', () => {
    const onMove = vi.fn()
    const two: any[] = [...blocks, { type: 'text', _id: 't2', body: 'x' }]
    render(<StructureTree blocks={two} onSelect={() => {}} onDelete={() => {}} onMove={onMove} />)
    const row = screen.getAllByText('项目一览')[0].closest('.ed-tree-row') as HTMLElement
    fireEvent.click(within(row).getByTitle('下移'))
    expect(onMove).toHaveBeenCalledWith(undefined, 0, 1)
  })

  it('moves nested children within their parent', () => {
    const onMove = vi.fn()
    render(<StructureTree blocks={blocks} onSelect={() => {}} onDelete={() => {}} onMove={onMove} />)
    const rows = [...document.querySelectorAll('.ed-tree-row')] as HTMLElement[]
    const row = rows.find((r) => r.querySelector('.ed-tree-label')?.textContent === '标题')!
    fireEvent.click(within(row).getByTitle('下移'))
    expect(onMove).toHaveBeenCalledWith('s1', 0, 1)
  })
})

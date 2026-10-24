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

  it('configures internal and external links', () => {
    const onPatch = vi.fn()
    const block: Block = {
      type: 'imageText', _id: 'i1', media: '',
      linkType: 'internal', internalPageId: 3, internalRoute: '/about/',
    }
    render(
      <PropertyPanel
        block={block}
        onChange={() => {}}
        onPatch={onPatch}
        pages={[{ id: 3, title: '关于中惠', route: '/about/' }]}
      />,
    )
    expect(screen.getByText('链接')).toBeTruthy()
    expect(screen.getByText('关于中惠（/about/）')).toBeTruthy()
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'external' } })
    expect(onPatch).toHaveBeenCalledWith(expect.objectContaining({ linkType: 'external' }))
  })

  it('offers section-appropriate components', () => {
    const onAddChild = vi.fn()
    const section: Block = { type: 'section', _id: 's1', children: [] }
    render(<PropertyPanel block={section} onChange={() => {}} onAddChild={onAddChild} />)
    for (const label of ['标题', '网格', '图集', '横幅', '轮播', '富文本']) {
      expect(screen.getByTitle(`添加${label}`)).toBeTruthy()
    }
    expect(screen.queryByTitle('添加文本')).toBeNull()
    fireEvent.click(screen.getByTitle('添加富文本'))
    expect(onAddChild).toHaveBeenCalledWith('richtext')
  })

  it('offers grid-appropriate components', () => {
    const grid: Block = { type: 'grid', _id: 'g1', columns: 3, children: [] }
    render(<PropertyPanel block={grid} onChange={() => {}} />)
    for (const label of ['标题', '文本', '图片', '图文卡片', '图标卡片', '按钮']) {
      expect(screen.getByTitle(`添加${label}`)).toBeTruthy()
    }
    expect(screen.queryByTitle('添加富文本')).toBeNull()
    expect(screen.queryByTitle('添加图集')).toBeNull()
  })
})

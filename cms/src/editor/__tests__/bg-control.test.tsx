// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BgControl } from '../controls'

describe('BgControl', () => {
  it('renders an image thumbnail for a media URL', () => {
    render(<BgControl label="背景" value="/api/media/file/a.jpg" onChange={() => {}} />)
    expect(document.querySelector('img.ed-media-thumb')).toBeTruthy()
    expect(document.querySelector('.ed-bg-swatch')).toBeNull()
  })

  it('renders a swatch for a color value', () => {
    render(<BgControl label="背景" value="#FFF1F6" onChange={() => {}} />)
    expect(document.querySelector('.ed-bg-swatch')).toBeTruthy()
    expect(document.querySelector('img.ed-media-thumb')).toBeNull()
  })

  it('clicking 选择图片 calls onPick', () => {
    const onPick = vi.fn()
    render(<BgControl label="背景" value="" onChange={() => {}} onPick={onPick} />)
    fireEvent.click(screen.getByText('选择图片'))
    expect(onPick).toHaveBeenCalled()
  })

  it('typing in the input calls onChange', () => {
    const onChange = vi.fn()
    render(<BgControl label="背景" value="" onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText(/或输入颜色/), { target: { value: '#FFF1F6' } })
    expect(onChange).toHaveBeenCalledWith('#FFF1F6')
  })
})

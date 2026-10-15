import { describe, it, expect } from 'vitest'
import { esc, bgStyle } from '../primitives'

describe('esc', () => {
  it('escapes html-sensitive chars', () => {
    expect(esc('<a href="x">&')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;')
  })
})

describe('bgStyle', () => {
  it('returns empty for empty input', () => {
    expect(bgStyle(undefined)).toBe('')
    expect(bgStyle('')).toBe('')
  })
  it('handles gradients', () => {
    expect(bgStyle('linear-gradient(90deg,#000,#fff)'))
      .toBe('style="background:linear-gradient(90deg,#000,#fff);"')
  })
  it('handles solid colors', () => {
    expect(bgStyle('#FFF1F6')).toBe('style="background:#FFF1F6;"')
    expect(bgStyle('var(--light-blue)')).toBe('style="background:var(--light-blue);"')
  })
  it('handles image paths', () => {
    expect(bgStyle('img/bg2.jpg'))
      .toBe("style=\"background-image:url('img/bg2.jpg');background-size:cover;background-position:center;\"")
  })
})

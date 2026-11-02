import { describe, it, expect } from 'vitest'
import { esc, bgStyle, safeUrl } from '../primitives'

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

describe('esc apostrophe', () => {
  it('escapes single quotes', () => {
    expect(esc("it's")).toBe('it&#39;s')
  })
})

describe('bgStyle injection safety', () => {
  it('cannot break out of the style attribute', () => {
    const out = bgStyle('#fff" onmouseover="alert(1)')
    expect(out).not.toContain('onmouseover="')
    expect(out).toBe('style="background:#fff&quot; onmouseover=&quot;alert(1);"')
  })
})

describe('safeUrl', () => {
  it('allows http/https/mailto/tel, paths and anchors', () => {
    expect(safeUrl('https://x.com')).toBe('https://x.com')
    expect(safeUrl('mailto:a@b.com')).toBe('mailto:a@b.com')
    expect(safeUrl('/x/')).toBe('/x/')
    expect(safeUrl('#top')).toBe('#top')
    expect(safeUrl('img/a.jpg')).toBe('img/a.jpg')
  })
  it('rejects dangerous schemes', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('')
    expect(safeUrl('data:text/html,x')).toBe('')
  })
})

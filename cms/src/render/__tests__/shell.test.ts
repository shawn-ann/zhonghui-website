import { describe, it, expect } from 'vitest'
import { shell } from '../shell'

describe('shell', () => {
  it('wraps inner in a section', () => {
    expect(shell({}, '<p>hi</p>')).toBe('<section class="section" ><p>hi</p></section>')
  })
  it('applies alt class when no bg and alt=true', () => {
    expect(shell({ alt: true }, 'x')).toBe('<section class="section section-alt" >x</section>')
  })
  it('applies bg style and ignores alt', () => {
    expect(shell({ bg: '#FFF1F6', alt: true }, 'x'))
      .toBe('<section class="section" style="background:#FFF1F6;">x</section>')
  })
})

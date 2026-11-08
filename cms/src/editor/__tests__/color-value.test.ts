import { describe, expect, it } from 'vitest'
import { normalizeHexColor } from '../colorValue'

describe('normalizeHexColor', () => {
  it('expands and uppercases hex colors', () => {
    expect(normalizeHexColor('#fff')).toBe('#FFFFFF')
    expect(normalizeHexColor('#8a0e4b')).toBe('#8A0E4B')
    expect(normalizeHexColor('  #E60039  ')).toBe('#E60039')
  })

  it('converts rgb and rgba values', () => {
    expect(normalizeHexColor('rgb(255, 255, 255)')).toBe('#FFFFFF')
    expect(normalizeHexColor('rgba(138, 14, 75, 1)')).toBe('#8A0E4B')
  })

  it('supports common named colors and rejects unknown values', () => {
    expect(normalizeHexColor('white')).toBe('#FFFFFF')
    expect(normalizeHexColor('black')).toBe('#000000')
    expect(normalizeHexColor('not-a-color')).toBe('')
    expect(normalizeHexColor('')).toBe('')
    expect(normalizeHexColor(undefined)).toBe('')
  })
})

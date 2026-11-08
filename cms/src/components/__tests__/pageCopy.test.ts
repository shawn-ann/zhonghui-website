import { describe, expect, it } from 'vitest'
import { normalizePageRoute, suggestCopyRoute, withoutBlockIds } from '../pageCopy'

describe('page copy helpers', () => {
  it('suggests a non-conflicting route', () => {
    expect(suggestCopyRoute('/about/', [])).toBe('/about-copy/')
    expect(suggestCopyRoute('/about/', [{ route: '/about-copy/' }])).toBe('/about-copy-2/')
    expect(suggestCopyRoute('/', [])).toBe('/copy/')
  })

  it('normalizes routes', () => {
    expect(normalizePageRoute('about')).toBe('/about/')
    expect(normalizePageRoute('/about')).toBe('/about/')
    expect(normalizePageRoute('/')).toBe('/')
  })

  it('strips block ids recursively but keeps relationships', () => {
    const input = {
      id: 1,
      blockType: 'imageText',
      media: 7,
      children: [{ id: 2, title: 'A', nested: [{ id: 3, value: 4 }] }],
    }
    expect(withoutBlockIds(input)).toEqual({
      blockType: 'imageText',
      media: 7,
      children: [{ title: 'A', nested: [{ value: 4 }] }],
    })
  })
})

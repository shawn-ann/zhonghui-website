import { describe, expect, it } from 'vitest'
import { Cases } from '../Cases'

const field = (name: string) => Cases.fields.find((item) => 'name' in item && item.name === name) as any

describe('Cases admin config', () => {
  it('sorts the list by published date descending and shows it', () => {
    expect(Cases.defaultSort).toBe('-publishedAt')
    expect(Cases.admin?.defaultColumns).toEqual(['title', 'category', 'publishedAt', '_status'])
  })

  it('only allows picking an existing category', () => {
    expect(field('category').admin).toMatchObject({ allowCreate: false, allowEdit: false, position: 'sidebar' })
  })

  it('hides the published date from the form', () => {
    expect(field('publishedAt').admin?.hidden).toBe(true)
    expect(field('publishedAt').required).toBeFalsy()
  })
})

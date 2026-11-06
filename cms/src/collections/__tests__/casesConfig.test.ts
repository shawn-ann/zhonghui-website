import { describe, expect, it } from 'vitest'
import { Cases } from '../Cases'

const field = (name: string) => Cases.fields.find((item) => 'name' in item && item.name === name) as any

describe('Cases admin config', () => {
  it('sorts the list by published date descending and shows it', () => {
    expect(Cases.defaultSort).toBe('-publishedAt')
    expect(Cases.admin?.defaultColumns).toEqual(['title', 'category', 'publishedAt', '_status'])
  })

  it('only allows picking an existing category', () => {
    expect(field('category').admin).toMatchObject({ allowCreate: false, allowEdit: false })
  })

  it('places the category picker above the URL field in the main column', () => {
    const names = Cases.fields.filter((item) => 'name' in item).map((item: any) => item.name)
    expect(names.indexOf('category')).toBeLessThan(names.indexOf('slug'))
    expect(field('category').admin?.position).toBeUndefined()
  })

  it('gives the title input a visible placeholder on create', () => {
    expect(field('title').admin?.placeholder).toBe('输入文章标题')
  })

  it('hides the published date from the form', () => {
    expect(field('publishedAt').admin?.hidden).toBe(true)
    expect(field('publishedAt').required).toBeFalsy()
  })
})

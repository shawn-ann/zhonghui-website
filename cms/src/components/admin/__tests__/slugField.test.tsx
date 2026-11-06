// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SlugField, { slugPrefix } from '../SlugField'

vi.mock('@payloadcms/ui', () => ({
  useField: () => ({ value: 'xiaocao', setValue: () => {} }),
  useFormFields: (selector: any) =>
    selector([{ category: { value: { id: 1, slug: 'study-case' } } }, () => {}]),
}))

describe('SlugField', () => {
  it('builds the URL prefix from the category slug', () => {
    expect(slugPrefix('study-case')).toBe('/blog/study-case/')
    expect(slugPrefix()).toBe('/blog/')
    expect(slugPrefix(null)).toBe('/blog/')
  })

  it('shows the prefix and the editable alias', () => {
    render(<SlugField path="slug" field={{ label: 'URL 别名' }} />)
    expect(screen.getByText('/blog/study-case/')).toBeTruthy()
    expect((screen.getByDisplayValue('xiaocao') as HTMLInputElement).value).toBe('xiaocao')
  })
})

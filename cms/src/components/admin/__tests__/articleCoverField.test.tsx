// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ArticleCoverField from '../ArticleCoverField'

vi.mock('@payloadcms/ui', () => ({
  useField: () => ({ value: null, setValue: () => {} }),
  useFormFields: (selector: any) => selector([{ title: { value: '小曹同学的赴美之旅' } }, () => {}]),
}))

describe('ArticleCoverField', () => {
  it('renders a square cover preview with the article title', () => {
    render(<ArticleCoverField path="cover" field={{ label: '封面图' }} />)
    const cover = document.querySelector('.acf-cover')
    expect(cover).toBeTruthy()
    expect(cover?.textContent).toContain('小曹同学的赴美之旅')
  })

  it('does not offer removing a required cover', () => {
    render(<ArticleCoverField path="cover" field={{ label: '封面图' }} />)
    expect(screen.queryByText('移除')).toBeNull()
    expect(screen.getAllByText('更换').length).toBeGreaterThan(0)
  })
})

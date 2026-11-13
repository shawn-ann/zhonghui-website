// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ArticleCoverField from '../ArticleCoverField'

vi.mock('@payloadcms/ui', () => ({
  FieldLabel: ({ label, required }: any) => <span>{label}{required ? '*' : ''}</span>,
  useField: () => ({ value: null, setValue: () => {} }),
}))

describe('ArticleCoverField', () => {
  it('shows a placeholder when no cover is selected', () => {
    render(<ArticleCoverField path="cover" field={{ label: '封面图', required: true }} />)
    const cover = document.querySelector('.acf-cover')
    expect(cover).toBeTruthy()
    expect(cover?.textContent).toContain('未选择封面图')
    expect(screen.getByText('封面图*')).toBeTruthy()
  })

  it('does not offer removing a required cover', () => {
    render(<ArticleCoverField path="cover" field={{ label: '封面图', required: true }} />)
    expect(screen.queryByText('移除')).toBeNull()
    expect(screen.getAllByText('选择图片').length).toBeGreaterThan(0)
  })
})

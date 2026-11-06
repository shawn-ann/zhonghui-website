// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import ArticleDocumentMeta from '../ArticleDocumentMeta'
import BeijingTimeCell from '../BeijingTimeCell'

vi.mock('@payloadcms/ui', () => ({
  useDocumentInfo: () => ({
    data: {
      _status: 'published',
      updatedAt: '2026-11-06T11:54:25.000Z',
      createdAt: '2026-11-06T10:00:00.000Z',
    },
  }),
}))

describe('ArticleDocumentMeta', () => {
  it('renders document timestamps in Beijing time', () => {
    render(<ArticleDocumentMeta />)
    expect(document.body.textContent).toContain('最后修改时间：2026/11/06 19:54:25')
    expect(document.body.textContent).toContain('已创建：2026/11/06 18:00:00')
    expect(document.body.textContent).toContain('已发布')
  })
})

describe('BeijingTimeCell', () => {
  it('renders an instant in Beijing time', () => {
    render(<BeijingTimeCell cellData="2026-01-01T04:12:30.000Z" />)
    expect(document.body.textContent).toBe('2026/01/01 12:12:30')
  })

  it('renders a dash when empty', () => {
    render(<BeijingTimeCell cellData={null} />)
    expect(document.body.textContent).toBe('—')
  })
})

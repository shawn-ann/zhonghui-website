// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import CategoryCell from '../CategoryCell'
import PublishedAtCell, { formatPublishedDate } from '../PublishedAtCell'

vi.mock('@payloadcms/ui', () => ({
  useListRelationships: () => ({
    documents: { 'case-categories': { 1: { id: 1, title: '案例分享' } } },
    getRelationships: () => {},
  }),
}))

describe('CategoryCell', () => {
  it('resolves a relation id through the list relationship cache', () => {
    render(<CategoryCell cellData={1} />)
    expect(document.body.textContent).toBe('案例分享')
  })

  it('renders a populated relation title directly', () => {
    render(<CategoryCell cellData={{ id: 1, title: '案例分享' }} />)
    expect(document.body.textContent).toBe('案例分享')
  })

  it('renders a dash when the relation is empty', () => {
    render(<CategoryCell cellData={null} />)
    expect(document.body.textContent).toBe('—')
  })
})

describe('PublishedAtCell', () => {
  it('shows the calendar day with a zero time', () => {
    expect(formatPublishedDate('2025-07-18T00:00:00.000Z')).toBe('2025/07/18 00:00:00')
    render(<PublishedAtCell cellData="2025-07-18T00:00:00.000Z" />)
    expect(document.body.textContent).toBe('2025/07/18 00:00:00')
  })

  it('renders a dash when empty', () => {
    expect(formatPublishedDate(null)).toBe('—')
  })
})

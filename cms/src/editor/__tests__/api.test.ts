import { describe, it, expect, vi } from 'vitest'
import { getPage, savePage, publishPage, listMedia } from '../api'

describe('editor api', () => {
  it('getPage fetches draft', async () => {
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify({ doc: { id: 1, title: 'T', route: '/', blocks: [] } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const doc = await getPage(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/pages/1?draft=true')
    expect(doc.title).toBe('T')
  })
  it('savePage PATCHes', async () => {
    const fetchMock = vi.fn(async (_u: string, _init: any) => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await savePage(1, { title: 'T', route: '/', blocks: [] })
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH')
  })
  it('publishPage sets _status published', async () => {
    const fetchMock = vi.fn(async (_u: string, init: any) => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await publishPage(1, { title: 'T', route: '/', blocks: [] })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)._status).toBe('published')
  })
  it('listMedia fetches docs', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ docs: [{ id: 7, url: '/m/a.jpg' }] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const media = await listMedia()
    expect(media[0].url).toBe('/m/a.jpg')
  })
})

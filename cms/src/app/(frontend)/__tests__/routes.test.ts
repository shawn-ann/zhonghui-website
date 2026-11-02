import { describe, it, expect, vi } from 'vitest'

import { GET as assetsGET } from '../assets/[...path]/route'

const call = (parts: string[]) =>
  assetsGET(new Request('http://x'), { params: Promise.resolve({ path: parts }) })

describe('assets route', () => {
  it('serves style.css from render/styles', async () => {
    const res = await call(['style.css'])
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/css')
  })
  it('serves a static asset', async () => {
    const res = await call(['brand', 'logo.jpg'])
    expect(res.status).toBe(200)
  })
  it('404 for directory', async () => {
    const res = await call(['brand'])
    expect(res.status).toBe(404)
  })
  it('404 for missing', async () => {
    const res = await call(['nope.png'])
    expect(res.status).toBe(404)
  })
})

const state = vi.hoisted(() => ({
  user: null as unknown,
  doc: { title: 'T', route: '/', _status: 'draft', blocks: [{ blockType: 'text', body: 'hi' }] },
}))

vi.mock('payload', () => ({
  getPayload: async () => ({
    auth: async () => ({ user: state.user }),
    findByID: async () => state.doc,
  }),
}))
vi.mock('@payload-config', () => ({ default: {} }))

const { GET: previewGET } = await import('../preview/pages/[id]/route')
const userValue = { get: () => state.user, set: (v: unknown) => (state.user = v) }

const req = () => new Request('http://x')
const ctx = () => ({ params: Promise.resolve({ id: '1' }) })

describe('preview route', () => {
  it('401 when anonymous', async () => {
    userValue.set(null)
    const res = await previewGET(req(), ctx())
    expect(res.status).toBe(401)
  })
  it('renders html when authenticated', async () => {
    userValue.set({ id: 1 })
    const res = await previewGET(req(), ctx())
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('hi')
    expect(res.headers.get('cache-control')).toContain('no-store')
  })
})

import { describe, it, expect } from 'vitest'

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


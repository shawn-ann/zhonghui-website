import { describe, it, expect } from 'vitest'
import { routeToFile } from '../route'

describe('routeToFile', () => {
  it('maps root', () => { expect(routeToFile('/')).toBe('index.html') })
  it('maps simple route', () => { expect(routeToFile('/about/')).toBe('about/index.html') })
  it('maps nested route', () => { expect(routeToFile('/cases/page/2/')).toBe('cases/page/2/index.html') })
  it('tolerates missing trailing slash', () => { expect(routeToFile('/about')).toBe('about/index.html') })
})

describe('routeToFile rejects traversal', () => {
  it('throws on .. segments', () => {
    expect(() => routeToFile('/../../etc/passwd')).toThrow()
    expect(() => routeToFile('/a/../../../b')).toThrow()
  })
})

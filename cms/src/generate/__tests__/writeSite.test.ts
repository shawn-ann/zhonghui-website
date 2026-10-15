import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { writeSite } from '../writeSite'

let dir: string
beforeEach(() => { dir = mkdtempSync(path.join(tmpdir(), 'site-')) })
afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

describe('writeSite', () => {
  it('writes files and creates nested dirs', () => {
    const map = new Map<string, string>([
      ['index.html', '<html>home</html>'],
      ['about/index.html', '<html>about</html>'],
    ])
    writeSite(map, dir)
    expect(existsSync(path.join(dir, 'about/index.html'))).toBe(true)
    expect(readFileSync(path.join(dir, 'index.html'), 'utf-8')).toBe('<html>home</html>')
  })

  it('refuses to write outside outDir', () => {
    expect(() => writeSite(new Map([['../evil.html', 'x']]), dir)).toThrow()
  })
})

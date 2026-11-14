import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { TUTORIAL_CHAPTERS } from '../tutorial'

const root = process.cwd()

describe('tutorial content', () => {
  for (const chapter of TUTORIAL_CHAPTERS) {
    it(`${chapter.id} has content and existing images`, () => {
      const markdown = readFileSync(path.join(root, 'docs/user-guide', chapter.file), 'utf8')
      expect(markdown.trim().length).toBeGreaterThan(300)

      const images = Array.from(markdown.matchAll(/!\[[^\]]*\]\((\/tutorial\/[^)]+)\)/g))
        .map((match) => match[1])
      expect(images.length).toBeGreaterThan(0)

      for (const src of images) {
        expect(existsSync(path.join(root, 'public', src)), `${chapter.id}: ${src}`).toBe(true)
      }
    })
  }
})

import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { TUTORIAL_CHAPTERS, isTutorialImagePath, tutorialImagePaths } from '../tutorial'

const root = process.cwd()
const readChapter = (file: string) =>
  readFileSync(path.join(root, 'docs/user-guide', file), 'utf8')

describe('tutorial content', () => {
  for (const chapter of TUTORIAL_CHAPTERS) {
    it(`${chapter.id} has content and existing images`, () => {
      const markdown = readChapter(chapter.file)
      expect(markdown.trim().length).toBeGreaterThan(300)

      const images = tutorialImagePaths(markdown)
      expect(images.length).toBeGreaterThan(0)

      for (const src of images) {
        expect(isTutorialImagePath(src), `${chapter.id}: ${src}`).toBe(true)
        const file = path.join(root, 'public', src)
        expect(existsSync(file), `${chapter.id}: ${src}`).toBe(true)
        expect(statSync(file).size, `${chapter.id}: ${src}`).toBeGreaterThan(0)
      }
    })
  }

  it('documents article publishing from the editor footer, not the list row', () => {
    const markdown = readChapter('04-articles.md')
    expect(markdown).toContain('发布修改')
    expect(markdown).not.toContain('点击文章右侧的「发布」')
  })

  it('keeps 图文卡片 and 图标卡片 out of the direct 分栏 child list', () => {
    const markdown = readChapter('03-pages.md')
    expect(markdown).not.toContain('例如标题、图文卡片、富文本、网格或流程步骤')
    expect(markdown).toContain('图文卡片和图标卡片需要添加到网格或纵向容器')
  })
})

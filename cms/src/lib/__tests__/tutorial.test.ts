import { describe, expect, it } from 'vitest'
import { TUTORIAL_CHAPTERS, loadTutorialChapters, renderTutorialChapter } from '../tutorial'

describe('tutorial', () => {
  it('defines the five chapters in reading order', () => {
    expect(TUTORIAL_CHAPTERS.map((chapter) => chapter.id)).toEqual([
      'menu',
      'site-settings',
      'pages',
      'articles',
      'publish',
    ])
  })

  it('renders markdown to html', () => {
    const chapter = TUTORIAL_CHAPTERS[0]
    const result = renderTutorialChapter(chapter, '# 配置网站菜单\n\n1. 打开菜单\n2. 添加菜单项')
    expect(result.id).toBe('menu')
    expect(result.html).toContain('<h1>配置网站菜单</h1>')
    expect(result.html).toContain('<li>打开菜单</li>')
    expect(result.html).toContain('<li>添加菜单项</li>')
  })

  it('reports the missing file name', () => {
    expect(() => loadTutorialChapters('/tmp/zhonghui-tutorial-does-not-exist')).toThrow(
      /01-menu\.md/,
    )
  })
})

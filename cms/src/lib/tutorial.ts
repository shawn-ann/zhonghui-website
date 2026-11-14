import { readFileSync } from 'node:fs'
import path from 'node:path'
import { marked } from 'marked'

export interface TutorialChapter {
  id: 'menu' | 'site-settings' | 'pages' | 'articles' | 'publish'
  title: string
  file: string
}

export const TUTORIAL_CHAPTERS: readonly TutorialChapter[] = [
  { id: 'menu', title: '配置网站菜单', file: '01-menu.md' },
  { id: 'site-settings', title: '配置页眉页脚', file: '02-site-settings.md' },
  { id: 'pages', title: '配置页面', file: '03-pages.md' },
  { id: 'articles', title: '文章配置', file: '04-articles.md' },
  { id: 'publish', title: '站点发布', file: '05-publish.md' },
]

export interface RenderedChapter extends TutorialChapter {
  html: string
}

export function tutorialImagePaths(markdown: string): string[] {
  return Array.from(markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)).map((match) => match[1].trim())
}

export function isTutorialImagePath(src: string): boolean {
  return /^\/tutorial\/[\w.-]+\.png$/.test(src)
}

export function renderTutorialChapter(
  chapter: TutorialChapter,
  markdown: string,
): RenderedChapter {
  return {
    ...chapter,
    html: marked.parse(markdown, { async: false }) as string,
  }
}

export function loadTutorialChapters(
  dir = path.join(process.cwd(), 'docs/user-guide'),
): RenderedChapter[] {
  return TUTORIAL_CHAPTERS.map((chapter) => {
    let markdown = ''
    try {
      markdown = readFileSync(path.join(dir, chapter.file), 'utf8')
    } catch {
      throw new Error(`无法读取教程文件：${chapter.file}`)
    }
    return renderTutorialChapter(chapter, markdown)
  })
}

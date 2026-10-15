import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { renderPage } from '../render/layout'
import type { SiteData } from '../render/types'
import { routeToFile } from './route'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const baseCss = readFileSync(path.resolve(dirname, '../render/styles/base.css'), 'utf-8')

export function generateSite(data: SiteData): Map<string, string> {
  const out = new Map<string, string>()
  for (const page of data.pages) {
    out.set(routeToFile(page.route), renderPage(page))
  }
  out.set('assets/style.css', baseCss)
  return out
}

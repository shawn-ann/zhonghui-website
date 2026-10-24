import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadSiteData } from './loadSiteData'
import { generateSite } from './buildSite'
import { writeSite } from './writeSite'
import { collectMediaUrls, copyMedia } from './media'
import type { SiteData } from '../render/types'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const cmsDir = path.resolve(dirname, '../..')

function timestamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

function linkTarget(linkPath: string, target: string) {
  const tmp = `${linkPath}.tmp-${process.pid}`
  fs.rmSync(tmp, { recursive: true, force: true })
  fs.symlinkSync(target, tmp, 'dir')
  try {
    const st = fs.lstatSync(linkPath)
    if (!st.isSymbolicLink()) {
      // 首次迁移：保留旧的实体 dist 目录，避免误删。
      fs.renameSync(linkPath, `${linkPath}.legacy-${Date.now()}`)
    }
  } catch { /* link does not exist */ }
  fs.renameSync(tmp, linkPath)
}

function prune(releasesDir: string, keep: number, current: string) {
  const dirs = fs.readdirSync(releasesDir)
    .filter((name) => /^\d{8}-\d{6}$/.test(name))
    .sort()
  const remove = dirs.slice(0, Math.max(0, dirs.length - keep))
  for (const name of remove) {
    if (name === current) continue
    fs.rmSync(path.join(releasesDir, name), { recursive: true, force: true })
  }
}

export function buildRelease(data: SiteData) {
  const releasesDir = process.env.SITE_RELEASES_DIR
    ? path.resolve(process.env.SITE_RELEASES_DIR)
    : path.join(cmsDir, 'releases')
  fs.mkdirSync(releasesDir, { recursive: true })

  let name = timestamp()
  let outDir = path.join(releasesDir, name)
  let suffix = 1
  while (fs.existsSync(outDir)) outDir = path.join(releasesDir, `${name}-${suffix++}`)
  if (outDir !== path.join(releasesDir, name)) name = path.basename(outDir)

  try {
    const files = generateSite(data)
    writeSite(files, outDir)
    const mediaDir = path.join(cmsDir, 'media')
    copyMedia(collectMediaUrls(data), mediaDir, outDir)

    // 原子切换：releases/current 供 Nginx 使用，dist 软链保持本地脚本兼容。
    linkTarget(path.join(releasesDir, 'current'), `./${name}`)
    linkTarget(path.join(cmsDir, 'dist'), path.join('releases', name))

    const keep = Number(process.env.SITE_KEEP_RELEASES || 5)
    prune(releasesDir, Number.isFinite(keep) && keep > 0 ? keep : 5, name)

    return { name, outDir, pages: data.pages.length }
  } catch (err) {
    fs.rmSync(outDir, { recursive: true, force: true })
    throw err
  }
}

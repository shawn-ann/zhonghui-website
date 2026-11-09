import 'dotenv/config'

process.env.DISABLE_AUTO_REBUILD = '1'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })
const cmsDir = process.cwd()
const seedDir = path.join(cmsDir, 'seed')
const manifestPath = path.join(seedDir, 'manifest.json')
if (!existsSync(manifestPath)) throw new Error(`缺少种子文件：${manifestPath}`)
const manifest: any = JSON.parse(readFileSync(manifestPath, 'utf-8'))
const skipBuild = process.argv.includes('--skip-build')

type Id = number
const idOf = (value: any): Id | null => {
  if (value == null) return null
  const raw = typeof value === 'object' ? value.id : value
  const id = Number(raw)
  return Number.isFinite(id) ? id : null
}

const mediaIdByFilename = new Map<string, Id>()
const mediaIdByOldId = new Map<string, Id>()
const pageIdByRoute = new Map<string, Id>()
const pageIdByOldId = new Map<string, Id>()
const caseIdBySlug = new Map<string, Id>()
const caseIdByOldId = new Map<string, Id>()
const categoryIdBySlug = new Map<string, Id>()
const categoryIdByOldId = new Map<string, Id>()

// 1. 媒体：按文件名导入，重复执行时复用已有记录。
for (const item of manifest.media || []) {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: item.filename } },
    limit: 1,
    depth: 0,
  })
  let id: Id
  if (existing.docs[0]) {
    id = (existing.docs[0] as any).id
  } else {
    const filePath = path.join(seedDir, 'media', item.filename)
    if (!existsSync(filePath)) throw new Error(`缺少媒体文件：${item.filename}`)
    const doc: any = await payload.create({
      collection: 'media',
      data: { alt: item.alt || item.filename },
      filePath,
    })
    id = doc.id
  }
  mediaIdByFilename.set(item.filename, id)
  mediaIdByOldId.set(String(item.id), id)
}

const mapMedia = (value: any): Id | undefined => {
  const old = idOf(value)
  if (old == null) return undefined
  const mapped = mediaIdByOldId.get(String(old))
  if (mapped == null) throw new Error(`媒体引用不存在：${old}`)
  return mapped
}

// 2. 文章分类。
for (const item of manifest.caseCategories || []) {
  const data = {
    title: item.title,
    slug: item.slug,
    banner: mapMedia(item.banner),
    subtitle: item.subtitle || '',
    pageSize: Number(item.pageSize) || 12,
  }
  const existing = await payload.find({
    collection: 'case-categories',
    where: { slug: { equals: item.slug } },
    limit: 1,
    depth: 0,
  })
  const doc: any = existing.docs[0]
    ? await payload.update({ collection: 'case-categories', id: (existing.docs[0] as any).id, data })
    : await payload.create({ collection: 'case-categories', data })
  categoryIdBySlug.set(item.slug, doc.id)
  categoryIdByOldId.set(String(item.id), doc.id)
}

const mapCategory = (value: any): Id | undefined => {
  const old = idOf(value)
  if (old == null) return undefined
  return categoryIdByOldId.get(String(old))
}

// 3. 文章。
for (const item of manifest.cases || []) {
  const category = mapCategory(item.category)
  if (category == null) throw new Error(`文章分类不存在：${item.slug}`)
  const data: any = {
    title: item.title,
    slug: item.slug,
    category,
    cover: mapMedia(item.cover),
    publishedAt: item.publishedAt,
    body: item.body,
    _status: 'published',
  }
  const existing = await payload.find({
    collection: 'cases',
    where: { slug: { equals: item.slug } },
    limit: 1,
    depth: 0,
  })
  const doc: any = existing.docs[0]
    ? await payload.update({ collection: 'cases', id: (existing.docs[0] as any).id, data })
    : await payload.create({ collection: 'cases', data })
  caseIdBySlug.set(item.slug, doc.id)
  caseIdByOldId.set(String(item.id), doc.id)
}

const mapCase = (value: any): Id | undefined => {
  const old = idOf(value)
  if (old == null) return undefined
  return caseIdByOldId.get(String(old))
}

// 4. 页面：先建壳拿到新 ID，再统一重写区块中的关系 ID。
for (const item of manifest.pages || []) {
  const existing = await payload.find({
    collection: 'pages',
    where: { route: { equals: item.route } },
    limit: 1,
    depth: 0,
  })
  const doc: any = existing.docs[0]
    ? existing.docs[0]
    : await payload.create({
      collection: 'pages',
      data: { title: item.title, route: item.route, blocks: [], _status: 'published' },
    })
  pageIdByRoute.set(item.route, doc.id)
  pageIdByOldId.set(String(item.id), doc.id)
}

const mapPage = (value: any): Id | undefined => {
  const old = idOf(value)
  if (old == null) return undefined
  return pageIdByOldId.get(String(old))
}

const MEDIA_KEYS = new Set(['media', 'icon', 'image', 'pattern'])

function remapBlocks(value: any): any {
  if (Array.isArray(value)) return value.map(remapBlocks)
  if (!value || typeof value !== 'object') return value
  const out: Record<string, any> = {}
  for (const [key, item] of Object.entries(value)) {
    if (key === 'id') continue
    if (key === 'internalPage') {
      out[key] = mapPage(item) ?? null
    } else if (key === 'caseItem') {
      out[key] = mapCase(item) ?? null
    } else if (MEDIA_KEYS.has(key)) {
      out[key] = mapMedia(item) ?? null
    } else {
      out[key] = remapBlocks(item)
    }
  }
  return out
}

for (const item of manifest.pages || []) {
  const id = pageIdByRoute.get(item.route)
  if (id == null) continue
  await payload.update({
    collection: 'pages',
    id,
    draft: false,
    data: {
      title: item.title,
      route: item.route,
      blocks: remapBlocks(item.blocks || []),
      _status: 'published',
    },
  })
}

// 5. 菜单。
const mapMenuItems = (items: any[]): any[] => (items || []).map((item) => ({
  label: item.label,
  linkType: item.linkType || 'page',
  page: mapPage(item.page) ?? null,
  caseCategory: mapCategory(item.caseCategory) ?? null,
  externalUrl: item.externalUrl || null,
  children: mapMenuItems(item.children || []),
}))

await payload.updateGlobal({
  slug: 'menu',
  data: { items: mapMenuItems(manifest.menu?.items || []) },
})

// 6. 站点设置。
const settings = manifest.siteSettings || {}
await payload.updateGlobal({
  slug: 'site-settings',
  data: {
    logo: mapMedia(settings.logo),
    footerLogo: mapMedia(settings.footerLogo),
    footerInfo: (settings.footerInfo || []).map((item: any) => ({ label: item.label, text: item.text })),
    footerQr: (settings.footerQr || []).map((item: any) => ({
      label: item.label,
      image: mapMedia(item.image),
    })),
    footerContactLabel: settings.footerContactLabel || '',
    footerContactPage: mapPage(settings.footerContactPage) ?? null,
    copyright: settings.copyright || '',
    langCurrentLabel: settings.langCurrentLabel || '',
    langOtherLabel: settings.langOtherLabel || '',
    langOtherUrl: settings.langOtherUrl || '',
  },
})

// 7. 文章重定向（目前为空，保留兼容）。
for (const redirect of manifest.caseRedirects || []) {
  const existing = await payload.find({
    collection: 'case-redirects',
    where: { from: { equals: redirect.from } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) {
    await payload.update({ collection: 'case-redirects', id: (existing.docs[0] as any).id, data: redirect })
  } else {
    await payload.create({ collection: 'case-redirects', data: redirect })
  }
}

console.log(JSON.stringify({
  media: manifest.media?.length || 0,
  categories: manifest.caseCategories?.length || 0,
  cases: manifest.cases?.length || 0,
  pages: manifest.pages?.length || 0,
  redirects: manifest.caseRedirects?.length || 0,
}, null, 2))

await payload.destroy()

if (!skipBuild) {
  console.log('初始化完成，开始生成静态站…')
  const result = spawnSync('npm', ['run', 'generate'], {
    cwd: cmsDir,
    stdio: 'inherit',
    env: { ...process.env, DISABLE_AUTO_REBUILD: '1' },
  })
  if (result.status !== 0) {
    console.error('静态站生成失败，请检查上方日志。')
    process.exit(result.status || 1)
  }
}

console.log('初始化完成。')
process.exit(0)

import 'dotenv/config'

process.env.DISABLE_AUTO_REBUILD = '1'
import { copyFileSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })
const cmsDir = process.cwd()
const seedDir = path.join(cmsDir, 'seed')
const mediaDir = path.join(seedDir, 'media')
mkdirSync(mediaDir, { recursive: true })

const media = await payload.find({ collection: 'media', limit: 2000, depth: 0 })
const categories = await payload.find({ collection: 'case-categories', limit: 1000, depth: 0 })
const cases = await payload.find({
  collection: 'cases',
  where: { _status: { equals: 'published' } },
  limit: 1000,
  depth: 0,
})
const pages = await payload.find({
  collection: 'pages',
  where: { _status: { equals: 'published' } },
  limit: 1000,
  depth: 0,
})
const redirects = await payload.find({ collection: 'case-redirects', limit: 1000, depth: 0 })
const menu: any = await payload.findGlobal({ slug: 'menu', depth: 0 })
const settings: any = await payload.findGlobal({ slug: 'site-settings', depth: 0 })

const mediaEntries: any[] = []
for (const doc of media.docs as any[]) {
  if (!doc.filename) continue
  const source = path.join(cmsDir, 'media', doc.filename)
  if (!existsSync(source)) throw new Error(`媒体文件不存在：${doc.filename}`)
  copyFileSync(source, path.join(mediaDir, doc.filename))
  mediaEntries.push({
    id: String(doc.id),
    filename: doc.filename,
    alt: doc.alt || doc.filename,
  })
}

const manifest = {
  version: 1,
  exportedAt: new Date().toISOString(),
  media: mediaEntries,
  caseCategories: (categories.docs as any[]).map((doc) => ({
    id: String(doc.id),
    title: doc.title,
    slug: doc.slug,
    banner: doc.banner == null ? null : String(doc.banner),
    subtitle: doc.subtitle || '',
    pageSize: Number(doc.pageSize) || 12,
  })),
  cases: (cases.docs as any[]).map((doc) => ({
    id: String(doc.id),
    title: doc.title,
    slug: doc.slug,
    category: String(doc.category?.id ?? doc.category),
    cover: String(doc.cover?.id ?? doc.cover),
    publishedAt: doc.publishedAt,
    body: doc.body,
  })),
  pages: (pages.docs as any[]).map((doc) => ({
    id: String(doc.id),
    title: doc.title,
    route: doc.route,
    blocks: doc.blocks || [],
  })),
  menu: { items: menu?.items || [] },
  siteSettings: {
    logo: settings?.logo?.id ?? settings?.logo ?? null,
    footerLogo: settings?.footerLogo?.id ?? settings?.footerLogo ?? null,
    footerInfo: (settings?.footerInfo || []).map((item: any) => ({ label: item.label, text: item.text })),
    footerQr: (settings?.footerQr || []).map((item: any) => ({
      label: item.label,
      image: item.image?.id ?? item.image ?? null,
    })),
    footerContactLabel: settings?.footerContactLabel || '',
    footerContactPage: settings?.footerContactPage?.id ?? settings?.footerContactPage ?? null,
    copyright: settings?.copyright || '',
    langCurrentLabel: settings?.langCurrentLabel || '',
    langOtherLabel: settings?.langOtherLabel || '',
    langOtherUrl: settings?.langOtherUrl || '',
  },
  caseRedirects: (redirects.docs as any[]).map((doc) => ({ from: doc.from, to: doc.to })),
}

writeFileSync(path.join(seedDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({
  seedDir,
  media: manifest.media.length,
  categories: manifest.caseCategories.length,
  cases: manifest.cases.length,
  pages: manifest.pages.length,
  redirects: manifest.caseRedirects.length,
}, null, 2))

await payload.destroy()
process.exit(0)

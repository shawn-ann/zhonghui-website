import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

function normalizeRoute(link: string): string {
  const clean = link.trim()
  if (clean === '/') return '/'
  return `/${clean.replace(/^\/+/, '').replace(/\/+$/, '')}/`
}

function isExternalScheme(link: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(link)
}

function migrate(blocks: any, routes: Map<string, number | string>): any[] | null {
  if (!Array.isArray(blocks)) return null
  let changed = false
  const next = blocks.map((b) => {
    const out = { ...b }
    const needsMigration = (b?.blockType === 'imageText' || b?.blockType === 'iconCard')
      && (!b.linkType || b.linkType === 'none')
      && b.link
    if (needsMigration) {
      const link = String(b.link).trim()
      if (link.startsWith('/') && routes.has(normalizeRoute(link))) {
        out.linkType = 'internal'
        out.internalPage = routes.get(normalizeRoute(link))
        out.externalUrl = null
      } else {
        out.linkType = 'external'
        out.externalUrl = link
        out.internalPage = null
      }
      delete out.link
      changed = true
    }
    if (Array.isArray(b?.children)) {
      const kids = migrate(b.children, routes)
      if (kids) { out.children = kids; changed = true }
    }
    return out
  })
  return changed ? next : null
}

const published = await payload.find({ collection: 'pages', limit: 1000, pagination: false })
const routes = new Map<string, number | string>()
for (const doc of published.docs as any[]) routes.set(normalizeRoute(String(doc.route || '/')), doc.id)

let updated = 0
for (const doc of published.docs as any[]) {
  const nextPublished = migrate(doc.blocks, routes)
  if (nextPublished) {
    await payload.update({ collection: 'pages', id: doc.id, data: { blocks: nextPublished } })
    updated++
    console.log(`migrated published page ${doc.id}`)
  }

  const latest = await payload.findByID({ collection: 'pages', id: doc.id, draft: true })
  const nextDraft = migrate((latest as any).blocks, routes)
  if (nextDraft) {
    await payload.update({ collection: 'pages', id: doc.id, data: { blocks: nextDraft }, draft: true })
    updated++
    console.log(`migrated draft page ${doc.id}`)
  }
}

console.log(`done: ${updated} revision(s) updated, ${published.docs.length} page(s) scanned`)
await payload.destroy()
process.exit(0)

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const BG_SPLIT_TYPES = new Set(['section', 'grid', 'gridInner'])

function isImage(v: string) {
  const s = v.trim()
  return /^(https?:)?\/\//.test(s) || s.startsWith('/') || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(s)
}

/** 把分栏/网格旧的单个 bg 拆成 bgImage / bgColor；返回 null 表示无变化。 */
function migrate(blocks: any): any[] | null {
  if (!Array.isArray(blocks)) return null
  let changed = false
  const next = blocks.map((b) => {
    const out = { ...b }
    if (BG_SPLIT_TYPES.has(b?.blockType)) {
      if (b.bg) {
        if (isImage(b.bg)) {
          if (!out.bgImage) out.bgImage = b.bg
        } else if (!out.bgColor) {
          out.bgColor = b.bg
        }
        delete out.bg
        changed = true
      }
    }
    if (Array.isArray(b?.children)) {
      const kids = migrate(b.children)
      if (kids) { out.children = kids; changed = true }
    }
    return out
  })
  return changed ? next : null
}

const found = await payload.find({ collection: 'pages', limit: 1000, pagination: false })

let updated = 0
for (const doc of found.docs as any[]) {
  const published = migrate(doc.blocks)
  if (published) {
    await payload.update({ collection: 'pages', id: doc.id, data: { blocks: published } })
    updated++
    console.log(`migrated published page ${doc.id} (${doc.route})`)
  }

  const latest = await payload.findByID({ collection: 'pages', id: doc.id, draft: true })
  const draft = migrate((latest as any).blocks)
  if (draft) {
    await payload.update({ collection: 'pages', id: doc.id, data: { blocks: draft }, draft: true })
    updated++
    console.log(`migrated draft page ${doc.id} (${doc.route})`)
  }
}

console.log(`done: ${updated} revision(s) updated, ${found.docs.length} page(s) scanned`)
await payload.destroy()
process.exit(0)

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

function wrapLegacy(block: any) {
  const { bg, alt, ...rest } = block
  return {
    blockType: 'section',
    paddingY: block.blockType === 'banner' ? 'none' : 'md',
    ...(bg ? { bg } : {}),
    ...(alt ? { alt } : {}),
    children: [rest],
  }
}

/** Returns wrapped blocks, or null when the page is already section-first. */
function normalize(blocks: any): any[] | null {
  const list = Array.isArray(blocks) ? blocks : []
  if (!list.some((b) => b?.blockType !== 'section')) return null
  return list.map((b) => (b?.blockType === 'section' ? b : wrapLegacy(b)))
}

const found = await payload.find({ collection: 'pages', limit: 1000, pagination: false })

let updated = 0
for (const doc of found.docs as any[]) {
  const published = normalize(doc.blocks)
  if (published) {
    await payload.update({ collection: 'pages', id: doc.id, data: { blocks: published } })
    updated++
    console.log(`normalized published page ${doc.id} (${doc.route})`)
  }

  const latest = await payload.findByID({ collection: 'pages', id: doc.id, draft: true })
  const draft = normalize((latest as any).blocks)
  if (draft) {
    await payload.update({ collection: 'pages', id: doc.id, data: { blocks: draft }, draft: true })
    updated++
    console.log(`normalized draft page ${doc.id} (${doc.route})`)
  }
}

console.log(`done: ${updated} revision(s) updated, ${found.docs.length} page(s) scanned`)
await payload.destroy()
process.exit(0)

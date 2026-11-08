import 'dotenv/config'

process.env.DISABLE_AUTO_REBUILD = '1'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const storySlugs = ['xiaocao', 'xiaoding']
const cases = await payload.find({
  collection: 'cases',
  where: { slug: { in: storySlugs } },
  limit: 10,
  depth: 0,
})
const caseBySlug = new Map(cases.docs.map((doc: any) => [String(doc.slug), doc]))

const home = await payload.find({
  collection: 'pages',
  where: { route: { equals: '/' } },
  limit: 1,
  depth: 0,
})
const doc = home.docs[0] as any
if (!doc) throw new Error('首页不存在')

const slugByTitle: Record<string, string> = {
  '小曹同学的赴美之旅': 'xiaocao',
  '小丁同学的逆袭故事': 'xiaoding',
}

const walk = (blocks: any[]) => {
  for (const block of blocks || []) {
    if (block.blockType === 'imageText' && slugByTitle[String(block.title)]) {
      const item = caseBySlug.get(slugByTitle[String(block.title)])
      if (item) {
        block.linkType = 'case'
        block.caseItem = item.id
        block.internalPage = null
        block.externalUrl = null
        block.link = null
      }
    }
    if (block.children) walk(block.children)
  }
  return blocks
}

await payload.update({
  collection: 'pages',
  id: doc.id,
  draft: false,
  data: { blocks: walk(doc.blocks || []), _status: 'published' },
})

console.log(JSON.stringify({ page: doc.id, cases: [...caseBySlug.keys()] }, null, 2))
process.exit(0)

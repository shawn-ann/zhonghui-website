import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { textBlocksToRichText } from '../src/generate/textBlocksToRichText'

const payload = await getPayload({ config })

const found = await payload.find({
  collection: 'pages',
  where: { route: { equals: '/study-abroad/' } },
  limit: 1,
  draft: true,
  depth: 0,
})

const page = found.docs[0] as any
if (!page) throw new Error('Page /study-abroad/ not found')

const blocks = (page.blocks || []) as any[]
const section = blocks.find((block) => {
  if (block.blockType !== 'section') return false
  return (block.children || []).some(
    (child: any) => child.blockType === 'heading' && child.title === '海外留学项目',
  )
})
if (!section) throw new Error('Section 海外留学项目 not found')

const stack = (section.children || []).find((child: any) => child.blockType === 'stack')
if (!stack) throw new Error('Stack under 海外留学项目 not found')

const children = (stack.children || []) as any[]
if (children.length === 1 && children[0].blockType === 'richtext') {
  console.log('Page 49 already uses rich text for 海外留学项目; nothing to do.')
  process.exit(0)
}
if (!children.length || children.some((child) => child.blockType !== 'text')) {
  throw new Error('Expected only text children under the 海外留学项目 stack; aborting without changes.')
}

const nextBlocks = blocks.map((block) => {
  if (block !== section) return block
  return {
    ...block,
    children: (block.children || []).map((child: any) => {
      if (child !== stack) return child
      return { ...child, children: [textBlocksToRichText(children)] }
    }),
  }
})

await payload.update({
  collection: 'pages',
  id: page.id,
  draft: true,
  data: { blocks: nextBlocks },
})

console.log(`Converted ${children.length} text blocks to rich text on page ${page.id}.`)
process.exit(0)

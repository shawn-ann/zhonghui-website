import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { textBlocksToRichText } from '../src/generate/textBlocksToRichText'

const payload = await getPayload({ config })

const found = await payload.find({
  collection: 'pages',
  where: { route: { equals: '/about/' } },
  limit: 1,
  draft: true,
  depth: 0,
})

const page = found.docs[0] as any
if (!page) throw new Error('Page /about/ not found')

const blocks = (page.blocks || []) as any[]
const section = blocks.find((block) => {
  if (block.blockType !== 'section') return false
  return (block.children || []).some(
    (child: any) => child.blockType === 'heading' && child.title === '公司介绍',
  )
})
if (!section) throw new Error('Section 公司介绍 not found')

const grid = (section.children || []).find((child: any) => child.blockType === 'grid')
if (!grid) throw new Error('Grid under 公司介绍 not found')

const stack = (grid.children || []).find((child: any) => child.blockType === 'stack')
if (!stack) throw new Error('Stack under 公司介绍 not found')

const children = (stack.children || []) as any[]
if (children.length === 1 && children[0].blockType === 'richtext') {
  console.log('Page 47 company intro already uses rich text; nothing to do.')
  process.exit(0)
}
if (!children.length || children.some((child) => child.blockType !== 'text')) {
  throw new Error('Expected only text children under the 公司介绍 stack; aborting without changes.')
}

const textBlocks = children.map((child) => {
  const heading = Number(child.fontSize) >= 17 && Number(child.fontWeight) >= 600
  return {
    body: String(child.body || ''),
    fontSize: heading ? 20 : 15,
    fontWeight: heading ? '700' : undefined,
  }
})

const nextBlocks = blocks.map((block) => {
  if (block !== section) return block
  return {
    ...block,
    children: (block.children || []).map((child: any) => {
      if (child !== grid) return child
      return {
        ...child,
        children: (child.children || []).map((inner: any) => {
          if (inner !== stack) return inner
          return { ...inner, children: [textBlocksToRichText(textBlocks)] }
        }),
      }
    }),
  }
})

await payload.update({
  collection: 'pages',
  id: page.id,
  draft: true,
  data: { blocks: nextBlocks },
})

console.log(`Converted 公司介绍 text blocks to rich text on page ${page.id}.`)
process.exit(0)

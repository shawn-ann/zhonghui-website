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
    (child: any) => child.blockType === 'heading' && child.title === '创始团队',
  )
})
if (!section) throw new Error('Section 创始团队 not found')

const children = (section.children || []) as any[]
const info = children.find(
  (child) => child.blockType === 'infoList' && child.title === '专业师资团队',
)
if (!info) {
  const already = children.some(
    (child) => child.blockType === 'stack'
      && (child.children || []).some(
        (inner: any) => inner.blockType === 'richtext'
          && inner.content?.root?.children?.[0]?.children?.[0]?.text === '专业师资团队',
      ),
  )
  if (already) {
    console.log('Page 47 already uses rich text for 专业师资团队; nothing to do.')
    process.exit(0)
  }
  throw new Error('InfoList 专业师资团队 not found; aborting without changes.')
}

const items = (info.items || []) as Array<{ label?: string; desc?: string }>
const textBlocks = [
  { body: String(info.title || '专业师资团队'), fontSize: 20, fontWeight: '700' },
  ...items.map((item) => ({
    body: item.label ? `${item.label}：${item.desc || ''}` : item.desc || '',
    fontSize: 15,
  })),
]

const replacement = {
  blockType: 'stack',
  gap: 'sm',
  bgColor: '#FFFFFF',
  padding: 40,
  children: [textBlocksToRichText(textBlocks)],
}

const nextBlocks = blocks.map((block) => {
  if (block !== section) return block
  return {
    ...block,
    children: (block.children || []).map((child: any) => child === info ? replacement : child),
  }
})

await payload.update({
  collection: 'pages',
  id: page.id,
  draft: true,
  data: { blocks: nextBlocks },
})

console.log(`Converted 专业师资团队 to rich text on page ${page.id}.`)
process.exit(0)

import 'dotenv/config'

process.env.DISABLE_AUTO_REBUILD = '1'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const textNode = (text: string, options: { bold?: boolean; color?: string } = {}) => ({
  detail: 0,
  format: options.bold ? 1 : 0,
  mode: 'normal',
  style: options.color ? `color: ${options.color}` : '',
  text,
  type: 'text',
  version: 1,
})
const paragraph = (text: string, options: { bold?: boolean; color?: string } = {}) => ({
  children: [textNode(text, options)],
  direction: 'ltr',
  format: 'center',
  indent: 0,
  type: 'paragraph',
  version: 1,
  textFormat: 0,
})

const content = {
  root: {
    children: [
      paragraph('在中惠，我们始终相信，文化交流没有唯一的标准答案。每位同学的兴趣和目标不同：有人适合通过带薪实习提升职场能力，有人希望在营地生活中锻炼综合能力，还有人想通过互惠生深度体验美国家庭生活。不同项目面向不同需求，我们的使命是帮每一位同学找到最适合自己的交流方式。'),
      paragraph('专业，不是局限，而是选择适合的路。', { bold: true, color: '#8A0E4B' }),
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
}

const found = await payload.find({
  collection: 'pages',
  where: { route: { equals: '/about/' } },
  limit: 1,
  depth: 0,
})
const page: any = found.docs[0]
if (!page) throw new Error('关于中惠页面不存在')

let replaced = false
const blocks = (page.blocks || []).map((block: any) => {
  if (block.blockType !== 'section') return block
  const children = block.children || []
  const heading = children.find((child: any) => child.blockType === 'heading' && child.title === '中惠理念')
  if (!heading) return block

  const texts = children.filter((child: any) => child.blockType === 'text')
  if (!texts.length) return block

  const afterTexts = children.slice(children.lastIndexOf(texts[texts.length - 1]) + 1)
  replaced = true
  return {
    ...block,
    children: [
      ...children.slice(0, children.indexOf(texts[0])),
      { blockType: 'richtext', content },
      ...afterTexts,
    ],
  }
})

if (!replaced) throw new Error('未找到「中惠理念」文本块')

await payload.update({
  collection: 'pages',
  id: page.id,
  draft: false,
  data: { blocks, _status: 'published' },
})

console.log(JSON.stringify({ page: page.id, route: page.route, replaced }, null, 2))
process.exit(0)

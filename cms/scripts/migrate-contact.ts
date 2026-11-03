import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { textBlocksToRichText } from '../src/generate/textBlocksToRichText'

const payload = await getPayload({ config })

const img = (file: string) => path.resolve(process.cwd(), '../img', file)
const staticFile = (file: string) => path.resolve(process.cwd(), 'src/static', file)

const existingMedia = await payload.find({ collection: 'media', limit: 1000, depth: 0 })
const mediaByStem = new Map<string, number | string>()
for (const doc of existingMedia.docs as any[]) {
  const stem = String(doc.filename || '').replace(/\.[^.]+$/, '')
  if (stem) mediaByStem.set(stem, doc.id)
}

async function ensureMedia(filename: string, filePath: string, alt: string): Promise<number | string> {
  const stem = filename.replace(/\.[^.]+$/, '')
  const found = mediaByStem.get(stem)
  if (found != null) return found
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    filePath,
  })
  mediaByStem.set(stem, (doc as any).id)
  return (doc as any).id
}

const media = (file: string) => ensureMedia(file, img(file), file.replace(/\.[^.]+$/, ''))

const textNode = (text: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  type: 'text',
  version: 1,
})

const paragraph = (text: string) => ({
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'paragraph',
  version: 1,
  textFormat: 0,
})

const listItem = (text: string, index: number) => ({
  children: [paragraph(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'listitem',
  version: 1,
  value: index + 1,
})

const orderedList = (items: string[]) => ({
  children: items.map(listItem),
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'list',
  version: 1,
  listType: 'number',
  start: 1,
  tag: 'ol',
})

const richText = (children: any[]) => ({
  root: {
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

const section = (children: any[], extra: Record<string, unknown> = {}) => ({
  blockType: 'section',
  paddingY: 'md',
  bgImage: null,
  bgColor: null,
  bgGradient: null,
  bgHeight: 0,
  paddingCustom: 0,
  contentGap: 0,
  ...extra,
  children,
})

const richTextBlock = (children: any[]) => ({
  blockType: 'richtext',
  content: richText(children),
})

const hero = await media('about-hero.jpg')
const pattern = await ensureMedia('pattern-box-5.svg', staticFile('pattern-box-5.svg'), 'contact-pattern')
const qrPath = staticFile('contact-qr.svg')
const qr = fs.existsSync(qrPath)
  ? await ensureMedia('contact-qr.svg', qrPath, 'contact-qr')
  : ''

const socialIcons = await Promise.all([
  ensureMedia('icon-zhihu.png', img('icon-zhihu.png'), '知乎'),
  ensureMedia('icon-xiaohongshu.png', img('icon-xiaohongshu.png'), '小红书'),
  ensureMedia('icon-facebook.png', img('icon-facebook.png'), 'Facebook'),
  ensureMedia('icon-douyin.png', img('icon-douyin.png'), '抖音'),
  ensureMedia('icon-bilibili.png', img('icon-bilibili.png'), '哔哩哔哩'),
])

const socialAccounts = [
  ['知乎', '中惠互惠生'],
  ['小红书', '中惠互惠生'],
  ['Facebook', '中惠文化'],
  ['抖音', '中惠文化—互惠生中心'],
  ['哔哩哔哩', '中惠互惠生'],
] as const

const blocks: any[] = [
  {
    blockType: 'section',
    paddingY: 'none',
    children: [
      {
        blockType: 'banner',
        variant: 'split',
        title: '联系我们',
        sub: '欢迎随时咨询中惠文化 · 一对一专属服务',
        image: hero,
        pattern,
      },
    ],
  },
  section([
    { blockType: 'heading', title: '联系方式', align: 'center', titleColor: '#FFFFFF' },
    {
      blockType: 'stack',
      gap: 'sm',
      bgColor: '#FFFFFF',
      padding: 32,
      children: [
        textBlocksToRichText([
          { body: '🌐 中文官网：www.chinaaupairs.com', fontSize: 15 },
          { body: '🌐 英文官网：www.aupaircn.com', fontSize: 15 },
          { body: '📍 地址：北京东城区绿景馨园东区12号楼', fontSize: 15 },
          { body: '📞 电话：010-64159286', fontSize: 15 },
          { body: '✉ 邮箱：info@zhonghui.com', fontSize: 15 },
        ]),
      ],
    },
  ], { bgImage: '/assets/yinji-bg.jpg' }),
  section([
    { blockType: 'heading', title: '中惠官方账号' },
    {
      blockType: 'grid',
      columns: 5,
      gap: 'md',
      children: socialAccounts.map(([title, desc], index) => ({
        blockType: 'iconCard',
        icon: socialIcons[index],
        title,
        desc,
        variant: 'compact',
      })),
    },
  ], { bgColor: '#FFF1F6' }),
  section([
    { blockType: 'heading', title: '扫码咨询', align: 'center', titleColor: '#FFFFFF' },
    {
      blockType: 'grid',
      layout: 'rows',
      columns: 6,
      gap: 'md',
      children: [
        {
          blockType: 'gridRow',
          columns: 6,
          gap: 'md',
          columnRatio: '1:1:1:1:1:1',
          children: [
            { blockType: 'gridCell', children: [] },
            { blockType: 'gridCell', children: [] },
            {
              blockType: 'gridCell',
              children: [
                { blockType: 'imageText', media: qr, title: '公众号', desc: '公众号二维码', imageRatio: '1:1', imageFit: 'contain' },
              ],
            },
            {
              blockType: 'gridCell',
              children: [
                { blockType: 'imageText', media: qr, title: '咨询微信', desc: '咨询微信二维码', imageRatio: '1:1', imageFit: 'contain' },
              ],
            },
            { blockType: 'gridCell', children: [] },
            { blockType: 'gridCell', children: [] },
          ],
        },
      ],
    },
  ], { bgImage: '/assets/yinji-bg.jpg' }),
  section([
    { blockType: 'heading', title: '温馨提示' },
    {
      blockType: 'stack',
      gap: 'sm',
      bgColor: '#FFFFFF',
      padding: 32,
      children: [
        richTextBlock([
          orderedList([
            '岗位匹配仅为咨询推荐服务，不保证获取录用 offer；',
            '海外薪资、工作内容、排班由当地合作方确定，不承诺固定收益；',
            '海外就业遵守当地法规，雇主与参与者可依法调整合作关系；',
            '项目体验因人而异，成长收获取决于个人主动参与。',
          ]),
        ]),
      ],
    },
  ], { bgColor: '#FFF1F6' }),
]

const found = await payload.find({
  collection: 'pages',
  where: { route: { equals: '/contact/' } },
  limit: 1,
  draft: true,
  depth: 0,
})

let result: { action: string; id: number | string; route: string }
if (found.docs[0]) {
  await payload.update({
    collection: 'pages',
    id: (found.docs[0] as any).id,
    draft: true,
    data: { title: '联系我们', route: '/contact/', blocks, _status: 'draft' },
  })
  result = { action: 'updated', id: (found.docs[0] as any).id, route: '/contact/' }
} else {
  const doc = await payload.create({
    collection: 'pages',
    draft: true,
    data: { title: '联系我们', route: '/contact/', blocks, _status: 'draft' },
  })
  result = { action: 'created', id: (doc as any).id, route: '/contact/' }
}

console.log(JSON.stringify(result, null, 2))
process.exit(0)

import 'dotenv/config'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const img = (file: string) => path.resolve(process.cwd(), '../img', file)

const existingMedia = await payload.find({ collection: 'media', limit: 1000, depth: 0 })
const mediaByStem = new Map<string, number | string>()
for (const doc of existingMedia.docs as any[]) {
  const stem = String(doc.filename || '').replace(/\.[^.]+$/, '')
  if (stem) mediaByStem.set(stem, doc.id)
}

async function media(file: string): Promise<number | string> {
  const stem = file.replace(/\.[^.]+$/, '')
  const found = mediaByStem.get(stem)
  if (found != null) return found
  const doc = await payload.create({
    collection: 'media',
    data: { alt: file.replace(/\.[^.]+$/, '') },
    filePath: img(file),
  })
  mediaByStem.set(stem, (doc as any).id)
  return (doc as any).id
}

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

const heading = (tag: 'h2' | 'h3', text: string) => ({
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'heading',
  version: 1,
  tag,
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
const pattern = await media('pattern-box-5.svg')
const gallery1 = await Promise.all(['nz-1.jpg', 'nz-2.jpg', 'nz-3.jpg'].map(media))
const gallery2 = await Promise.all(['nz-4.jpg', 'nz-5.jpg', 'nz-6.png'].map(media))

const blocks: any[] = [
  {
    blockType: 'section',
    paddingY: 'none',
    children: [
      {
        blockType: 'banner',
        variant: 'split',
        title: '新西兰留学',
        sub: '南太平洋优质教育 · 安全宜居',
        image: hero,
        pattern,
      },
    ],
  },
  section([
    {
      blockType: 'stack',
      gap: 'sm',
      bgColor: '#FFFFFF',
      padding: 40,
      children: [
        richTextBlock([
          heading('h2', '新西兰留学'),
          paragraph('新西兰地处南太平洋，气候宜人、环境清新、森林资源丰富、旅游胜地遍布、风景优美、地表景观富变化，生活水平也相当高，排名联合国人类发展指数第 3 位。新西兰作为世界发达国家和世界公认的五大英语国家之一，其教育水平和教学质量一直位于世界前列。调查显示：新西兰的教育指数排名第一，并且多项指数都名列前茅，是全球教育体制最好的国家之一。此外，新西兰不但留学费用合理、移民政策好，还可作为世界顶尖名校的跳板。因此，新西兰已经日益成为广受国际学生关注的热点留学国家之一。'),
        ]),
        {
          blockType: 'gallery',
          columns: 3,
          images: gallery1.map((image) => ({ image })),
        },
        richTextBlock([
          heading('h3', '一、教学质量高，教育体制完善'),
          paragraph('新西兰和英国的教育制度一脉相承，教学作风严谨，注重学生综合能力的培养，教育质量达到国际一流水平。学校以公立为主，设施完备，质量卓越。新西兰八所公立大学中，有 7 所在最新的 QS 世界大学排行榜上位列 500 强；奥克兰大学、奥塔哥大学、坎特伯雷大学、维多利亚大学、梅西大学、怀卡托大学、奥克兰理工大学、林肯大学也各具特色，拥有诸多强势专业，在全世界广受赞誉。'),
          heading('h3', '二、社会治安好，家长的放心选择'),
          paragraph('如今，越来越多的中国学生选择去国外留学，随之而来的是留学生在国外的安全问题。新西兰是全球公认的世界最安全的国家之一，特别是对于选择出国读中学、甚至小学，新西兰安全的社会体系以及灵活的陪读制度，都是低龄留学生家长最放心的选择。'),
          heading('h3', '三、移民政策宽松，留学就业移民一步到位'),
          paragraph('新西兰是高福利的移民国家，移民政策宽松，持有新西兰签证可以合法在新西兰和澳大利亚工作。根据新西兰政府的最新政策，在新西兰留学的学生毕业后可以享受两次为期一年的工作签证（即开放式工作签证）的机会。而新西兰的移民政策对于申请人所学专业并没有严格的限制，任何专业的毕业生只要在毕业后找到工作，都有机会获得移民批准。这对于希望通过海外留学同时获得移民绿卡的申请人非常地有吸引力。'),
        ]),
        {
          blockType: 'gallery',
          columns: 3,
          images: gallery2.map((image) => ({ image })),
        },
        richTextBlock([
          heading('h3', '四、留学费用低廉，性价比极高'),
          paragraph('在五大英语系留学国家中，新西兰的留学花费是这几个国家中最低的。每年在新西兰读大学的花费大约为人民币 15–18 万；而对于到新西兰读博士的学生，有机会申请奖学金，即使无法获得奖学金，其学费也跟当地学生一样，仅为几千纽币。新西兰政府还允许国际学生每周打工 20 个小时，不仅可以补贴生活费，也可以接触当地文化、锻炼英文。相对于主流英语留学国家动辄 20–30 万每年的花费，学生在完成学业后还可获得工作机会及移民资格的多重收获，可谓是性价比和回报率都极高的选择。'),
          heading('h3', '五、无语言要求，资金担保形式灵活，签证成功率高'),
          paragraph('新西兰留学不强制要求标准化英文考试成绩，留学生可以选择到新西兰先读英文再读专业课，因此，没有英文成绩无论是入学申请还是办理签证都不会受到影响。即使是最好的奥克兰大学，也不会因为申请人的英文成绩不够而影响录取，这对于希望尽快出国、又想进好大学的学生来说，是极为灵活的选择。'),
          paragraph('此外，办理新西兰签证的时候除了家庭存款，也可以通过留学专有账户的形式来满足移民局的要求，形式灵活、更易获签。新西兰办理签证周期短、无需面签，通过新西兰移民局推荐的特许中介 NZSA 提交的签证申请通常 10 天就会获签。这些优势都保障了希望到新西兰读书的申请人可以顺利成行，无需为面签或拒签过于担忧和紧张。'),
        ]),
      ],
    },
  ], { bgColor: '#FFF1F6' }),
]

const found = await payload.find({
  collection: 'pages',
  where: { route: { equals: '/new-zealand/' } },
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
    data: { title: '新西兰留学', route: '/new-zealand/', blocks, _status: 'draft' },
  })
  result = { action: 'updated', id: (found.docs[0] as any).id, route: '/new-zealand/' }
} else {
  const doc = await payload.create({
    collection: 'pages',
    draft: true,
    data: { title: '新西兰留学', route: '/new-zealand/', blocks, _status: 'draft' },
  })
  result = { action: 'created', id: (doc as any).id, route: '/new-zealand/' }
}

console.log(JSON.stringify(result, null, 2))
process.exit(0)

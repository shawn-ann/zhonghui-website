import 'dotenv/config'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

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

const media = async (file: string) => ensureMedia(file, img(file), file.replace(/\.[^.]+$/, ''))

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

const heading = (title: string, extra: Record<string, unknown> = {}) => ({
  blockType: 'heading',
  title,
  align: 'center',
  ...extra,
})

const text = (body: string, extra: Record<string, unknown> = {}) => ({
  blockType: 'text',
  body,
  align: 'left',
  ...extra,
})

const subheading = (body: string, first = false) => text(body, {
  fontSize: 20,
  fontWeight: '700',
  bodyColor: '#8A0E4B',
  marginTop: first ? 0 : 26,
})

const paragraph = (body: string) => text(body, { fontSize: 15 })

const hero = await media('about-hero.jpg')
const pattern = await ensureMedia('pattern-box-5.svg', staticFile('pattern-box-5.svg'), 'study-pattern')

const destinations = [
  ['study-us.jpg', '美国留学'],
  ['study-uk.jpg', '英国留学'],
  ['study-au.jpg', '澳大利亚留学'],
  ['study-nz.jpg', '新西兰留学'],
  ['study-other.jpg', '其他国家留学'],
] as const

const destinationCards = await Promise.all(
  destinations.map(async ([file, title]) => ({
    blockType: 'imageText',
    media: await media(file),
    title,
    imageRatio: '16:9',
  })),
)

const blocks: any[] = [
  {
    blockType: 'section',
    paddingY: 'none',
    children: [
      {
        blockType: 'banner',
        variant: 'split',
        title: '海外留学',
        sub: '名校申请 · 一站式规划',
        image: hero,
        pattern,
      },
    ],
  },
  section([
    heading('海外留学项目', { titleColor: '#FFFFFF' }),
    {
      blockType: 'stack',
      gap: 'sm',
      bgColor: '#FFFFFF',
      padding: 40,
      children: [
        subheading('美国留学 · 奖学金计划', true),
        paragraph('美国高校奖学金 GOCAMPUS 项目是由美国发起的一项全球性的教育扶持计划。该项目借助教育专家的思维、眼光和经验，让国际学生走出留学误区，做到择校更准、费用更低廉、毕业率更高，由最大的非营利性教育基金会 ASSE 具体执行。该项目已经执行多年，2009 年末正式进入到中国大陆地区，全球每年有 3000 名左右的学生被允许进入该计划。'),
        paragraph('可以进入该计划的学生将有机会获得美国高校的全额奖学金（吃住学全免费）或高额奖学金（最低 8 万 RMB 吃住学一整年），并将得到美国教育专家的专业评估和准确定位，推荐最适合的美国高校及专业（一般至少会推荐 9 所，并均受到中国教育部认可），保证录取。除此之外，该计划全球领事馆备案，签证通过率高，并且美国国会出专函助签，以提高学生获得签证的成功率！参加此项目的学生 100% 拿到奖学金！！！我甄选中心现引进该计划，并获得 50 个名额，大家踊跃报名吧！'),
        subheading('英国留学'),
        paragraph('英国是世界第二大留学目的国，每年有超过 65 万国际学生在英国的大学、学院和寄宿中学学习，另外还有约 58 万学生在英国学习短期英语语言课程。2011 年在英国攻读高等教育的国际学生占全球总数的 13%。2011/12 年，共有 43 万 5 千国际学生在 163 所公立高等教育院校就读，还有 5 万 3 千在 159 所另外的院校就读，其中 70% 的学生读本科课程。英国是世界上最大的英语语言学习目的国，全球近一半的国际学生去英国学习英语。你不是一个人，大家踊跃报名吧！'),
        subheading('其他留学项目'),
        paragraph('加拿大，西班牙研究生，德国研究生'),
      ],
    },
  ], { bgImage: '/assets/yinji-bg.jpg' }),
  section([
    heading('热门留学目的地'),
    {
      blockType: 'grid',
      columns: 3,
      gap: 'md',
      children: destinationCards,
    },
  ], { bgColor: '#FFF1F6' }),
]

const found = await payload.find({
  collection: 'pages',
  where: { route: { equals: '/study-abroad/' } },
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
    data: { title: '海外留学', route: '/study-abroad/', blocks, _status: 'draft' },
  })
  result = { action: 'updated', id: (found.docs[0] as any).id, route: '/study-abroad/' }
} else {
  const doc = await payload.create({
    collection: 'pages',
    draft: true,
    data: { title: '海外留学', route: '/study-abroad/', blocks, _status: 'draft' },
  })
  result = { action: 'created', id: (doc as any).id, route: '/study-abroad/' }
}

console.log(JSON.stringify(result, null, 2))
process.exit(0)

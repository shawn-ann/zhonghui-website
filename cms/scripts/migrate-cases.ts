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

async function ensureMedia(filename: string, alt: string): Promise<number | string> {
  const stem = filename.replace(/\.[^.]+$/, '')
  const found = mediaByStem.get(stem)
  if (found != null) return found
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    filePath: img(filename),
  })
  mediaByStem.set(stem, (doc as any).id)
  return (doc as any).id
}

const textNode = (text: string) => ({
  detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1,
})

const paragraph = (text: string) => ({
  children: [textNode(text)], direction: 'ltr', format: '', indent: 0,
  type: 'paragraph', version: 1, textFormat: 0,
})

const heading = (tag: 'h2' | 'h3', text: string) => ({
  children: [textNode(text)], direction: 'ltr', format: '', indent: 0,
  type: 'heading', version: 1, tag,
})

const quote = (text: string) => ({
  children: [paragraph(text)], direction: 'ltr', format: '', indent: 0,
  type: 'quote', version: 1,
})

const imageRow = (files: string[]) => ({
  type: 'image-row', version: 1,
  images: files.map((file) => ({ src: `/api/media/file/${file}`, alt: '' })),
})

const richText = (children: any[]) => ({
  root: { children, direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 },
})

const xiaocaoBody = richText([
  paragraph('小曹同学是中惠 24 年的 SWTer，在读大三时，便毅然选择报名中惠 SWT 赴美带薪实习项目。对她来说，这不仅是一份暑期工作，更是一次真正走出课堂、独立生活的机会。'),
  paragraph('从报名咨询到最终成行，前后不过几个月，却让她完成了一次从忐忑到笃定的转变。'),
  heading('h2', '一、从忐忑到笃定'),
  paragraph('最初，小曹对项目流程几乎是陌生的：什么是 DS-2019、面试会问些什么、岗位怎么匹配，她心里都没底。前期准备阶段，顾问老师陪她反复打磨简历、模拟面试，把每一个可能被问到的细节都提前演练了一遍。'),
  paragraph('真正让她安心的，是整个过程都被安排得井井有条：材料清单逐项核对、时间节点提前提醒、遇到疑问随时能找到人解答。她笑说，原本最担心的“手忙脚乱”，最后反而成了最省心的部分。'),
  heading('h2', '二、在异国的第一份工作'),
  paragraph('抵达美国后，小曹很快适应了工作岗位的节奏。和来自不同国家的同事一起排班、配合，从一开始的生疏到后来的默契，她学会用并不完美的英语去沟通、去解决问题，也在一次次被需要中慢慢建立起自信。'),
  paragraph('下班之后，她和其他 J1 学员一起做饭、逛超市、计划周末的短途旅行。陌生的城市慢慢有了熟悉的街角，语言、文化、生活方式，都在日常的相处里被一点点理解。她发现，真正拉开人与人距离的从来不是语言，而是愿不愿意主动迈出那一步。'),
  heading('h2', '三、带回来的不只是一段旅程'),
  paragraph('两个多月的时间，小曹带回来的不只是几张照片和一份工作经历，还有一个更独立、更从容的自己。她开始习惯主动开口，也更清楚自己未来想走的路。'),
  quote('“出发前我以为自己只是去打一份工，回来后才发现，认识这个世界的过程，也是在重新认识自己。”'),
  paragraph('如今，她把这段经历分享给学弟学妹：如果暑假只有一次可以用来远行，那就别让胆怯替你决定。迈出第一步，剩下的路，中惠会陪你一起走。'),
])

const xiaodingBody = richText([
  paragraph('小丁同学是一位前期入库英语被系统自动降分的 boy，提交入库的那一版视频已经是他当下最好的一版。因为入库一直没有企业，他也有过自我怀疑的瞬间。'),
  paragraph('但是焦虑无用。丁同学每天都在练口语、磨听力，一模的时候听到他的口语，远远超出预期。仅仅几个月的时间，丁同学就给我们带来了猝不及防的惊喜。'),
  heading('h2', '一、笨拙的坚持'),
  paragraph('丁同学直到最后匹配岗位都不断地在学习，4 月 28 日顺利一签过签。'),
  quote('英语不好？听不懂？那就只能反复练习。SWT 的签证问题只有这些，在不断的重复、模拟之下，小丁同学终得所愿。'),
  imageRow(['memory-5.jpg', 'memory-6.jpg', 'memory-7.jpg']),
  heading('h2', '二、越努力越幸运'),
  paragraph('当天签证官问到了我们模拟时出现过的问题。运气何尝不是一种努力的表现形式，我们一直相信越努力越幸运——逆袭者没有魔法，只有笨拙的坚持。'),
])

const banner = await ensureMedia('about-hero.jpg', '案例分享 Banner')
const coverXiaocao = await ensureMedia('memory-4.jpg', '小曹同学的赴美之旅')
const coverXiaoding = await ensureMedia('prog-iccp.jpg', '小丁同学的英语逆袭之路')
await ensureMedia('memory-5.jpg', '小丁案例配图 1')
await ensureMedia('memory-6.jpg', '小丁案例配图 2')
await ensureMedia('memory-7.jpg', '小丁案例配图 3')

const categoryData: any = {
  title: '案例分享',
  slug: 'study-case',
  banner,
  subtitle: '来自全国学员的真实案例与经验分享',
  pageSize: 12,
  order: 0,
}

const foundCategory = await payload.find({
  collection: 'case-categories',
  where: { slug: { equals: 'study-case' } },
  limit: 1,
  depth: 0,
})
const category: any = foundCategory.docs[0]
  ? await payload.update({
      collection: 'case-categories',
      id: foundCategory.docs[0].id,
      data: categoryData,
    })
  : await payload.create({ collection: 'case-categories', data: categoryData })

const cases: any[] = [
  {
    title: '小曹同学的赴美之旅',
    slug: 'xiaocao',
    category: category.id,
    cover: coverXiaocao,
    publishedAt: '2025-07-02T00:00:00.000Z',
    publishedPath: '/blog/study-case/xiaocao/',
    body: xiaocaoBody,
    _status: 'published' as const,
  },
  {
    title: '小丁同学的英语逆袭之路',
    slug: 'xiaoding',
    category: category.id,
    cover: coverXiaoding,
    publishedAt: '2025-07-18T00:00:00.000Z',
    publishedPath: '/blog/study-case/xiaoding/',
    body: xiaodingBody,
    _status: 'published' as const,
  },
]

const result: any[] = []
for (const data of cases) {
  const found = await payload.find({
    collection: 'cases',
    where: { slug: { equals: data.slug } },
    limit: 1,
    draft: true,
    depth: 0,
  })
  if (found.docs[0]) {
    const doc = await payload.update({
      collection: 'cases',
      id: found.docs[0].id,
      draft: false,
      data: data as any,
    })
    result.push({ action: 'updated', id: (doc as any).id, slug: data.slug })
  } else {
    const doc = await payload.create({ collection: 'cases', draft: false, data: data as any })
    result.push({ action: 'created', id: (doc as any).id, slug: data.slug })
  }
}

console.log(JSON.stringify({ category: category.id, cases: result }, null, 2))
process.exit(0)

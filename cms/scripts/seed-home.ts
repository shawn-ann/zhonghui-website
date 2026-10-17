import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import path from 'path'

const payload = await getPayload({ config })
const img = (f: string) => path.resolve(process.cwd(), '../img', f)

async function up(file: string, alt: string): Promise<number | string> {
  const found = await payload.find({ collection: 'media', where: { alt: { equals: alt } }, limit: 1 })
  if (found.docs[0]) return (found.docs[0] as any).id
  const doc = await payload.create({ collection: 'media', data: { alt }, filePath: img(file) })
  return (doc as any).id
}

async function upFrom(absPath: string, alt: string): Promise<number | string> {
  const found = await payload.find({ collection: 'media', where: { alt: { equals: alt } }, limit: 1 })
  if (found.docs[0]) return (found.docs[0] as any).id
  const doc = await payload.create({ collection: 'media', data: { alt }, filePath: absPath })
  return (doc as any).id
}

const hero = await up('banner-hero.jpg', 'home-hero')
const pattern = await upFrom(path.resolve(process.cwd(), 'src/static/pattern-box-5.png'), 'home-pattern')
const proj = {
  usAP: await up('prog-au-pair-usa.jpg', 'home-prog-usap'),
  euAP: await up('prog-au-pair-eu.jpg', 'home-prog-euap'),
  swt: await up('prog-swt.jpg', 'home-prog-swt'),
  itp: await up('prog-itp.jpg', 'home-prog-itp'),
  iccp: await up('prog-iccp.jpg', 'home-prog-iccp'),
  laihua: await up('prog-laihua.jpg', 'home-prog-laihua'),
  uk: await up('prog-uk-study.jpg', 'home-prog-uk'),
  us: await up('prog-us-study.jpg', 'home-prog-us'),
}
const mem = [] as (number | string)[]
for (let i = 1; i <= 10; i++) {
  const f = i === 8 ? 'memory-8.png' : i === 1 ? 'memory-1.png' : `memory-${i}.jpg`
  mem.push(await up(f, `home-mem-${i}`))
}

const projectItems = [
  { media: proj.usAP, title: '美国 AuPair', desc: '深入美国家庭，边体验边学习' },
  { media: proj.euAP, title: '欧洲 AuPair', desc: '融入欧洲家庭，拓展国际视野' },
  { media: proj.swt, title: '赴美 SWT', desc: '暑假赴美带薪实习，用工作换旅行' },
  { media: proj.itp, title: '赴美 ITP', desc: '对口专业实习，为履历镀金' },
  { media: proj.iccp, title: '赴美 ICCP', desc: '在美式营地当辅导员，收获成长' },
  { media: proj.laihua, title: '来华', desc: '文化交流与来华项目' },
  { media: proj.uk, title: '英国留学', desc: '英伦名校，开启留学之旅' },
  { media: proj.iccp, title: '澳洲留学', desc: '南半球留学体验' },
  { media: proj.us, title: '美国留学', desc: '美国名校留学申请' },
]

const advantages = [
  { title: '资质齐全', body: '官方认可资质\n合规规范运营\n全流程受监管' },
  { title: '深耕国际交流', body: '多年专注国际交流\n项目经验丰富\n资源持续积累' },
  { title: '一站式服务', body: '材料准备代办\n签证全程辅导\n行前贴心跟进' },
  { title: '全球服务网络', body: '覆盖多个国家\n海外资源丰富\n落地本地支持' },
  { title: '高签证通过率', body: '资深签证辅导\n材料精准把关\n通过率领先' },
  { title: '安全保障', body: '全程护航无忧\n海外紧急联络\n权益保障完善' },
  { title: '专业顾问团队', body: '资深顾问一对一\n熟悉项目全流程\n耐心细致负责' },
  { title: '口碑见证', body: '学员真实好评\n往届案例可查\n家长放心之选' },
]

const blocks: any[] = [
  {
    blockType: 'banner',
    variant: 'split',
    title: '覆盖美国、欧洲、英国、澳洲的文化交流、工作与留学项目',
    sub: '无论你的目标是什么，都有合适的项目为你规划',
    image: hero,
    pattern,
  },
  {
    blockType: 'section',
    bg: '/assets/bg2.jpg',
    padding: 'md',
    children: [
      { blockType: 'heading', title: '项目一览', align: 'center' },
      {
        blockType: 'grid',
        columns: 3,
        gap: 'md',
        children: projectItems.map((p) => ({ blockType: 'imageText', media: p.media, title: p.title, desc: p.desc })),
      },
    ],
  },
  {
    blockType: 'section',
    bg: '#FFF1F6',
    padding: 'md',
    children: [
      { blockType: 'heading', title: '中惠优势', align: 'center' },
      {
        blockType: 'grid',
        columns: 4,
        gap: 'md',
        children: advantages.map((a) => ({ blockType: 'text', title: a.title, body: a.body, align: 'center' })),
      },
    ],
  },
  {
    blockType: 'section',
    bg: '/assets/yinji-bg.jpg',
    padding: 'md',
    children: [
      { blockType: 'heading', title: '中惠印记', align: 'center' },
      { blockType: 'slider', images: mem.map((id) => ({ image: id })) },
    ],
  },
]

await payload.delete({ collection: 'pages', where: { route: { equals: '/' } } }).catch(() => {})
await payload.create({
  collection: 'pages',
  draft: false,
  data: {
    title: '首页',
    route: '/',
    _status: 'published',
    seo: { title: '中惠文化 — 你的国际文化交流可靠伙伴', description: '覆盖美国、欧洲、英国、澳洲的文化交流、工作与留学项目' },
    blocks,
  },
})
console.log('homepage configured (banner+pattern + 项目一览 + 中惠优势 + 中惠印记 sections)')
await payload.destroy()
process.exit(0)

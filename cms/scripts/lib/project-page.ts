import path from 'path'
import { applyProjectCopy } from './project-copy'

export interface ProjectPageConfig {
  title: string
  route: string
  bannerTitle: string
  bannerSub: string
  stripTitle: string
  stripSub: string
  replacements?: Record<string, string>
}

const WHITE = 'color: #FFFFFF'
const textNode = (text: string, style = '') => ({
  detail: 0, format: 0, mode: 'normal', style, text, type: 'text', version: 1,
})
const paragraph = (text: string, style = '') => ({
  children: [textNode(text, style)], direction: 'ltr', format: '', indent: 0,
  type: 'paragraph', version: 1, textFormat: 0,
})
const heading = (tag: 'h2' | 'h3', text: string, style = '') => ({
  children: [textNode(text, style)], direction: 'ltr', format: '', indent: 0,
  type: 'heading', version: 1, tag,
})
const listItem = (text: string) => ({
  children: [textNode(text)], direction: 'ltr', format: '', indent: 0,
  type: 'listitem', version: 1, value: 1,
})
const bulletList = (items: string[]) => ({
  children: items.map(listItem), direction: 'ltr', format: '', indent: 0,
  type: 'list', version: 1, listType: 'bullet', start: 1, tag: 'ul',
})
const imageRow = (files: string[]) => ({
  type: 'image-row', version: 1, columns: 4,
  images: files.map((file) => ({ src: `/api/media/file/${file}`, alt: '' })),
})
const richText = (children: any[]) => ({
  root: { children, direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 },
})

export async function buildProjectPage(payload: any, config: ProjectPageConfig) {
  const img = (file: string) => path.resolve(process.cwd(), '../img', file)

  const existingMedia = await payload.find({ collection: 'media', limit: 2000, depth: 0 })
  const mediaByName = new Map<string, number | string>()
  for (const doc of existingMedia.docs as any[]) {
    if (doc.filename) mediaByName.set(String(doc.filename), doc.id)
  }

  async function ensureMedia(filename: string, alt: string): Promise<{ id: number | string; url: string }> {
    const found = mediaByName.get(filename)
    if (found != null) return { id: found, url: `/api/media/file/${filename}` }
    const doc: any = await payload.create({
      collection: 'media',
      data: { alt },
      filePath: img(filename),
    })
    mediaByName.set(filename, doc.id)
    return { id: doc.id, url: doc.url || `/api/media/file/${filename}` }
  }

  const titleBg = await ensureMedia('title-bg.jpg', '标题带背景')
  const bannerImg = await ensureMedia('about-hero.jpg', `${config.title} Banner`)
  const bannerPattern = await ensureMedia('pattern-box-5.svg', 'Banner 装饰图')
  const introImg = await ensureMedia('iccp-intro.jpg', '项目介绍配图')
  const stepsImg = await ensureMedia('prog-iccp.jpg', '报名流程配图')
  const iconDumbbell = await ensureMedia('dumbbell.svg', '工作内容图标：哑铃')
  const iconBall = await ensureMedia('ball.svg', '工作内容图标：球')
  const iconTent = await ensureMedia('tent.svg', '工作内容图标：帐篷')
  const iconHeart = await ensureMedia('heart.svg', '工作内容图标：爱心')
  await ensureMedia('memory-2.jpg', '营地活动图 1')
  await ensureMedia('memory-3.jpg', '营地活动图 2')
  await ensureMedia('memory-5.jpg', '营地活动图 3')
  await ensureMedia('memory-6.jpg', '营地活动图 4')

  const strip = (title: string, en: string) => ({
    blockType: 'section',
    bgImage: titleBg.url,
    paddingY: 'none',
    paddingCustom: 12,
    contentGap: 1,
    children: [{
      blockType: 'heading', title, subtitle: en, align: 'center', padding: 0,
      titleColor: '#8A0E4B', subtitleColor: '#9A9A9A',
    }],
  })

  const contentSection = (children: any[]) => ({ blockType: 'section', paddingY: 'md', paddingCustom: 48, children })

  const intro = {
    blockType: 'section',
    paddingY: 'md',
    paddingCustom: 48,
    children: [{
      blockType: 'grid',
      layout: 'flow',
      columns: 2,
      gap: 'lg',
      columnRatio: '2:3',
      alignItems: 'center',
      bgColor: '#A11254',
      padding: 48,
      children: [
        {
          blockType: 'stack',
          gap: 'sm',
          children: [{
            blockType: 'richtext',
            content: richText([
              heading('h3', '项目介绍', WHITE),
              paragraph('美国夏令营辅导员项目是美国国务院制定的交流访问项目。', WHITE),
              paragraph('考虑到大多数在读生或刚毕业学生经济能力有限，营地辅导员项目从学生角度出发，每年为世界各地上万名符合条件的年轻人提供在营地工作的机会及相关能力培训。', WHITE),
              paragraph('在获得收入、获得宝贵的海外工作经验与培训经历的同时，还为语言能力及综合素质的提升创造了机会。工作结束后，还可畅游美国整整一个月！', WHITE),
            ]),
          }],
        },
        { blockType: 'image', media: introImg.id, aspectRatio: 'auto', fit: 'cover' },
      ],
    }],
  }

  const banner = {
    blockType: 'section',
    paddingY: 'none',
    children: [{
      blockType: 'banner',
      variant: 'split',
      title: config.bannerTitle,
      sub: config.bannerSub,
      image: bannerImg.id,
      pattern: bannerPattern.id,
    }],
  }

  const blocks: any[] = [
    banner,
    strip(config.stripTitle, config.stripSub),
    intro,
    strip('工作内容', 'Job Content'),
    contentSection([{
      blockType: 'zigzag',
      showLine: true,
      items: [
        { icon: iconDumbbell.id, text: '在营地教育活动中，是营员的家人、辅导员，也是营地老师的助手，陪伴并引导他们的日常' },
        { icon: iconBall.id, text: '负责营员各类室内及户外体育、竞技运动的安全与辅导，并维护活动秩序' },
        { icon: iconTent.id, text: '组织孩子参与各类活动（如体育、艺术、表演艺术、水上运动、游泳、攀岩、马术和露营等）' },
        { icon: iconHeart.id, text: '监督管理孩子的健康与安全，照料日常生活，帮助他们建立友谊' },
      ],
    }]),
    strip('户外类型', 'Outdoor Type'),
    contentSection([{
      blockType: 'richtext',
      content: richText([
        paragraph('营地辅导员的岗位遍布美国各地，多为寄宿制夏令营，活动涵盖体育、艺术、表演、水上运动、攀岩、马术、露营等。'),
        bulletList([
          '多数营地位于美国东北部，但几乎在每个州都有营地',
          '营地位于远离主要城市的边境偏僻区域',
          '学员可在美国任何地区工作，多数营地临近湖泊、河流、山脉或森林',
          '美国的夏令营位于一些最美丽的地方',
          '参与者不应只考虑特定区域，应保持开放的心态，准备好冒险',
        ]),
        imageRow(['memory-2.jpg', 'memory-3.jpg', 'memory-5.jpg', 'memory-6.jpg']),
      ]),
    }]),
    strip('项目优势', 'Our Advantages'),
    contentSection([{
      blockType: 'richtext',
      content: richText([
        bulletList([
          '合法性：美国政府依据法案制定的教育文化交流项目，已有 40 余年成熟运作经验',
          '可靠性：美国国务院指定项目，全程美国政府监管',
          '安全性：合法营地辅导员岗位，合作营地经验丰富；费用含医疗与意外保险，驻美办公室协调员及时解决问题',
          '提升英语听说、领导力、自理与协调能力，对从事教育事业尤为有帮助',
          '项目结束后有 30 天合法旅行期，可自由游历美国',
        ]),
      ]),
    }]),
    strip('申请条件', 'Application Requirements'),
    contentSection([{
      blockType: 'richtext',
      content: richText([
        bulletList([
          '英语水平：良好的英语沟通及书写能力',
          '年龄：18–28 岁',
          '项目参加者：学生、教师、青年工作者或具有专门技能者（可提供资格证明）',
          '身体素质：身心健康',
          '背景：无犯罪记录',
          '环境适应：可适应集体生活、远离城市 9 周的乡村环境',
          '项目时间：6 月 1 日至 9 月 1 日期间可参与项目',
          '态度：积极、灵活、「愿意尝试」，对儿童工作感兴趣',
        ]),
      ]),
    }]),
    strip('常见疑问', 'Q & A'),
    contentSection([{
      blockType: 'entries',
      collapsible: false,
      items: [
        { label: 'Q：营地辅导员主要做什么？', text: 'A：组织营员参与各类室内外活动，照料他们的日常生活与安全，并协助营地老师维护秩序与设施。' },
        { label: 'Q：项目期间包食宿吗？', text: 'A：是的，营地期间提供免费住宿及三餐。' },
        { label: 'Q：需要什么样的经验？', text: 'A：喜欢与孩子相处、有照顾儿童的经验更佳；具备良好的英语沟通能力即可报名。' },
        { label: 'Q：一般工作在什么时间？', text: 'A：每年 6 月上旬开始、8 月中下旬结束，工作时长约 63 天，每周休息一天。' },
        { label: 'Q：项目结束后能旅游吗？', text: 'A：项目结束后有 30 天的合法停留期，可在美国境内自由旅行。' },
      ],
    }]),
    strip('报名流程', 'The Program Process'),
    contentSection([{
      blockType: 'grid',
      layout: 'flow',
      columns: 2,
      gap: 'lg',
      columnRatio: '5:6',
      alignItems: 'start',
      children: [
        { blockType: 'image', media: stepsImg.id, aspectRatio: 'auto', fit: 'cover' },
        { blockType: 'steps', start: 1, connector: true, steps: [
          { title: '确认报名' },
          { title: '填写在线表格' },
          { title: '中惠面试并填写面试报告' },
          { title: '中惠审核后提交' },
          { title: '项目举办方决定是否接受申请' },
          { title: '匹配' },
          { title: '确认匹配' },
          { title: '匹配确认函' },
          { title: '在线培训' },
          { title: '签证申请' },
          { title: '抵达' },
        ] },
      ],
    }]),
  ]

  const finalBlocks = config.replacements ? applyProjectCopy(blocks, config.replacements) : blocks

  const found = await payload.find({
    collection: 'pages',
    where: { route: { equals: config.route } },
    limit: 1,
    depth: 0,
  })

  const data: any = {
    title: config.title,
    route: config.route,
    blocks: finalBlocks,
    _status: 'published',
  }

  const page: any = found.docs[0]
    ? await payload.update({ collection: 'pages', id: found.docs[0].id, data, draft: false })
    : await payload.create({ collection: 'pages', data })

  return { id: page.id, route: page.route, blocks: finalBlocks.length }
}

import 'dotenv/config'
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

const media = async (file: string) => ensureMedia(file, img(file), file.replace(/\.[^.]+$/, ''))

const milestones = [
  ['2002', 'founder-1.jpg', ['第一个德国互惠生签证成功获得并前往德国', '中惠公司的创始人之一与德国公司合作，最早把国际互惠生项目引入中国，成为中国互惠项目的开创者']],
  ['2003', 'memory-1.png', ['开始更多的中国学生赴德国参加互惠生项目']],
  ['2005', 'memory-2.jpg', ['法国互惠生协会访问本中心，正式开始了法国互惠生业务的办理']],
  ['2006', 'memory-5.jpg', ['正式与美国 CHI 协会合作', '第一个法国互惠生成功获得签证，前往法国开始互惠生活']],
  ['2007', 'memory-3.jpg', ['第一个比利时互惠生成功拿到签证，前往比利时']],
  ['2008', 'founder-2.jpg', ['大连中惠正式成立']],
  ['2009', 'memory-6.jpg', ['中惠与挪威公司正式合作']],
  ['2010', 'company.jpg', ['北京中惠文化交流有限公司成立', '中惠成为 IAPA 会员', '中惠第一个挪威互惠生获得签证，前往挪威开始互惠生活']],
  ['2011', 'memory-7.jpg', ['武老师、吕老师去法国拜访法国合作公司及中惠法国互惠生', '武老师第一次参加 IAPA 在布鲁塞尔举办的世界大会']],
  ['2012', 'memory-9.jpg', ['中惠沈阳办公室成立，入住沈阳大学园国际文化交流中心', '中惠刘老师、武老师前往纽约拜访美国合作 IE 公司和美国互惠家庭及学生']],
  ['2013', 'about-hero.jpg', ['中惠长春办公室成立', '中惠武老师参加美国 IE 公司在芝加哥举办年会']],
  ['2014', 'memory-10.jpg', ['中惠成为美国 ASSE 公司大陆唯一合作伙伴', '中惠微信公众平台建立']],
  ['2015', 'memory-4.jpg', ['中惠美国合作公司 IE 负责人 Michael 来中惠北京、沈阳、大连办公室拜访', '中惠美国合作公司 CHI 负责人来北京办公室拜访并商谈 STEP 项目', '中惠武老师在华盛顿参加美国合作公司 ASSE 的公司年会']],
  ['2016', 'memory-8.png', ['中惠小迪老师陪同学生参加美国 IE 和 EUR 的纽约互惠生培训', '中惠成为美国 AuPairCare 公司大陆唯一合作伙伴，中惠现有美国 6 家合作协会']],
] as const

const advantages = [
  ['badge', '资质权威，多年深耕沉淀', '成立于2002年，是中国早期加入国际互惠生协会（IAPA）的机构之一，长期开展互惠生、SWT、ITP、ICCP四大核心项目，累计为数千名中国青年搭建国际桥梁。'],
  ['globe', '对接美国官方授权机构，海量正规岗位资源', '与美国多家官方机构及欧洲40余家合作伙伴长期战略合作，岗位覆盖酒店、餐饮、商科、IT、工程等多个方向，申请人可按专业与意向灵活挑选。'],
  ['layers', '项目齐全，一站式满足多元需求', '一站式办理四大类J1国际文化交流项目，为不同背景、不同诉求的申请人提供匹配选择，真正做到“一站式”服务。'],
  ['network', '依托成熟资源网络，匹配流程标准化', '凭借成熟的匹配体系与资源网络，多年保持稳定的岗位匹配与签证过签成果，整体匹配周期符合行业常规标准。'],
  ['safety', '全程护航，一对一贴心陪伴', '从咨询、评估、材料、匹配、面试、签证到行前培训与赴美后跟进，专属顾问全程一对一跟进。'],
  ['star', '真实案例见证', '每年都有来自全国各地的学员通过中惠远赴海外，在真实家庭或国际化企业中积累经验，提升英语、收获深刻跨越文化交流阅历。'],
] as const

const applySteps = [
  ['compass', '了解项目', '顾问介绍项目内容与匹配预期'],
  ['mic', '英语测试', '评估英语口语与沟通水平'],
  ['contract', '交报名费并签订合同', '确认服务内容与双方权责'],
  ['folder', '准备材料', '证件、照片、推荐信等材料'],
  ['home', '匹配家庭', '根据需求筛选合适的家庭'],
  ['check', '成功匹配家庭并交尾款', '完成家庭确认并支付尾款'],
  ['passport', '准备面签', '材料复核与面签培训'],
  ['stamp', '拿到签证', '行前指导与行程安排'],
  ['plane', '出国', '落地接机与后续跟进'],
] as const

const benefits = [
  ['生活地点', '互惠生可以居住在美国优质家庭并为美国家庭工作'],
  ['食宿', '免费'],
  ['薪水', '每周获得 195.75 美金零用钱'],
  ['工作时间', '每周工作不超过 45 小时，每天不超过 10 小时'],
  ['休息时间', '每周休息 1.5 天，每个月有一个完整的周末'],
  ['带薪假期', '每年有 2 周带薪假期'],
  ['保险', '美国协会提供医疗意外保险'],
  ['教育补助', '每年有 500 美金的教育补助'],
  ['课程要求', '互惠生一年完成 6 个学分的课程'],
  ['培训', '在纽约进行培训 3 天'],
  ['互惠生活保障', '每个月可以参加由社区联络员组织的所有互惠生的聚会'],
  ['旅行时间', '项目结束后可以在美国合法旅游 30 天'],
] as const

const requirements = [
  ['年龄', '18–26 周岁'],
  ['学历', '有高中毕业证'],
  ['英语水平', '英语能够达到交流的水平'],
  ['照顾孩子经验', '对和孩子一起工作有热情，至少有 200 小时照顾小孩的经验'],
  ['照顾孩子证明', '提供至少两份非亲属关系的照顾孩子证明'],
  ['性格推荐信', '提供非亲属提供的性格推荐信'],
  ['驾驶经验', '必须有驾照，有驾驶经验'],
  ['个人习惯', '不抽烟，不酗酒'],
  ['婚姻情况', '未婚无子女'],
  ['背景', '没有犯罪记录'],
  ['身体素质', '身心健康'],
  ['签证历史', '无美国拒签史'],
] as const

const icon = (name: string) =>
  ensureMedia(`${name}.svg`, staticFile(`icons/steps/${name}.svg`), `step-${name}`)

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
const heading = (title: string) => ({ blockType: 'heading', title, align: 'center' })
const text = (body: string, extra: Record<string, unknown> = {}) => ({
  blockType: 'text',
  body,
  align: 'center',
  ...extra,
})

const aboutHero = await media('about-hero.jpg')
const pattern = await ensureMedia('pattern-box-5.svg', staticFile('pattern-box-5.svg'), 'about-pattern')
const company = await media('company.jpg')
const founderIds = await Promise.all(['founder-1.jpg', 'founder-2.jpg', 'founder-3.jpg'].map(media))
const milestoneCards = await Promise.all(
  milestones.map(async ([year, file, events]) => ({
    blockType: 'imageText',
    media: await media(file),
    title: year,
    desc: events.join('；') + '。',
  })),
)
const advantageIcons = Object.fromEntries(
  await Promise.all(
    advantages.map(async ([name]) => [
      name,
      await ensureMedia(
        `${name}.svg`,
        staticFile(`icons/${name}.svg`),
        `advantage-${name}`,
      ),
    ]),
  ),
)
const stepIcons = Object.fromEntries(
  await Promise.all(applySteps.map(async ([name]) => [name, await icon(name)])),
)

const aboutBlocks: any[] = [
  {
    blockType: 'section',
    paddingY: 'none',
    children: [
      {
        blockType: 'banner',
        variant: 'split',
        title: '深耕国际文化交流二十余年',
        sub: '以专业与用心，陪伴每一位青年走向世界',
        image: aboutHero,
        pattern,
      },
    ],
  },
  section([
    { blockType: 'heading', title: '公司介绍', align: 'center', titleColor: '#FFFFFF' },
    {
      blockType: 'grid',
      columns: 2,
      columnRatio: '2:3',
      alignItems: 'start',
      children: [
        { blockType: 'image', media: company, aspectRatio: '4:3', fit: 'cover' },
        {
          blockType: 'stack',
          gap: 'sm',
          bgColor: '#FFFFFF',
          padding: 20,
          children: [
            textBlocksToRichText([
              { body: '北京中惠大洋文化交流有限公司', fontSize: 20, fontWeight: '700' },
              { body: '前身为“中惠互惠生申请中心”，成立于2002年，也是中国早期加入“国际互惠生协会（IAPA）”重要成员之一。多年来一直致力于推广赴欧美互惠生项目，为中国年轻人融入世界提供一个更广阔的平台；因从业时间久，国际合作方多，服务规范而赢得了国外合作机构、国内外互惠生以及家庭的好评。', fontSize: 15 },
              { body: '行业地位与规模', fontSize: 20, fontWeight: '700' },
              { body: '深耕互惠生行业二十余年，业务覆盖欧美多国，搭建了完整标准化服务体系。', fontSize: 15 },
              { body: '核心业务', fontSize: 20, fontWeight: '700' },
              { body: '专注为中国青年提供互惠生、SWT带薪实习、ITP专业实习、ICCP营地辅导员等J1类国际文化交流项目服务，累计输送数千名学员走向欧美，一站式匹配不同申请人需求。', fontSize: 15 },
            ]),
          ],
        },
      ],
    },
  ], { bgImage: '/assets/bg2.jpg', bgHeight: 0 }),
  section([heading('中惠历程'), { blockType: 'hscroll', timeline: true, children: milestoneCards }]),
  section([
    heading('中惠理念'),
    text('在中惠，我们始终相信，文化交流没有唯一的标准答案。每位同学的兴趣和目标不同：有人适合通过带薪实习提升职场能力，有人希望在营地生活中锻炼综合能力，还有人想通过互惠生深度体验美国家庭生活。不同项目面向不同需求，我们的使命是帮每一位同学找到最适合自己的交流方式。', { fontSize: 16, maxWidth: 760 }),
    text('专业，不是局限，而是选择适合的路。', { fontSize: 16, fontWeight: '600', bodyColor: '#8A0E4B', maxWidth: 760 }),
  ], { bgColor: '#FFF1F6', paddingY: '2xl' }),
  section([
    heading('创始团队'),
    {
      blockType: 'grid',
      columns: 3,
      children: [
        {
          blockType: 'imageText',
          media: founderIds[0],
          title: 'Lucy 刘老师',
          subtitle: '创始人之一',
          desc: '中惠的创始人之一，是中国第一批互惠生项目的从业者。在她的努力推动下，越来越多的大学开始认可互惠生项目。',
        },
        {
          blockType: 'imageText',
          media: founderIds[1],
          title: 'Linda 吕老师',
          subtitle: '创始人之一',
          desc: '国内专业的互惠咨询师之一。从2002年把德国互惠项目引进中国，用二十几年的经验帮助上千名学生成功出国。',
        },
        {
          blockType: 'imageText',
          media: founderIds[2],
          title: 'Wendy 武老师',
          subtitle: '创始人之一',
          desc: '中惠的创始人之一，负责国际合作。在她的努力下，中惠与海内外四十多家文化交流机构保持长期稳定合作。',
        },
      ],
    },
    {
      blockType: 'stack',
      gap: 'sm',
      bgColor: '#FFFFFF',
      padding: 40,
      children: [
        textBlocksToRichText([
          { body: '专业师资团队', fontSize: 20, fontWeight: '700' },
          ...([
            '深耕互惠生项目十年以上，专注项目推广与美国签证培训的资深讲师',
            '具备招聘培训从业经历，擅长面试辅导，能够针对性拆解面试难题的面试老师',
            '负责英语测评与申请材料指导，严谨协助学员打造优质申请资料的材料老师',
            '拥有美国留学经历、多年汉语教学经验，精通少儿语言教学方法的讲师',
            '亲身参与过德国互惠、主攻赴德互惠项目，为学员提供全套专业指导的老师',
          ].map((desc) => ({ body: desc, fontSize: 15 }))),
        ]),
      ],
    },
  ], { bgImage: '/assets/yinji-bg.jpg', contentGap: 32 }),
  section([
    heading('核心优势 · 为什么选择中惠'),
    {
      blockType: 'iconList',
      iconPosition: 'alternate',
      iconColor: '#E60039',
      items: advantages.map(([name, title, desc]) => ({ icon: advantageIcons[name], title, desc })),
    },
  ], { bgColor: '#FFF1F6' }),
]

const aupairHero = aboutHero
const yinji = '/assets/yinji-bg.jpg'

const aupairBlocks: any[] = [
  {
    blockType: 'section',
    paddingY: 'none',
    children: [
      {
        blockType: 'banner',
        variant: 'split',
        title: '美国互惠生',
        sub: '入住美国家庭 · 体验深度文化 · 提升口语',
        image: aupairHero,
        pattern,
      },
    ],
  },
  section([
    heading('项目待遇'),
    {
      blockType: 'infoList',
      showDots: true,
      items: benefits.map(([label, desc]) => ({ label, desc })),
    },
  ], { bgImage: yinji }),
  section([
    heading('项目要求'),
    {
      blockType: 'infoList',
      showDots: true,
      items: requirements.map(([label, desc]) => ({ label, desc })),
    },
  ], { bgColor: '#FFF1F6', paddingY: 'md' }),
  section([
    heading('申请流程'),
    {
      blockType: 'iconList',
      iconPosition: 'left',
      iconColor: '#E60039',
      items: applySteps.map(([name, title, desc]) => ({ icon: stepIcons[name], title, desc })),
    },
  ], { bgColor: '#FFF1F6', paddingY: 'md' }),
]

async function ensurePage(route: string, title: string, blocks: any[]) {
  const found = await payload.find({
    collection: 'pages',
    where: { route: { equals: route } },
    limit: 1,
    draft: true,
    depth: 0,
  })
  if (found.docs[0]) {
    await payload.update({
      collection: 'pages',
      id: (found.docs[0] as any).id,
      draft: true,
      data: { title, route, blocks, _status: 'draft' },
    })
    return { action: 'updated', id: (found.docs[0] as any).id, route }
  }
  const doc = await payload.create({
    collection: 'pages',
    draft: true,
    data: { title, route, blocks, _status: 'draft' },
  })
  return { action: 'created', id: (doc as any).id, route }
}

const result = [
  await ensurePage('/about/', '关于中惠', aboutBlocks),
  await ensurePage('/aupair-usa/', '美国互惠生', aupairBlocks),
]

console.log(JSON.stringify(result, null, 2))
process.exit(0)

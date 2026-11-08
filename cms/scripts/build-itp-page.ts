import 'dotenv/config'

process.env.DISABLE_AUTO_REBUILD = '1'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { buildProjectPage } from './lib/project-page'
import { ITP_REPLACEMENTS } from './lib/project-copy'

const payload = await getPayload({ config })

const page = await buildProjectPage(payload, {
  title: '赴美 ITP',
  route: '/project-itp/',
  bannerTitle: '赴美 ITP',
  bannerSub: '赴美专业实习 · 积累国际职场经验',
  stripTitle: 'ITP 赴美专业实习项目介绍',
  stripSub: 'Intern / Trainee Program',
  replacements: ITP_REPLACEMENTS,
})

console.log(JSON.stringify(page, null, 2))
process.exit(0)

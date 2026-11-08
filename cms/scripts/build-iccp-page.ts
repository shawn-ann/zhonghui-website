import 'dotenv/config'

process.env.DISABLE_AUTO_REBUILD = '1'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { buildProjectPage } from './lib/project-page'

const payload = await getPayload({ config })

const page = await buildProjectPage(payload, {
  title: '赴美营地辅导员',
  route: '/project-iccp/',
  bannerTitle: '赴美营地辅导员',
  bannerSub: '沉浸全英文环境 · 收获成长与历练',
  stripTitle: '赴美营地辅导员项目介绍',
  stripSub: 'International Camp Counselor Program',
})

console.log(JSON.stringify(page, null, 2))
process.exit(0)

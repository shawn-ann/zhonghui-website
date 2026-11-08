import 'dotenv/config'

process.env.DISABLE_AUTO_REBUILD = '1'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { buildProjectPage } from './lib/project-page'

const payload = await getPayload({ config })

const page = await buildProjectPage(payload, {
  title: '赴美 SWT',
  route: '/project-swt/',
  bannerTitle: '赴美 SWT',
  bannerSub: '暑期赴美带薪实习 · 工作旅行两不误',
  stripTitle: 'SWT 赴美带薪实习项目介绍',
  stripSub: 'Summer Work Travel',
})

console.log(JSON.stringify(page, null, 2))
process.exit(0)

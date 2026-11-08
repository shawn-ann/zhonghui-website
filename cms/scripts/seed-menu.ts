import 'dotenv/config'

process.env.DISABLE_AUTO_REBUILD = '1'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { seedMenu } from './lib/menu'

const payload = await getPayload({ config })

const home = await payload.find({
  collection: 'pages',
  where: { route: { equals: '/' } },
  limit: 1,
  depth: 0,
})
const doc = home.docs[0] as any
if (!doc) throw new Error('首页不存在，请先运行 seed-home')

const items = await seedMenu(payload, doc.id)
console.log(JSON.stringify({ home: doc.id, items: items.map((item) => item.label) }, null, 2))
process.exit(0)

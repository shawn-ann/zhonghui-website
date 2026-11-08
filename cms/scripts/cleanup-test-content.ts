import 'dotenv/config'

process.env.DISABLE_AUTO_REBUILD = '1'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const slugs = ['hhhh', 'hhhhh', 'yyyy', ...Array.from({ length: 14 }, (_, i) => `pagination-test-${String(i + 1).padStart(2, '0')}`)]
const cases = await payload.delete({
  collection: 'cases',
  where: { slug: { in: slugs } },
})
console.log('deleted cases', cases.docs.length)

const pages = await payload.delete({
  collection: 'pages',
  where: { route: { equals: '/test/' } },
})
console.log('deleted test pages', pages.docs.length)

process.exit(0)

import 'dotenv/config'

process.env.DISABLE_AUTO_REBUILD = '1'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { applyProjectCopy, ITP_REPLACEMENTS, SWT_REPLACEMENTS } from './lib/project-copy'

const payload = await getPayload({ config })

const targets = [
  { route: '/project-swt/', replacements: SWT_REPLACEMENTS },
  { route: '/project-itp/', replacements: ITP_REPLACEMENTS },
]

for (const target of targets) {
  const found = await payload.find({
    collection: 'pages',
    where: { route: { equals: target.route } },
    limit: 1,
    depth: 0,
  })
  const page: any = found.docs[0]
  if (!page) throw new Error(`页面不存在：${target.route}`)
  const blocks = applyProjectCopy(page.blocks || [], target.replacements)
  await payload.update({
    collection: 'pages',
    id: page.id,
    draft: false,
    data: { blocks, _status: 'published' },
  })
  console.log(target.route, 'updated', page.id)
}

process.exit(0)

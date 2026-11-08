import 'dotenv/config'

process.env.DISABLE_AUTO_REBUILD = '1'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const routes = ['/project-iccp/', '/project-swt/', '/project-itp/']
const pages = await payload.find({
  collection: 'pages',
  where: { route: { in: routes } },
  limit: 10,
  depth: 0,
})
const pageByRoute = new Map(pages.docs.map((doc: any) => [String(doc.route), doc.id]))
const iccp = pageByRoute.get('/project-iccp/')
const swt = pageByRoute.get('/project-swt/')
const itp = pageByRoute.get('/project-itp/')
if (iccp == null || swt == null || itp == null) {
  throw new Error('请先生成 /project-iccp/、/project-swt/、/project-itp/ 页面')
}

const menu: any = await payload.findGlobal({ slug: 'menu', depth: 0 })

const normalize = (item: any) => ({
  id: item.id,
  label: item.label,
  linkType: item.linkType,
  page: item.page?.id ?? item.page ?? null,
  caseCategory: item.caseCategory?.id ?? item.caseCategory ?? null,
  externalUrl: item.externalUrl ?? null,
  children: (item.children || []).map(normalize),
})

const items = (menu.items || []).map((raw: any) => {
  const item = normalize(raw)
  const children = item.children
  const isProjectParent = children.some(
    (child: any) => child.page === iccp || /ICCP|SWT|ITP/.test(child.label || ''),
  )
  if (!isProjectParent) return item

  const isProjectChild = (child: any) => /ICCP|SWT|ITP/.test(child.label || '')
  const others = children.filter((child: any) => !isProjectChild(child))
  const iccpChild = children.find((child: any) => /ICCP/.test(child.label || ''))
  const duplicateIccp = children.find(
    (child: any) => /ICCP/.test(child.label || '') && child !== iccpChild,
  )
  const swtChild = children.find((child: any) => /SWT/.test(child.label || '')) || duplicateIccp
  const itpChild = children.find((child: any) => /ITP/.test(child.label || ''))

  const nextChildren = [
    ...others,
    {
      ...(iccpChild || {}),
      label: 'ICCP赴美营地辅导员',
      linkType: 'page',
      page: iccp,
    },
    {
      ...(swtChild || {}),
      label: 'SWT 赴美带薪实习',
      linkType: 'page',
      page: swt,
    },
    {
      ...(itpChild || {}),
      label: 'ITP 赴美专业实习',
      linkType: 'page',
      page: itp,
    },
  ]
  return { ...item, children: nextChildren }
})

await payload.updateGlobal({ slug: 'menu', data: { items } })
console.log(JSON.stringify({ iccp, swt, itp, menuItems: items.length }, null, 2))
process.exit(0)

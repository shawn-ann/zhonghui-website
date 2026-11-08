export async function seedMenu(payload: any, homeId: number | string) {
  const pages = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    limit: 200,
    depth: 0,
  })
  const byRoute = new Map<string, number | string>(
    (pages.docs as any[]).map((page) => [String(page.route), page.id]),
  )
  const pageId = (route: string) => {
    const id = byRoute.get(route)
    if (id == null) throw new Error(`菜单缺少页面：${route}`)
    return id
  }

  const categories = await payload.find({
    collection: 'case-categories',
    where: { slug: { equals: 'study-case' } },
    limit: 1,
    depth: 0,
  })
  const categoryId = (categories.docs[0] as any)?.id
  if (categoryId == null) throw new Error('菜单缺少案例分类：study-case')

  const items = [
    { label: '首页', linkType: 'page', page: homeId },
    { label: '关于中惠', linkType: 'page', page: pageId('/about/') },
    { label: '互惠生', linkType: 'page', page: pageId('/aupair-usa/') },
    {
      label: '赴美J1交流项目',
      linkType: 'none',
      children: [
        { label: 'ICCP赴美营地辅导员', linkType: 'page', page: pageId('/project-iccp/') },
        { label: 'SWT 赴美带薪实习', linkType: 'page', page: pageId('/project-swt/') },
        { label: 'ITP 赴美专业实习', linkType: 'page', page: pageId('/project-itp/') },
      ],
    },
    {
      label: '海外留学',
      linkType: 'page',
      page: pageId('/study-abroad/'),
      children: [
        { label: '新西兰留学', linkType: 'page', page: pageId('/new-zealand/') },
      ],
    },
    { label: '案例分享', linkType: 'caseCategory', caseCategory: categoryId },
    { label: '联系我们', linkType: 'page', page: pageId('/contact/') },
  ]

  await payload.updateGlobal({ slug: 'menu', data: { items } })
  return items
}

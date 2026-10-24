// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AdminPageHeader } from '../AdminPageHeader'

const render = (node: React.ReactNode) => renderToStaticMarkup(node)

describe('AdminPageHeader', () => {
  it('renders breadcrumb links and the current page', () => {
    const html = render(
      <AdminPageHeader
        breadcrumbs={[
          { label: '首页', href: '/admin/collections/pages' },
          { label: '站点设置' },
        ]}
        title="站点设置"
        description="保存后需要重建站点"
      />,
    )
    expect(html).toContain('href="/admin/collections/pages"')
    expect(html).toContain('class="current">站点设置')
    expect(html).toContain('<h1 class="zc-page-title">站点设置</h1>')
  })

  it('renders actions beside the title', () => {
    const html = render(
      <AdminPageHeader
        breadcrumbs={[{ label: '首页' }]}
        title="页面"
        actions={<button type="button">新建页面</button>}
      />,
    )
    expect(html).toContain('zc-page-actions')
    expect(html).toContain('新建页面')
  })
})

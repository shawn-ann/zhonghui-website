import { Fragment } from 'react'
import type { PageDoc, SiteConfig } from '../render/types'
import { DEFAULT_SITE_CONFIG } from './config'
import { TopBlock } from './blocks'
import { SiteNav } from './nav'
import { SiteFooter } from './footer'
import { CaseDetailView, CaseListView } from './cases'

export interface SiteAssets {
  mode: 'external' | 'inline'
  css?: string
  swiperCss?: string
  swiperJs?: string
  mainJs?: string
  disableLinks?: boolean
}

/** 预览页专用：拦截所有 <a> 默认导航，避免跳出预览进入站点/后台。 */
export const PREVIEW_LOCK_JS =
  "document.addEventListener('click',function(e){var t=e.target;if(t&&t.closest&&t.closest('a'))e.preventDefault()},true)"
export const PREVIEW_LOCK_LINKS = `<script>${PREVIEW_LOCK_JS}</script>`

export function SiteBody({ page, site = DEFAULT_SITE_CONFIG, editor = false, caseListHref }: {
  page: PageDoc
  site?: SiteConfig
  editor?: boolean
  /** 预览用：列表分页链接指向预览自身的页码。 */
  caseListHref?: (page: number) => string
}) {
  return (
    <>
      <SiteNav activeRoute={page.route} menu={site.menu} settings={site.settings} />
      <main id="page">
        {page.template?.kind === 'caseList'
          ? <CaseListView page={page} hrefForPage={caseListHref} />
          : page.template?.kind === 'caseDetail'
            ? <CaseDetailView page={page} />
            : page.blocks.map((b, i) => (
                <Fragment key={b._id ?? i}><TopBlock b={b} editor={editor} /></Fragment>
              ))}
      </main>
      <SiteFooter settings={site.settings} />
    </>
  )
}

export function SiteDocument({ page, site, assets }: { page: PageDoc; site?: SiteConfig; assets: SiteAssets }) {
  const title = page.seo?.title || page.title
  const description = page.seo?.description
  const inline = assets.mode === 'inline'
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        {inline
          ? (
            <>
              {assets.swiperCss ? <style>{assets.swiperCss}</style> : null}
              {assets.css ? <style>{assets.css}</style> : null}
            </>
          )
          : (
            <>
              <link rel="stylesheet" href="/assets/swiper-bundle.min.css" />
              <link rel="stylesheet" href="/assets/style.css" />
            </>
          )}
      </head>
      <body>
        <SiteBody page={page} site={site} />
        {inline
          ? (
            <>
              {assets.swiperJs ? <script>{assets.swiperJs}</script> : null}
              {assets.mainJs ? <script>{assets.mainJs}</script> : null}
            </>
          )
          : (
            <>
              <script src="/assets/swiper-bundle.min.js" />
              <script src="/assets/main.js" />
            </>
          )}
        {assets.disableLinks
          ? <script dangerouslySetInnerHTML={{ __html: PREVIEW_LOCK_JS }} />
          : null}
      </body>
    </html>
  )
}

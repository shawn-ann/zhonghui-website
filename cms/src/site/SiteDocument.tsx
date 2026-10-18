import { Fragment } from 'react'
import type { PageDoc } from '../render/types'
import { TopBlock } from './blocks'
import { SiteNav } from './nav'
import { SiteFooter } from './footer'

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

export function SiteBody({ page }: { page: PageDoc }) {
  return (
    <>
      <SiteNav activeRoute={page.route} />
      <main id="page">
        {page.blocks.map((b, i) => (
          <Fragment key={b._id ?? i}><TopBlock b={b} /></Fragment>
        ))}
      </main>
      <SiteFooter />
    </>
  )
}

export function SiteDocument({ page, assets }: { page: PageDoc; assets: SiteAssets }) {
  const title = page.seo?.title || page.title
  const desc = page.seo?.description || ''
  const inline = assets.mode === 'inline'
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {desc ? <meta name="description" content={desc} /> : null}
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
        <SiteBody page={page} />
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

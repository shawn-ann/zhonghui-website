import type { CaseDetailTemplate, CaseItem, CaseListTemplate, PageDoc } from '../render/types'
import { safeUrl } from '../render/primitives'
import { hrefOf } from './assets'
import LexicalContent from './LexicalContent'

function dateText(value: string): string {
  return String(value || '').slice(0, 10)
}

function pageHref(basePath: string, page: number): string {
  return hrefOf(page <= 1 ? basePath : `${basePath}page/${page}/`)
}

function pageNumbers(page: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1])
  const sorted = [...pages].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - (sorted[i - 1] as number) > 1) out.push('…')
    out.push(n)
  })
  return out
}

export function CasePagination({ page, pageCount, basePath, hrefForPage }: {
  page: number
  pageCount: number
  basePath: string
  /** 预览等场景可自定义目标地址；给了它就会给分页链接打上 data-preview-nav，放行预览的链接锁。 */
  hrefForPage?: (page: number) => string
}) {
  if (pageCount <= 1) return null
  const linkFor = hrefForPage ?? ((n: number) => pageHref(basePath, n))
  const previewNav = hrefForPage ? { 'data-preview-nav': '' } : {}
  return (
    <nav className="case-pagination" aria-label="案例分页">
      {page > 1
        ? <a className="case-page-btn" href={linkFor(page - 1)} {...previewNav} rel="prev">‹</a>
        : <span className="case-page-btn is-disabled">‹</span>}
      {pageNumbers(page, pageCount).map((n, i) => n === '…'
        ? <span className="case-page-gap" key={`gap-${i}`}>…</span>
        : <a
            key={n}
            className={`case-page-btn${n === page ? ' is-active' : ''}`}
            href={linkFor(n)}
            aria-current={n === page ? 'page' : undefined}
            {...previewNav}
          >{n}</a>)}
      {page < pageCount
        ? <a className="case-page-btn" href={linkFor(page + 1)} {...previewNav} rel="next">›</a>
        : <span className="case-page-btn is-disabled">›</span>}
      <span className="case-page-info">第 {page} / {pageCount} 页</span>
    </nav>
  )
}

function CaseCard({ item }: { item: CaseItem }) {
  const cover = safeUrl(item.cover)
  return (
    <a
      className={`case-card${cover ? '' : ' is-empty-cover'}`}
      href={hrefOf(`/blog/${item.categorySlug}/${item.slug}/`)}
      style={cover ? { backgroundImage: `url('${cover}')` } : undefined}
    >
      <span className="title">{item.title}</span>
    </a>
  )
}

export function CaseListView({ page, hrefForPage }: {
  page: PageDoc
  /** 预览等场景可自定义分页目标地址，见 CasePagination。 */
  hrefForPage?: (page: number) => string
}) {
  const template = page.template as CaseListTemplate
  const banner = safeUrl(template.banner)
  return (
    <>
      <section className="case-banner">
        <div className="container case-banner-grid">
          <div className="case-banner-text">
            <h1>{template.title}</h1>
            {template.subtitle ? <p className="sub">{template.subtitle}</p> : null}
          </div>
          {banner ? (
            <div className="case-banner-media">
              <img src={banner} alt={template.title} />
            </div>
          ) : null}
        </div>
      </section>
      <section className="section case-list-section">
        <div className="container">
          {template.items.length ? (
            <div className="case-grid">
              {template.items.map((item) => <CaseCard item={item} key={item.id ?? item.slug} />)}
            </div>
          ) : <p className="case-empty">暂无案例</p>}
          <CasePagination page={template.page} pageCount={template.pageCount} basePath={template.basePath} hrefForPage={hrefForPage} />
        </div>
      </section>
    </>
  )
}

export function CaseDetailView({ page }: { page: PageDoc }) {
  const template = page.template as CaseDetailTemplate
  const item = template?.item
  const title = item?.title || page.title
  const cover = safeUrl(item?.cover)
  const banner = safeUrl(template?.category?.banner)
  return (
    <>
      <section className="case-banner">
        <div className="container case-banner-grid">
          <div className="case-banner-text">
            <h1>{title}</h1>
            <p className="sub">中惠文化 · 真实案例分享</p>
          </div>
          {banner ? (
            <div className="case-banner-media">
              <img src={banner} alt={title} />
            </div>
          ) : null}
        </div>
      </section>
      <section className="section section-alt case-detail-section">
        <div className="container case-article">
          <h1 className="case-detail-title">{title}</h1>
          {item?.publishedAt ? <div className="case-detail-meta">📅 {dateText(item.publishedAt)}</div> : null}
          {cover ? <div className="case-detail-cover" style={{ backgroundImage: `url('${cover}')` }} /> : null}
          <div className="article-body richtext">
            <LexicalContent data={item?.body} />
          </div>
        </div>
      </section>
    </>
  )
}

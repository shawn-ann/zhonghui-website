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

export function CasePagination({ page, pageCount, basePath }: { page: number; pageCount: number; basePath: string }) {
  if (pageCount <= 1) return null
  return (
    <nav className="case-pagination" aria-label="案例分页">
      {page > 1
        ? <a className="case-page-btn" href={pageHref(basePath, page - 1)} rel="prev">‹</a>
        : <span className="case-page-btn is-disabled">‹</span>}
      {pageNumbers(page, pageCount).map((n, i) => n === '…'
        ? <span className="case-page-gap" key={`gap-${i}`}>…</span>
        : <a
            key={n}
            className={`case-page-btn${n === page ? ' is-active' : ''}`}
            href={pageHref(basePath, n)}
            aria-current={n === page ? 'page' : undefined}
          >{n}</a>)}
      {page < pageCount
        ? <a className="case-page-btn" href={pageHref(basePath, page + 1)} rel="next">›</a>
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

export function CaseListView({ page }: { page: PageDoc }) {
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
          <CasePagination page={template.page} pageCount={template.pageCount} basePath={template.basePath} />
        </div>
      </section>
    </>
  )
}

export function CaseDetailView({ page }: { page: PageDoc }) {
  const template = page.template as CaseDetailTemplate
  const item = template?.item
  const cover = safeUrl(item?.cover)
  return (
    <>
      <section
        className={`case-detail-hero${cover ? '' : ' is-empty-cover'}`}
        style={cover ? { backgroundImage: `url('${cover}')` } : undefined}
      >
        <div className="case-detail-overlay" />
        <div className="container case-detail-head">
          <h1>{item?.title || page.title}</h1>
          {item?.publishedAt ? <div className="case-detail-meta">{dateText(item.publishedAt)}</div> : null}
        </div>
      </section>
      <section className="section section-alt case-detail-section">
        <div className="container case-article">
          <div className="article-body richtext">
            <LexicalContent data={item?.body} />
          </div>
        </div>
      </section>
    </>
  )
}

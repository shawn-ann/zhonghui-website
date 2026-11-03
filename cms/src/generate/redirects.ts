export interface RedirectRow {
  from: string
  to: string
}

export function categoryPath(slug: string): string {
  return `/blog/${slug}/`
}

export function casePath(categorySlug: string, caseSlug: string): string {
  return `/blog/${categorySlug}/${caseSlug}/`
}

/** 合并链式重定向、去重、去掉自指。后出现的 from 覆盖先出现的。 */
export function normalizeRedirects(rows: RedirectRow[]): RedirectRow[] {
  const map = new Map<string, string>()
  for (const row of rows) {
    if (row.from && row.to && row.from !== row.to) map.set(row.from, row.to)
  }
  const targets = new Set(map.values())
  const out: RedirectRow[] = []
  for (const [from, first] of map) {
    // 中间跳点不再单独输出，只保留最终入口
    if (targets.has(from)) continue
    let to = first
    const seen = new Set([from])
    while (map.has(to) && !seen.has(to)) {
      seen.add(to)
      to = map.get(to) as string
    }
    if (to !== from) out.push({ from, to })
  }
  return out
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string))
}

export function renderRedirectHtml(to: string): string {
  const url = esc(to)
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">`
    + `<meta http-equiv="refresh" content="0;url=${url}">`
    + `<link rel="canonical" href="${url}">`
    + `<title>跳转中…</title></head><body>`
    + `<p>页面已迁移，正在跳转到 <a href="${url}">${url}</a>。</p>`
    + `</body></html>`
}

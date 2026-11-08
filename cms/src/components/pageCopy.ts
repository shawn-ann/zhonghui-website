export function normalizePageRoute(value: string): string {
  const v = value.trim()
  if (!v) return '/'
  const clean = v.replace(/^\/+/, '').replace(/\/+$/, '')
  return clean ? `/${clean}/` : '/'
}

export function suggestCopyRoute(route: string, pages: Array<{ route: string }>): string {
  const base = normalizePageRoute(route).replace(/\/$/, '')
  const prefix = base ? `${base}-copy` : '/copy'
  const used = new Set(pages.map((page) => page.route))
  let candidate = `${prefix}/`
  let index = 2
  while (used.has(candidate)) {
    candidate = `${prefix}-${index}/`
    index += 1
  }
  return candidate
}

/** 复制时去掉区块及其嵌套项的数据库 id，让 Payload 为新页面重新生成。 */
export function withoutBlockIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutBlockIds)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'id') continue
      out[key] = withoutBlockIds(item)
    }
    return out
  }
  return value
}

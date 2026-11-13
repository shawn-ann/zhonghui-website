import type { EditorDoc } from './types'
import { docToEditorDoc } from './map'
import { buildSiteConfig } from '../site/config'
import type { SiteConfig } from '../render/types'

const json = { 'content-type': 'application/json' }

function payloadErrorMessage(data: any, status: number): string {
  const first = data?.errors?.[0]
  const nested = first?.data?.errors
  if (Array.isArray(nested) && nested.length) {
    const details = nested
      .map((item: any) => {
        const message = String(item?.message || '').trim()
        const path = String(item?.path || '').trim()
        if (!message) return ''
        return path && !message.includes(path) ? `${message}（${path}）` : message
      })
      .filter(Boolean)
    if (details.length) return details.join('；')
  }
  return first?.message || data?.message || data?.error || `Request failed: ${status}`
}

async function j(res: Response) {
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(payloadErrorMessage(data, res.status))
  return data
}
export async function getPage(id: number | string): Promise<EditorDoc> {
  const res = await fetch(`/api/pages/${id}?draft=true&depth=1`, { credentials: 'include' })
  const data = await j(res)
  return docToEditorDoc((data as { doc?: unknown }).doc ?? data)
}
export async function savePage(id: number | string, data: Partial<EditorDoc>): Promise<void> {
  await j(await fetch(`/api/pages/${id}?draft=true`, { method: 'PATCH', headers: json, credentials: 'include', body: JSON.stringify({ ...data, _status: 'draft' }) }))
}
export async function publishPage(id: number | string, data: Partial<EditorDoc>): Promise<void> {
  await j(await fetch(`/api/pages/${id}`, { method: 'PATCH', headers: json, credentials: 'include', body: JSON.stringify({ ...data, _status: 'published' }) }))
}
export interface MediaItem { id: number | string; url?: string; alt?: string; filename?: string }
export async function listMedia(): Promise<MediaItem[]> {
  const all: MediaItem[] = []
  let page = 1
  for (;;) {
    const data = await j(await fetch(`/api/media?limit=100&page=${page}&depth=0`, { credentials: 'include' }))
    all.push(...((data.docs || []) as MediaItem[]))
    if (!data.hasNextPage) break
    const next = Number(data.nextPage ?? page + 1)
    if (!Number.isFinite(next) || next <= page) break
    page = next
  }
  return all
}
export interface BuildStatus {
  status: 'idle' | 'building' | 'success' | 'error'
  startedAt?: string
  finishedAt?: string
  exitCode?: number | null
  error?: string
  logTail?: string
}
export async function getBuildStatus(): Promise<BuildStatus> {
  const res = await fetch('/api/rebuild', { credentials: 'include' })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}
export async function triggerRebuild(): Promise<BuildStatus> {
  const res = await fetch('/api/rebuild', { method: 'POST', credentials: 'include' })
  const data = await res.json().catch(() => null)
  if (res.status === 401) throw new Error('未登录')
  if (res.status !== 202 && res.status !== 409) throw new Error(data?.error || `Request failed: ${res.status}`)
  return data as BuildStatus
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const get = (slug: string) => fetch(`/api/globals/${slug}?depth=1`, { credentials: 'include' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
  const [menu, settings] = await Promise.all([get('menu'), get('site-settings')])
  return buildSiteConfig(menu, settings)
}

export interface PageSummary { id: number | string; title: string; route: string }
export interface CaseSummary { id: number | string; title: string; route: string }
export async function listCases(): Promise<CaseSummary[]> {
  const data = await j(await fetch('/api/cases?limit=500&depth=1&where[_status][equals]=published', { credentials: 'include' }))
  return (data.docs as any[])
    .map((d) => {
      const slug = String(d.slug || '')
      const categorySlug = typeof d.category === 'object' ? String(d.category?.slug || '') : ''
      return {
        id: d.id,
        title: d.title || '',
        route: slug && categorySlug ? `/blog/${categorySlug}/${slug}/` : '',
      }
    })
    .filter((d) => d.route)
}
export async function listPages(): Promise<PageSummary[]> {
  const data = await j(await fetch('/api/pages?limit=200&depth=0', { credentials: 'include' }))
  return (data.docs as any[])
    .filter((d) => d._status === 'published')
    .map((d) => ({ id: d.id, title: d.title || '', route: d.route || '' }))
}

export async function uploadMedia(file: File): Promise<MediaItem> {
  const form = new FormData()
  form.append('file', file)
  form.append('_payload', JSON.stringify({ alt: file.name }))
  return (await j(await fetch('/api/media', { method: 'POST', credentials: 'include', body: form }))).doc as MediaItem
}

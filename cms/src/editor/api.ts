import type { EditorDoc } from './types'
import { docToEditorDoc } from './map'

const json = { 'content-type': 'application/json' }
async function j(res: Response) {
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
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
  const data = await j(await fetch('/api/media?limit=100&depth=0', { credentials: 'include' }))
  return data.docs as MediaItem[]
}
export async function uploadMedia(file: File): Promise<MediaItem> {
  const form = new FormData()
  form.append('file', file)
  form.append('_payload', JSON.stringify({ alt: file.name }))
  return (await j(await fetch('/api/media', { method: 'POST', credentials: 'include', body: form }))).doc as MediaItem
}

import type { Payload } from 'payload'
import { categoryPath, casePath } from '../generate/redirects'

export function relationId(value: unknown): string | number | undefined {
  if (value == null) return undefined
  if (typeof value === 'object') return (value as { id?: string | number }).id
  return value as string | number
}

export async function categorySlugOf(payload: Payload, value: unknown): Promise<string | undefined> {
  const id = relationId(value)
  if (id == null) return undefined
  if (value && typeof value === 'object' && 'slug' in value) {
    return String((value as { slug?: string }).slug || '') || undefined
  }
  const category = await payload.findByID({ collection: 'case-categories', id, depth: 0 }).catch(() => null)
  return category?.slug || undefined
}

export async function upsertRedirect(payload: Payload, from: string, to: string): Promise<void> {
  if (!from || !to || from === to) return
  const existing = await payload.find({
    collection: 'case-redirects',
    where: { from: { equals: from } },
    limit: 1,
    depth: 0,
  }).catch(() => null)
  const data = { from, to, createdAt: new Date().toISOString() }
  if (existing?.docs[0]) {
    await payload.update({ collection: 'case-redirects', id: existing.docs[0].id, data })
    return
  }
  await payload.create({ collection: 'case-redirects', data }).catch(() => null)
}

export async function redirectCaseMove(
  payload: Payload,
  previousCategory: unknown,
  previousSlug: string,
  nextCategory: unknown,
  nextSlug: string,
): Promise<void> {
  const oldCategory = await categorySlugOf(payload, previousCategory)
  const newCategory = await categorySlugOf(payload, nextCategory)
  if (!oldCategory || !newCategory) return
  await upsertRedirect(payload, casePath(oldCategory, previousSlug), casePath(newCategory, nextSlug))
}

export async function redirectCategorySlug(
  payload: Payload,
  categoryId: string | number,
  oldSlug: string,
  newSlug: string,
  pageSize: number,
): Promise<void> {
  if (!oldSlug || !newSlug || oldSlug === newSlug) return
  await upsertRedirect(payload, categoryPath(oldSlug), categoryPath(newSlug))

  const cases = await payload.find({
    collection: 'cases',
    where: { category: { equals: categoryId } },
    limit: 1000,
    depth: 0,
  }).catch(() => ({ docs: [] as any[] }))
  for (const item of cases.docs) {
    await upsertRedirect(payload, casePath(oldSlug, item.slug), casePath(newSlug, item.slug))
  }

  const pageCount = Math.max(1, Math.ceil(cases.docs.length / Math.max(1, pageSize || 12)))
  for (let page = 2; page <= pageCount; page++) {
    await upsertRedirect(payload, `/blog/${oldSlug}/page/${page}/`, `/blog/${newSlug}/page/${page}/`)
  }
}

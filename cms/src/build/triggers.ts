/**
 * 页面 / 文章只有“公开内容”变化才需要重建：
 * 新建草稿、草稿间保存不影响静态站；发布、已发布内容修改、取消发布、删除需要重建。
 */
export function shouldRebuildPublishedChange(
  operation: 'create' | 'update' | 'delete',
  doc?: { _status?: string | null } | null,
  previousDoc?: { _status?: string | null } | null,
): boolean {
  if (operation === 'delete') return doc?._status === 'published'
  return doc?._status === 'published' || previousDoc?._status === 'published'
}


/**
 * 页面/文章保存后是否需要重建：
 * - 发布内容变化（publish / 已发布内容修改）→ 需要；
 * - 已发布文档的“保存草稿”→ 公开版本未变，不需要；
 * - 取消发布（没有已发布版本了）/ 删除 → 需要。
 */
export async function shouldRebuildPublishedDocChange(args: {
  operation: 'create' | 'update' | 'delete'
  doc?: { _status?: string | null } | null
  previousDoc?: { _status?: string | null } | null
  loadPublished: () => Promise<{ _status?: string | null } | null>
}): Promise<boolean> {
  const { doc, previousDoc } = args
  if (doc?._status === 'published') return true
  if (previousDoc?._status !== 'published') return false
  if (args.operation === 'delete') return true
  const published = await args.loadPublished().catch(() => null)
  return !published || published._status !== 'published'
}

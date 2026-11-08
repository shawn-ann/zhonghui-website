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

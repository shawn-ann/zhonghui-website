// 仅 Pages 的文档编辑视图（/admin/collections/pages/:id，排除 create/versions/api）。
// 服务端布局与客户端 RouteSync 共用（无 'use client'，可双端调用）。
export const EDITOR_PATH = /^\/admin\/collections\/pages\/(?!create(?:\/|$))[^/]+$/

export function isEditorPath(pathname?: string | null): boolean {
  return EDITOR_PATH.test(pathname || '')
}

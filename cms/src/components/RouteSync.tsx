'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { isEditorPath } from '@/lib/editorRoute'

/**
 * 同步 html.ed-route：首屏由服务端 htmlProps 设置；客户端跳转时由本组件保持正确，
 * 避免离开编辑器后仍隐藏 app-header/doc-header。
 */
export default function RouteSync() {
  const pathname = usePathname()
  useEffect(() => {
    document.documentElement.classList.toggle('ed-route', isEditorPath(pathname))
  }, [pathname])
  return null
}

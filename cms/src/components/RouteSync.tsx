'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { adminHtmlClasses } from '@/lib/adminRoute'

const SHELL_CLASSES = ['ed-route', 'admin-shell', 'admin-custom-page'] as const

/**
 * 同步管理外壳类名：首屏由服务端 htmlProps 设置；客户端跳转时由本组件保持正确。
 */
export default function RouteSync() {
  const pathname = usePathname()
  useEffect(() => {
    const classes = adminHtmlClasses(pathname).split(' ').filter(Boolean)
    for (const name of SHELL_CLASSES) {
      document.documentElement.classList.toggle(name, classes.includes(name))
    }
  }, [pathname])
  return null
}

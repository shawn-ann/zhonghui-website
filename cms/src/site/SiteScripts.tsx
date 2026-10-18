'use client'
import { useEffect } from 'react'

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[data-site-src="${src}"]`)
    if (existing) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.async = false
    s.dataset.siteSrc = src
    s.onload = () => resolve()
    s.onerror = () => resolve()
    document.body.appendChild(s)
  })
}

/** 预览页脚本：水合完成后再加载 Swiper/站点交互，避免修改 SSR DOM 造成 hydration mismatch。 */
export function SiteScripts({ lockLinks = false }: { lockLinks?: boolean }) {
  useEffect(() => {
    if (lockLinks) {
      const lock = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null
        if (target?.closest?.('a')) e.preventDefault()
      }
      document.addEventListener('click', lock, true)
      void loadScript('/assets/swiper-bundle.min.js').then(() => loadScript('/assets/main.js'))
      return () => document.removeEventListener('click', lock, true)
    }
    void loadScript('/assets/swiper-bundle.min.js').then(() => loadScript('/assets/main.js'))
  }, [lockLinks])
  return null
}

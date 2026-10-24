'use client'
import React from 'react'
import Link from 'next/link'
import { useAuth, useConfig } from '@payloadcms/ui'
import { AdminIcon } from './icons'

export default function AdminMobileBar() {
  const { config } = useConfig()
  const { user } = useAuth()
  const adminRoute = config.routes.admin || '/admin'
  const email = user?.email || ''
  const name = (user as { name?: string } | null)?.name || '管理员'

  return (
    <div className="zc-mobilebar">
      <button
        aria-label="打开导航"
        className="zc-mobilebar__button"
        onClick={() => document.documentElement.classList.toggle('zc-nav-open')}
        type="button"
      >
        <AdminIcon name="burger" size={20} />
      </button>
      <Link href={`${adminRoute}/collections/pages`}>
        <img alt="中惠文化" className="zc-mobilebar__logo" src="/brand/admin-logo.png" />
      </Link>
      <span className="zc-mobilebar__spacer" />
      <Link aria-label="账号" className="zc-avatar" href={`${adminRoute}/account`}>
        {name.slice(0, 1).toUpperCase()}
      </Link>
    </div>
  )
}

'use client'
import React from 'react'
import type { BuildStatus } from './api'

export default function TopBar({
  id, title, status, dirty, build, publishing, onSave, onPublish, onPreview,
}: {
  id: number | string
  title: string
  status?: 'draft' | 'published'
  dirty: boolean
  build?: BuildStatus
  publishing?: boolean
  onSave: () => void
  onPublish: () => void
  onPreview: () => void
}) {
  const busy = publishing || build?.status === 'building'
  const buttonLabel = publishing ? '发布中…' : build?.status === 'building' ? '构建中…' : '发布'
  return (
    <div className="ed-topbar">
      <a className="ed-back" href="/admin/collections/pages" title="返回页面列表">← 页面列表</a>
      <span className="ed-crumb-sep">/</span>
      <span className="ed-title">{title}</span>
      <span className="ed-status">{status === 'published' ? '已发布' : '草稿'}{dirty ? ' · 未保存' : ''}</span>
      <span className="ed-spacer" />
      <nav className="ed-docnav" aria-label="页面导航">
        <a className="is-active" href={`/admin/collections/pages/${id}`}>编辑</a>
      </nav>
      <div className="ed-actions">
        <a className="ed-account" href="/admin/tutorial#pages" title="查看页面配置教程">教程</a>
        <a className="ed-account" href="/admin/account" title="账号">账号</a>
        <button onClick={onPreview}>预览</button>
        <button onClick={onSave}>保存</button>
        <button
          className="ed-publish"
          onClick={onPublish}
          disabled={busy}
          title={busy ? '发布/构建中，请稍候' : undefined}
        >{buttonLabel}</button>
      </div>
    </div>
  )
}

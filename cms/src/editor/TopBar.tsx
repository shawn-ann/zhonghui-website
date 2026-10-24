'use client'
import React from 'react'
import type { BuildStatus } from './api'

function buildLabel(build?: BuildStatus) {
  if (!build || build.status === 'idle') return null
  if (build.status === 'building') return '构建中…'
  if (build.status === 'success') {
    const t = build.finishedAt ? new Date(build.finishedAt).toLocaleTimeString() : ''
    return `构建成功${t ? ` · ${t}` : ''}`
  }
  return `构建失败${build.error ? `：${build.error}` : ''}`
}

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
  const label = buildLabel(build)
  return (
    <div className="ed-topbar">
      <span className="ed-title">页面：{title}</span>
      <span className="ed-status">{status === 'published' ? '已发布' : '草稿'}{dirty ? ' · 未保存' : ''}</span>
      {label ? (
        <span className={`ed-build is-${build?.status}`} title={build?.logTail}>
          {label}
        </span>
      ) : null}
      <span className="ed-spacer" />
      <nav className="ed-docnav">
        <a className="is-active" href={`/admin/collections/pages/${id}`}>编辑</a>
        <a href={`/admin/collections/pages/${id}/versions`}>版本</a>
        <a href={`/admin/collections/pages/${id}/api`}>API</a>
      </nav>
      <div className="ed-actions">
        <a className="ed-account" href="/admin/account" title="账号">账号</a>
        <button onClick={onPreview}>预览</button>
        <button onClick={onSave}>保存</button>
        <button
          className="ed-publish"
          onClick={onPublish}
          disabled={publishing || build?.status === 'building'}
          title={publishing || build?.status === 'building' ? '发布/构建中，请稍候' : undefined}
        >发布</button>
      </div>
    </div>
  )
}

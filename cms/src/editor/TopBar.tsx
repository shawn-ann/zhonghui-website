'use client'
import React from 'react'

export default function TopBar({
  title, status, dirty, onSave, onPublish, onPreview,
}: {
  title: string
  status?: 'draft' | 'published'
  dirty: boolean
  onSave: () => void
  onPublish: () => void
  onPreview: () => void
}) {
  return (
    <div className="ed-topbar">
      <span className="ed-title">页面：{title}</span>
      <span className="ed-status">{status === 'published' ? '已发布' : '草稿'}{dirty ? ' · 未保存' : ''}</span>
      <div className="ed-actions">
        <button onClick={onPreview}>预览</button>
        <button onClick={onSave}>保存</button>
        <button className="ed-publish" onClick={onPublish}>发布</button>
      </div>
    </div>
  )
}

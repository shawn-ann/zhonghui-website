'use client'
import React from 'react'

type Device = 'desktop' | 'tablet' | 'mobile'

export default function TopBar({
  title, status, dirty, onSave, onPublish, onPreview, device = 'desktop', onDeviceChange,
}: {
  title: string
  status?: 'draft' | 'published'
  dirty: boolean
  onSave: () => void
  onPublish: () => void
  onPreview: () => void
  device?: Device
  onDeviceChange?: (d: Device) => void
}) {
  const devices: { key: Device; label: string }[] = [
    { key: 'desktop', label: '桌面' },
    { key: 'tablet', label: '平板' },
    { key: 'mobile', label: '手机' },
  ]
  return (
    <div className="ed-topbar">
      <span className="ed-title">页面：{title}</span>
      <span className="ed-status">{status === 'published' ? '已发布' : '草稿'}{dirty ? ' · 未保存' : ''}</span>
      <div className="ed-device">
        {devices.map((d) => (
          <button
            key={d.key}
            type="button"
            className={device === d.key ? 'is-active' : ''}
            onClick={() => onDeviceChange?.(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="ed-actions">
        <button onClick={onPreview}>预览</button>
        <button onClick={onSave}>保存</button>
        <button className="ed-publish" onClick={onPublish}>发布</button>
      </div>
    </div>
  )
}

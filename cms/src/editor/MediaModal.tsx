'use client'
import React, { useEffect, useRef, useState } from 'react'
import { listMedia, uploadMedia, type MediaItem } from './api'

export default function MediaModal({
  onClose,
  onSelect,
  onSelectMany,
  multiple = false,
  title,
}: {
  onClose: () => void
  onSelect?: (item: MediaItem) => void
  onSelectMany?: (items: MediaItem[]) => void
  multiple?: boolean
  title?: string
}) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [selected, setSelected] = useState<MediaItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => { listMedia().then(setItems).catch(() => setItems([])) }, [])

  const selectedIds = new Set(selected.map((item) => item.id))

  const toggle = (item: MediaItem) => {
    setSelected((current) => {
      if (current.some((next) => next.id === item.id)) return current.filter((next) => next.id !== item.id)
      return [...current, item]
    })
  }

  const pick = (item: MediaItem) => {
    if (multiple) toggle(item)
    else onSelect?.(item)
  }

  const upload = async (f: File) => {
    setBusy(true)
    setError('')
    try {
      const m = await uploadMedia(f)
      setItems((s) => [m, ...s])
      if (multiple) {
        setSelected((current) => [...current, m])
      } else {
        onSelect?.(m)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败，请重试')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="ed-modal" onClick={onClose}>
      <div className="ed-modal-body" onClick={(e) => e.stopPropagation()}>
        <div className="ed-modal-head">
          <b>{title || (multiple ? '选择图片（可多选）' : '选择图片')}</b>
          <button type="button" onClick={onClose}>✕</button>
        </div>
        <div className="ed-modal-actions">
          <label className={`ed-upload-btn${busy ? ' is-busy' : ''}`}>
            <span>{busy ? '上传中…' : '上传'}</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              disabled={busy}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f) }}
            />
          </label>
          {error ? <span className="ed-modal-error">{error}</span> : null}
        </div>
        <div className="ed-media-grid">
          {items.map((m) => (m.url ? (
            <button
              type="button"
              key={m.id}
              className={selectedIds.has(m.id) ? 'is-selected' : undefined}
              onClick={() => pick(m)}
            >
              <img src={m.url} alt={m.alt || ''} />
              {selectedIds.has(m.id) ? <span className="ed-media-check">✓</span> : null}
            </button>
          ) : null))}
        </div>
        {multiple ? (
          <div className="ed-modal-footer">
            <button type="button" className="ed-modal-cancel" onClick={onClose}>取消</button>
            <button
              type="button"
              className="ed-modal-confirm"
              disabled={!selected.length}
              onClick={() => { onSelectMany?.(selected); onClose() }}
            >
              插入 {selected.length || ''} 张
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

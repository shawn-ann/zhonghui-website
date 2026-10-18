'use client'
import React, { useEffect, useRef, useState } from 'react'
import { listMedia, uploadMedia, type MediaItem } from './api'

export default function MediaModal({ onClose, onSelect }: { onClose: () => void; onSelect: (item: MediaItem) => void }) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => { listMedia().then(setItems).catch(() => setItems([])) }, [])

  const upload = async (f: File) => {
    setBusy(true)
    setError('')
    try {
      const m = await uploadMedia(f)
      setItems((s) => [m, ...s])
      onSelect(m)
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
        <div className="ed-modal-head"><b>选择图片</b><button type="button" onClick={onClose}>✕</button></div>
        <div className="ed-modal-actions">
          <label className={`ed-upload-btn${busy ? ' is-busy' : ''}`}>
            {busy ? '上传中…' : '上传'}
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
          {items.map((m) => (m.url ? <button type="button" key={m.id} onClick={() => onSelect(m)}><img src={m.url} alt={m.alt || ''} /></button> : null))}
        </div>
      </div>
    </div>
  )
}

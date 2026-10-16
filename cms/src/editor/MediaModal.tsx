'use client'
import React, { useEffect, useRef, useState } from 'react'
import { listMedia, uploadMedia, type MediaItem } from './api'

export default function MediaModal({ onClose, onSelect }: { onClose: () => void; onSelect: (url: string) => void }) {
  const [items, setItems] = useState<MediaItem[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => { listMedia().then(setItems).catch(() => setItems([])) }, [])
  const upload = async (f: File) => { const m = await uploadMedia(f); setItems((s) => [m, ...s]); if (m.url) onSelect(m.url) }
  return (
    <div className="ed-modal" onClick={onClose}>
      <div className="ed-modal-body" onClick={(e) => e.stopPropagation()}>
        <div className="ed-modal-head"><b>选择图片</b><button onClick={onClose}>✕</button></div>
        <div className="ed-modal-actions">
          <button onClick={() => fileRef.current?.click()}>上传</button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </div>
        <div className="ed-media-grid">
          {items.map((m) => (m.url ? <button key={m.id} onClick={() => onSelect(m.url!)}><img src={m.url} alt={m.alt || ''} /></button> : null))}
        </div>
      </div>
    </div>
  )
}

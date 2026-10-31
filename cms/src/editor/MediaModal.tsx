'use client'
import React, { useEffect, useRef, useState } from 'react'
import { listMedia, uploadMedia, type MediaItem } from './api'

type InitialImage = { src: string; alt?: string }

function toMediaItem(image: InitialImage): MediaItem {
  return { id: `url:${image.src}`, url: image.src, alt: image.alt || '' }
}

function sameMedia(a: MediaItem, b: MediaItem): boolean {
  if (a.url && b.url) return a.url === b.url
  return a.id === b.id
}

function initialItems(images?: InitialImage[]): MediaItem[] {
  const seen = new Set<string>()
  const items: MediaItem[] = []
  for (const image of images || []) {
    if (!image?.src || seen.has(image.src)) continue
    seen.add(image.src)
    items.push(toMediaItem(image))
  }
  return items
}

export default function MediaModal({
  onClose,
  onSelect,
  onSelectMany,
  multiple = false,
  title,
  initialImages,
  confirmVerb = '插入',
}: {
  onClose: () => void
  onSelect?: (item: MediaItem) => void
  onSelectMany?: (items: MediaItem[]) => void
  multiple?: boolean
  title?: string
  initialImages?: InitialImage[]
  confirmVerb?: string
}) {
  const [initial] = useState(() => initialItems(initialImages))
  const [items, setItems] = useState<MediaItem[]>(initial)
  const [selected, setSelected] = useState<MediaItem[]>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listMedia()
      .then((media) => {
        const libraryUrls = new Set(media.map((next) => next.url).filter(Boolean))
        setItems((current) => [
          ...current.filter((item) => !item.url || !libraryUrls.has(item.url)),
          ...media,
        ])
        setSelected((current) => current.map(
          (item) => media.find((next) => next.url && next.url === item.url) || item,
        ))
      })
      .catch(() => setItems(initial))
  }, [initial])

  const isSelected = (item: MediaItem) => selected.some((next) => sameMedia(next, item))

  const toggle = (item: MediaItem) => {
    setSelected((current) => {
      if (current.some((next) => sameMedia(next, item))) {
        return current.filter((next) => !sameMedia(next, item))
      }
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
              className={isSelected(m) ? 'is-selected' : undefined}
              onClick={() => pick(m)}
            >
              <img src={m.url} alt={m.alt || ''} />
              {isSelected(m) ? <span className="ed-media-check">✓</span> : null}
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
              {confirmVerb} {selected.length} 张
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

'use client'
import React, { useEffect, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { listMedia, type MediaItem } from './api'
import { $insertImageRow } from './ImageRowNode'

export default function ImageRowPicker({ onClose }: { onClose: () => void }) {
  const [editor] = useLexicalComposerContext()
  const [items, setItems] = useState<MediaItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMedia()
      .then((media) => setItems(media.filter((item) => item.url)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (url: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  const insert = () => {
    const images = items
      .filter((item) => item.url && selected.has(item.url))
      .map((item) => ({ src: item.url as string, alt: item.alt || '' }))
    if (!images.length) return
    editor.update(() => { $insertImageRow(images) })
    onClose()
  }

  return (
    <div className="ed-modal" onClick={onClose}>
      <div className="ed-modal-body rt-picker" onClick={(e) => e.stopPropagation()}>
        <div className="ed-modal-head">
          <b>选择图集图片</b>
          <button type="button" onClick={onClose}>✕</button>
        </div>
        <p className="rt-picker-hint">选择 2–4 张图片，插入为一行图集。</p>
        {loading ? <p className="ed-muted">加载中…</p> : null}
        <div className="rt-picker-grid">
          {items.map((item) => {
            const url = item.url as string
            return (
              <button
                type="button"
                key={item.id}
                className={`rt-picker-item${selected.has(url) ? ' is-selected' : ''}`}
                onClick={() => toggle(url)}
              >
                <img src={url} alt={item.alt || ''} />
                {selected.has(url) ? <span className="rt-picker-check">✓</span> : null}
              </button>
            )
          })}
        </div>
        <div className="rt-picker-actions">
          <button type="button" className="rt-cancel" onClick={onClose}>取消</button>
          <button type="button" className="rt-done" onClick={insert} disabled={!selected.size}>
            插入 {selected.size || ''} 张
          </button>
        </div>
      </div>
    </div>
  )
}

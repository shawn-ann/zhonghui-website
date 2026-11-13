'use client'
import React, { useEffect, useState } from 'react'
import { FieldLabel, useField } from '@payloadcms/ui'
import MediaModal from '../../editor/MediaModal'
import type { MediaItem } from '../../editor/api'

function relationId(value: unknown): number | string | undefined {
  if (value == null) return undefined
  if (typeof value === 'object') return (value as { id?: number | string }).id
  return value as number | string
}

export default function ArticleCoverField({ path, field }: { path: string; field: any }) {
  const { value, setValue } = useField<number | string | null>({ path })
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const id = relationId(value)

  useEffect(() => {
    let cancelled = false
    if (id == null) {
      setUrl('')
      return
    }
    if (value && typeof value === 'object' && (value as any).url) {
      setUrl(String((value as any).url))
      return
    }
    fetch(`/api/media/${encodeURIComponent(String(id))}?depth=0`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc) => { if (!cancelled) setUrl(doc?.url || '') })
      .catch(() => { if (!cancelled) setUrl('') })
    return () => { cancelled = true }
  }, [id, value])

  const label = typeof field?.label === 'string' ? field.label : '封面图'

  return (
    <div className="field-type article-cover-field">
      <FieldLabel label={label} path={path} required={Boolean(field?.required)} />
      <div className="acf-picker">
        <div
          className={`acf-cover${url ? ' has-image' : ''}`}
          style={url ? { backgroundImage: `url('${url}')` } : undefined}
        >
          {url ? null : <span className="acf-placeholder">未选择封面图</span>}
        </div>
        <div className="acf-actions">
          <button type="button" className="zc-btn secondary" onClick={() => setOpen(true)}>
            {url ? '更换图片' : '选择图片'}
          </button>
        </div>
      </div>
      <div className="field-description">列表卡片按 1:1 裁切；详情页头图会整幅裁切。</div>
      {open ? (
        <MediaModal
          title="选择封面图"
          onClose={() => setOpen(false)}
          onSelect={(item: MediaItem) => {
            setValue(item.id)
            setUrl(item.url || '')
            setOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

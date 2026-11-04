'use client'
import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'
import MediaModal from '../../editor/MediaModal'
import '../../editor/editor.css'

function relationId(value: unknown): number | string | undefined {
  if (value == null) return undefined
  if (typeof value === 'object') return (value as { id?: number | string }).id
  return value as number | string
}

/** 后台分类 Banner 使用与页面编辑器一致的媒体库选择弹窗。 */
export default function MediaPickerField({ path, field }: { path: string; field: any }) {
  const { value, setValue } = useField<number | string | null>({ path })
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const id = relationId(value)

  useEffect(() => {
    let cancelled = false
    if (id == null) {
      setUrl('')
      return
    }
    if (value && typeof value === 'object' && 'url' in value && (value as any).url) {
      setUrl(String((value as any).url))
      return
    }
    setLoading(true)
    fetch(`/api/media/${encodeURIComponent(String(id))}?depth=0`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc) => { if (!cancelled) setUrl(doc?.url || '') })
      .catch(() => { if (!cancelled) setUrl('') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, value])

  const label = typeof field?.label === 'string' ? field.label : '分类页 Banner'
  const description = field?.admin?.description

  return (
    <div className="field-type media-picker-field">
      <label className="field-label">{label}</label>
      {description ? <div className="field-description" style={{ marginBottom: 8 }}>{description}</div> : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 220, height: 120, borderRadius: 6, overflow: 'hidden', flex: '0 0 220px',
          background: '#f3eef1', border: '1px solid #ede4e8', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: '#8c7a83', fontSize: 12,
        }}>
          {url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (loading ? '加载中…' : '未选择图片')}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn--style-secondary btn--size-medium" onClick={() => setOpen(true)} type="button">
            选择图片
          </button>
          {id != null ? (
            <button className="btn btn--style-secondary btn--size-medium" onClick={() => setValue(null)} type="button">
              移除
            </button>
          ) : null}
        </div>
      </div>
      {open ? (
        <MediaModal
          title="选择分类 Banner"
          onClose={() => setOpen(false)}
          onSelect={(item) => {
            setValue(item.id)
            setUrl(item.url || '')
            setOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

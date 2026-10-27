'use client'
import React, { useState } from 'react'
import type { FieldDef, RepeaterItemField } from './blocks'
import MediaModal from './MediaModal'
import type { MediaItem } from './api'

type Value = Record<string, unknown>[]

export default function RepeaterControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: Value | undefined
  onChange: (value: Value) => void
}) {
  const items = Array.isArray(value) ? value : []
  const [mediaTarget, setMediaTarget] = useState<{ index: number; key: string } | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const update = (next: Value) => onChange(next)
  const setField = (index: number, key: string, next: unknown) => {
    update(items.map((item, i) => (i === index ? { ...item, [key]: next } : item)))
  }
  const add = () => {
    update([
      ...items,
      Object.fromEntries((field.itemFields || []).map((f) => [f.key, ''])),
    ])
    setOpenIndex(items.length)
  }
  const remove = (index: number) => update(items.filter((_, i) => i !== index))
  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir
    if (to < 0 || to >= items.length) return
    const next = items.slice()
    const [item] = next.splice(index, 1)
    next.splice(to, 0, item)
    update(next)
  }

  const renderField = (f: RepeaterItemField, index: number) => {
    const raw = items[index]?.[f.key]
    if (f.control === 'text') {
      return (
        <input
          value={String(raw ?? '')}
          onChange={(e) => setField(index, f.key, e.target.value)}
          placeholder={f.label}
        />
      )
    }
    if (f.control === 'textarea') {
      return (
        <textarea
          value={String(raw ?? '')}
          rows={2}
          onChange={(e) => setField(index, f.key, e.target.value)}
          placeholder={f.label}
        />
      )
    }
    const url = String(raw ?? '')
    return (
      <div className="rep-media">
        {url ? <img src={url} alt="" /> : <span>未选择</span>}
        <button type="button" onClick={() => setMediaTarget({ index, key: f.key })}>选择图片</button>
        {url ? (
          <button type="button" className="rep-danger" onClick={() => setField(index, f.key, '')}>移除</button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="rep">
      <div className="ed-label">{field.label}</div>
      {items.map((_, index) => (
        <div className="rep-item" key={index}>
          <div className="rep-head">
            <button type="button" className="rep-toggle" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
              {openIndex === index ? '▾' : '▸'} #{index + 1}
            </button>
            <span className="rep-actions">
              <button type="button" disabled={index === 0} title={`上移条目 ${index + 1}`} onClick={() => move(index, -1)}>↑</button>
              <button type="button" disabled={index === items.length - 1} title={`下移条目 ${index + 1}`} onClick={() => move(index, 1)}>↓</button>
              <button type="button" className="rep-danger" title={`删除条目 ${index + 1}`} onClick={() => remove(index)}>删除</button>
            </span>
          </div>
          {openIndex === index ? (field.itemFields || []).map((f) => (
            <label className="rep-field" key={f.key}>
              <span>{f.label}</span>
              {renderField(f, index)}
            </label>
          )) : null}
        </div>
      ))}
      <button type="button" className="rep-add" onClick={add}>{field.addLabel || '添加条目'}</button>
      {mediaTarget ? (
        <MediaModal
          onClose={() => setMediaTarget(null)}
          onSelect={(item: MediaItem) => {
            setField(mediaTarget.index, mediaTarget.key, item.url || '')
            setMediaTarget(null)
          }}
        />
      ) : null}
    </div>
  )
}

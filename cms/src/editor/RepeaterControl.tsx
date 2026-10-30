'use client'
import React, { useState } from 'react'
import type { FieldDef } from './blocks'
import MediaModal from './MediaModal'
import type { MediaItem } from './api'

type Value = Record<string, unknown>[]

function text(value: unknown): string {
  return String(value ?? '').trim()
}

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
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

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
  const remove = (index: number) => {
    if (!window.confirm(`确定删除条目 #${index + 1}？`)) return
    update(items.filter((_, i) => i !== index))
    setOpenIndex(null)
  }
  const duplicate = (index: number) => {
    const next = items.slice()
    next.splice(index + 1, 0, { ...items[index] })
    update(next)
    setOpenIndex(index + 1)
  }
  const move = (from: number, to: number) => {
    if (from === to) return
    const next = items.slice()
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    update(next)
    setOpenIndex(to)
  }

  const renderField = (f: NonNullable<FieldDef['itemFields']>[number], index: number) => {
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
          rows={3}
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
      <div className="ed-label">
        {field.label}
        {items.length ? <span className="rep-count"> · {items.length} 条</span> : null}
      </div>
      <div className="rep-list">
        {items.map((item, index) => {
          const title = field.titleKey ? text(item[field.titleKey]) : ''
          const subtitle = field.subtitleKey ? text(item[field.subtitleKey]) : ''
          const mediaUrl = field.mediaKey ? text(item[field.mediaKey]) : ''
          const open = openIndex === index
          return (
            <div
              className={`rep-item${open ? ' is-open' : ''}${overIndex === index ? ' is-over' : ''}`}
              key={index}
              onDragOver={(e) => {
                if (dragIndex == null || dragIndex === index) return
                e.preventDefault()
                setOverIndex(index)
              }}
              onDragLeave={() => setOverIndex((v) => (v === index ? null : v))}
              onDrop={(e) => {
                e.preventDefault()
                if (dragIndex != null) move(dragIndex, index)
                setDragIndex(null)
                setOverIndex(null)
              }}
            >
              <div className="rep-head">
                <span
                  className="rep-drag"
                  draggable
                  title="拖动排序"
                  onDragStart={(e) => {
                    setDragIndex(index)
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', String(index))
                  }}
                  onDragEnd={() => {
                    setDragIndex(null)
                    setOverIndex(null)
                  }}
                >⠿</span>
                {field.mediaKey ? (
                  mediaUrl
                    ? <img className="rep-thumb" src={mediaUrl} alt="" />
                    : <span className="rep-thumb rep-thumb-empty">{index + 1}</span>
                ) : <span className="rep-index">{index + 1}</span>}
                <button type="button" className="rep-toggle" onClick={() => setOpenIndex(open ? null : index)}>
                  <span className="rep-title">{title || `条目 #${index + 1}`}</span>
                  <span className="rep-sub">{subtitle || (title ? '' : '未填写')}</span>
                </button>
                <span className="rep-actions">
                  <button type="button" title={`复制条目 ${index + 1}`} onClick={() => duplicate(index)}>⧉</button>
                  <button type="button" className="rep-danger" title={`删除条目 ${index + 1}`} onClick={() => remove(index)}>✕</button>
                </span>
                <button
                  type="button"
                  className="rep-chev"
                  aria-label={open ? '收起条目' : '展开条目'}
                  onClick={() => setOpenIndex(open ? null : index)}
                >{open ? '▴' : '▾'}</button>
              </div>
              {open ? (
                <div className="rep-open">
                  {(field.itemFields || []).map((f) => (
                    <label className="rep-field" key={f.key}>
                      <span>{f.label}</span>
                      {renderField(f, index)}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
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

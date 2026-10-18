'use client'
import React, { useState } from 'react'
import { BLOCKS, isLayout, allowedChildTypes } from './blocks'
import type { Block } from './types'
import { blockChildren } from './state'
import { TextControl, TextAreaControl, NumberControl, SelectControl, BooleanControl, LinkControl, BgControl, MediaControl, MediaListControl, ColorControl } from './controls'
import MediaModal from './MediaModal'
import AddChildPicker from './AddChildPicker'
import type { MediaItem } from './api'

export default function PropertyPanel({
  block, onChange, onPickMedia, onSelectChild, onAddChild, onRemoveChild, onMoveChild,
}: {
  block?: Block
  onChange: (key: string, value: unknown) => void
  onPickMedia?: (item: MediaItem) => void
  onSelectChild?: (id: string) => void
  onAddChild?: (type: Block['type']) => void
  onRemoveChild?: (index: number) => void
  onMoveChild?: (index: number, dir: -1 | 1) => void
}) {
  const [mediaFor, setMediaFor] = useState<string | null>(null)
  if (!block) return <aside className="ed-props"><div className="ed-label">属性</div><p className="ed-muted">未选中区块</p></aside>
  if ((block as { type: string }).type === '_unknown') {
    return <aside className="ed-props"><div className="ed-label">属性</div><p className="ed-muted">未知区块（透传，保存时原样保留）</p></aside>
  }
  const meta = BLOCKS[block.type]
  const b = block as unknown as Record<string, unknown>
  const val = (k: string) => b[k]
  const isContainer = isLayout(block.type)
  const allowed = isLayout(block.type) ? allowedChildTypes(block.type) : []
  const children = blockChildren(block)

  return (
    <aside className="ed-props">
      <div className="ed-label">属性 · {meta.label}</div>
      {meta.fields.map((f) => {
        switch (f.control) {
          case 'text': return <TextControl key={f.key} label={f.label} value={val(f.key) as string} onChange={(v) => onChange(f.key, v)} />
          case 'textarea': return <TextAreaControl key={f.key} label={f.label} value={val(f.key) as string} onChange={(v) => onChange(f.key, v)} />
          case 'number': return <NumberControl key={f.key} label={f.label} value={val(f.key) as number} onChange={(v) => onChange(f.key, v)} />
          case 'select': return <SelectControl key={f.key} label={f.label} value={val(f.key) as string} options={f.options ?? []} onChange={(v) => onChange(f.key, v)} />
          case 'boolean': return <BooleanControl key={f.key} label={f.label} value={val(f.key) as boolean} onChange={(v) => onChange(f.key, v)} />
          case 'link': return <LinkControl key={f.key} label={f.label} value={val(f.key) as string} onChange={(v) => onChange(f.key, v)} />
          case 'bg': return <BgControl key={f.key} label={f.label} value={val(f.key) as string} onChange={(v) => onChange(f.key, v)} onPick={() => setMediaFor(f.key)} />
          case 'color': return <ColorControl key={f.key} label={f.label} value={val(f.key) as string} onChange={(v) => onChange(f.key, v)} />
          case 'media': return <MediaControl key={f.key} label={f.label} value={val(f.key) as string} onPick={() => setMediaFor(f.key)} onChange={(v) => onChange(f.key, v)} />
          case 'mediaList': return <MediaListControl key={f.key} label={f.label} value={val(f.key) as string[]} onAdd={() => setMediaFor(f.key)} onChange={(v) => onChange(f.key, v)} />
        }
      })}
      {isContainer ? (
        <div className="ed-grid-cells">
          <div className="ed-label">子组件</div>
          {children.length === 0 ? <p className="ed-muted">暂无子组件</p> : null}
          {children.map((c, i) => (
            <div key={c._id ?? i} className="ed-child-row">
              <span
                className="ed-child-name ed-child-link"
                title="点击编辑该组件"
                onClick={() => c._id && onSelectChild?.(c._id)}
              >{BLOCKS[c.type]?.label ?? c.type}</span>
              <span className="ed-child-actions">
                <button type="button" title="上移" disabled={i === 0} onClick={() => onMoveChild?.(i, -1)}>↑</button>
                <button type="button" title="下移" disabled={i === children.length - 1} onClick={() => onMoveChild?.(i, 1)}>↓</button>
                <button type="button" title="移除" onClick={() => onRemoveChild?.(i)}>✕</button>
              </span>
            </div>
          ))}
          <AddChildPicker types={allowed} onAdd={(type) => onAddChild?.(type)} />
        </div>
      ) : null}
      {mediaFor ? (
        <MediaModal
          onClose={() => setMediaFor(null)}
          onSelect={(item) => {
            onPickMedia?.(item)
            if (item.url) {
              const field = meta.fields.find((f) => f.key === mediaFor)
              if (field?.control === 'mediaList') {
                const list = (val(mediaFor) as string[] | undefined) ?? []
                onChange(mediaFor, [...list, item.url])
              } else {
                onChange(mediaFor, item.url)
              }
            }
            setMediaFor(null)
          }}
        />
      ) : null}
    </aside>
  )
}

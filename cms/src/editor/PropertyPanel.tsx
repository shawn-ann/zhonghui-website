'use client'
import React, { useState } from 'react'
import { BLOCKS } from './blocks'
import type { Block } from './types'
import { TextControl, TextAreaControl, NumberControl, SelectControl, BooleanControl, LinkControl, BgControl, MediaControl } from './controls'
import MediaModal from './MediaModal'
import type { MediaItem } from './api'

export default function PropertyPanel({
  block, onChange, onPickMedia,
}: {
  block?: Block
  onChange: (key: string, value: unknown) => void
  onPickMedia?: (item: MediaItem) => void
}) {
  const [mediaFor, setMediaFor] = useState<string | null>(null)
  if (!block) return <aside className="ed-props"><div className="ed-label">属性</div><p className="ed-muted">未选中区块</p></aside>
  if ((block as { type: string }).type === '_unknown') {
    return <aside className="ed-props"><div className="ed-label">属性</div><p className="ed-muted">未知区块（透传，保存时原样保留）</p></aside>
  }
  const meta = BLOCKS[block.type]
  const b = block as unknown as Record<string, unknown>
  const val = (k: string) => b[k]

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
          case 'bg': return <BgControl key={f.key} label={f.label} value={val(f.key) as string} onChange={(v) => onChange(f.key, v)} />
          case 'media': return <MediaControl key={f.key} label={f.label} value={val(f.key) as string} onPick={() => setMediaFor(f.key)} onChange={(v) => onChange(f.key, v)} />
        }
      })}
      {block.type === 'grid' ? (
        <div className="ed-grid-cells">
          <div className="ed-label">格与子组件（MVP）</div>
          {block.cells.map((c, i) => (
            <div key={i} className="ed-cell-row">格 {i + 1}：{c.components.length} 个子组件</div>
          ))}
          <p className="ed-muted">列数 {block.columns} · 间距 {block.gap}</p>
        </div>
      ) : null}
      {mediaFor ? (
        <MediaModal
          onClose={() => setMediaFor(null)}
          onSelect={(item) => { onPickMedia?.(item); if (item.url) onChange(mediaFor, item.url); setMediaFor(null) }}
        />
      ) : null}
    </aside>
  )
}

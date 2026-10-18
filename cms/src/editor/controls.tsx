'use client'
import React from 'react'

interface Base { label: string }
type V<T> = { value?: T; onChange: (v: T) => void }

export function TextControl({ label, value, onChange }: Base & V<string>) {
  return <label className="ed-ctl"><span>{label}</span><input value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>
}
export function TextAreaControl({ label, value, onChange }: Base & V<string>) {
  return <label className="ed-ctl"><span>{label}</span><textarea rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>
}
export function NumberControl({ label, value, onChange }: Base & V<number>) {
  return <label className="ed-ctl"><span>{label}</span><input type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} /></label>
}
export function SelectControl({ label, value, onChange, options }: Base & V<string> & { options: { label: string; value: string }[] }) {
  return (
    <label className="ed-ctl"><span>{label}</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}
export function BooleanControl({ label, value, onChange }: Base & V<boolean>) {
  return <label className="ed-ctl ed-ctl-inline"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /><span>{label}</span></label>
}
export function LinkControl({ label, value, onChange }: Base & V<string>) {
  return <label className="ed-ctl"><span>{label}</span><input placeholder="/path/ 或 https://…" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>
}
export function BgControl({ label, value, onChange, onPick }: Base & V<string> & { onPick?: () => void }) {
  const v = value ?? ''
  const isImage = !!v && !/^(#|var\(|rgb|hsl|linear-gradient|radial-gradient)/i.test(v)
  return (
    <div className="ed-ctl">
      <span>{label}</span>
      <div className="ed-media-row">
        {isImage
          ? <img className="ed-media-thumb" src={v} alt="" />
          : <span className="ed-bg-swatch" style={{ background: v || '#fff' }} />}
        <button type="button" onClick={onPick}>选择图片</button>
        {v ? <button type="button" onClick={() => onChange('')}>清除</button> : null}
      </div>
      <input
        placeholder="或输入颜色/渐变（如 #FFF1F6 / linear-gradient(…)）"
        value={isImage ? '' : v}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
export function ColorControl({ label, value, onChange }: Base & V<string>) {
  const v = value ?? ''
  const hex = /^#[0-9a-f]{6}$/i.test(v)
    ? v
    : /^#[0-9a-f]{3}$/i.test(v)
      ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
      : '#ffffff'
  return (
    <div className="ed-ctl">
      <span>{label}</span>
      <div className="ed-color-row">
        <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} />
        <input
          placeholder="#FFF1F6"
          value={v}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export function MediaListControl({ label, value, onChange, onAdd }: Base & V<string[]> & { onAdd: () => void }) {
  const list = value ?? []
  const move = (i: number, dir: -1 | 1) => {
    const to = i + dir
    if (to < 0 || to >= list.length) return
    const next = list.slice()
    const [item] = next.splice(i, 1)
    next.splice(to, 0, item)
    onChange(next)
  }
  return (
    <div className="ed-ctl">
      <span>{label}</span>
      {list.length ? (
        <div className="ed-media-list">
          {list.map((src, i) => (
            <div className="ed-media-item" key={`${src}-${i}`}>
              <img className="ed-media-thumb" src={src} alt="" />
              <span className="ed-media-ops">
                <button type="button" title="上移" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button type="button" title="下移" disabled={i === list.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button type="button" title="移除" onClick={() => onChange(list.filter((_, j) => j !== i))}>✕</button>
              </span>
            </div>
          ))}
        </div>
      ) : <p className="ed-muted">暂无图片</p>}
      <button type="button" onClick={onAdd}>添加图片</button>
    </div>
  )
}

export function MediaControl({ label, value, onChange, onPick }: Base & V<string> & { onPick: () => void }) {
  return (
    <div className="ed-ctl"><span>{label}</span>
      <div className="ed-media-row">
        {value ? <img className="ed-media-thumb" src={value} alt="" /> : null}
        <button type="button" onClick={onPick}>{value ? '更换' : '选择图片'}</button>
        {value ? <button type="button" onClick={() => onChange('')}>移除</button> : null}
      </div>
    </div>
  )
}

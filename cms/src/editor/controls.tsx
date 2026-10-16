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
export function BgControl({ label, value, onChange }: Base & V<string>) {
  return <label className="ed-ctl"><span>{label}</span><input placeholder="图片路径 / 颜色 / 渐变" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>
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

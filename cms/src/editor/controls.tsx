'use client'
import React from 'react'
import type { PageSummary } from './api'

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
function hexOf(v: string): string {
  if (/^#[0-9a-f]{6}$/i.test(v)) return v
  if (/^#[0-9a-f]{3}$/i.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
  return '#ffffff'
}

export function TextColorControl({ label, value, onChange }: Base & V<string>) {
  const v = value ?? ''
  const hex = hexOf(v)
  return (
    <div className="ed-ctl">
      <span>{label}</span>
      <div className="ed-color-row">
        <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} />
        <input placeholder="留空沿用主题色" value={v} onChange={(e) => onChange(e.target.value)} />
      </div>
      {v ? <button type="button" className="ed-ctl-clear" onClick={() => onChange('')}>恢复默认</button> : null}
    </div>
  )
}

export function ColorControl({ label, value, onChange }: Base & V<string>) {
  const v = value ?? ''
  const hex = hexOf(v)
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

const GRADIENT_PRESETS = [
  { label: '红渐变', value: 'linear-gradient(90deg, #FC0401 0%, #F5534E 50%, #F4585E 62%, #FC1972 100%)' },
]

export function GradientControl({ label, value, onChange }: Base & V<string>) {
  const v = value ?? ''
  const preset = GRADIENT_PRESETS.find((p) => p.value === v)?.value ?? ''
  return (
    <div className="ed-ctl">
      <span>{label}</span>
      <div className="ed-gradient-row">
        <select value={preset} onChange={(e) => { if (e.target.value) onChange(e.target.value) }}>
          <option value="">选择预设…</option>
          {GRADIENT_PRESETS.map((p) => <option key={p.label} value={p.value}>{p.label}</option>)}
        </select>
        <span className="ed-gradient-preview" style={{ background: v || '#fff' }} />
      </div>
      <input
        placeholder="linear-gradient(90deg, #FC0401 0%, #FC1972 100%)"
        value={v}
        onChange={(e) => onChange(e.target.value)}
      />
      {v ? <button type="button" className="ed-ctl-clear" onClick={() => onChange('')}>清除渐变</button> : null}
    </div>
  )
}

export function PageLinkControl({
  label, linkType, internalPageId, internalRoute, externalUrl, pages, onPatch,
}: {
  label: string
  linkType?: 'none' | 'internal' | 'external'
  internalPageId?: string | number
  internalRoute?: string
  externalUrl?: string
  pages: PageSummary[]
  onPatch: (values: Record<string, unknown>) => void
}) {
  const type = linkType ?? 'none'
  const id = internalPageId != null ? String(internalPageId) : ''
  const current = pages.find((p) => String(p.id) === id)
  const route = current?.route || internalRoute || ''
  const href = type === 'internal' ? route : type === 'external' ? (externalUrl ?? '') : ''
  const changeType = (next: string) => {
    onPatch({
      linkType: next,
      link: next === 'internal' ? route : next === 'external' ? (externalUrl ?? '') : '',
    })
  }
  return (
    <div className="ed-ctl">
      <span>{label}</span>
      <select value={type} onChange={(e) => changeType(e.target.value)}>
        <option value="none">无链接</option>
        <option value="internal">内部页面</option>
        <option value="external">外部链接</option>
      </select>
      {type === 'internal' ? (
        pages.length ? (
          <select
            value={id}
            onChange={(e) => {
              const page = pages.find((p) => String(p.id) === e.target.value)
              onPatch({
                internalPageId: page?.id ?? null,
                internalRoute: page?.route ?? '',
                link: page?.route ?? '',
              })
            }}
          >
            <option value="">选择页面…</option>
            {pages.map((p) => (
              <option key={p.id} value={String(p.id)}>{p.title}（{p.route}）</option>
            ))}
            {id && !current ? <option value={id}>当前页面（{internalRoute || '未知'}）</option> : null}
          </select>
        ) : (
          <p className="ed-muted">暂无已发布页面{internalRoute ? `（当前：${internalRoute}）` : ''}</p>
        )
      ) : null}
      {type === 'external' ? (
        <input
          placeholder="https://… / mailto: / tel:"
          value={externalUrl ?? ''}
          onChange={(e) => onPatch({ externalUrl: e.target.value, link: e.target.value })}
        />
      ) : null}
      <small className="ed-link-preview">跳转：{href || '未设置'}</small>
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

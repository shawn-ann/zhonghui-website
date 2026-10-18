'use client'
import React from 'react'
import { BLOCKS } from './blocks'
import type { Block } from './types'

const box: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 4 }
const line = (w: string): React.CSSProperties => ({ height: 5, width: w, background: '#ddd', borderRadius: 2, marginBottom: 4 })

const THUMBS: Record<Block['type'], React.ReactNode> = {
  banner: (
    <div style={{ display: 'flex', height: 44 }}>
      <div style={{ flex: 1, padding: 6 }}><div style={line('85%')} /><div style={line('70%')} /></div>
      <div style={{ width: '45%', background: 'linear-gradient(135deg,#C2185B,#8A0E4B)' }} />
    </div>
  ),
  heading: (
    <div style={{ height: 44, padding: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ height: 9, width: '60%', background: '#8A0E4B', borderRadius: 2, marginBottom: 6 }} />
      <div style={{ height: 5, width: '40%', background: '#ddd', borderRadius: 2 }} />
    </div>
  ),
  section: (
    <div style={{ height: 44, background: '#FFF1F6', padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ height: 6, width: '55%', background: '#8A0E4B', borderRadius: 2, margin: '0 auto' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, flex: 1 }}>
        <div style={{ background: '#f0d7e3', borderRadius: 2 }} /><div style={{ background: '#f0d7e3', borderRadius: 2 }} /><div style={{ background: '#f0d7e3', borderRadius: 2 }} />
      </div>
    </div>
  ),
  text: <div style={{ height: 44, padding: 8 }}><div style={line('90%')} /><div style={line('75%')} /><div style={line('55%')} /></div>,
  image: <div style={{ ...box, background: 'linear-gradient(135deg,#c9d3de,#e6ebf1)', color: '#9aa7b4' }}>🖼</div>,
  imageText: (
    <div style={{ display: 'flex', height: 44 }}>
      <div style={{ width: '50%', background: 'linear-gradient(135deg,#e3c9d4,#f3e6ec)' }} />
      <div style={{ flex: 1, padding: 6 }}><div style={line('80%')} /><div style={line('95%')} /></div>
    </div>
  ),
  button: <div style={box}><span style={{ background: '#E60039', color: '#fff', fontSize: 10, padding: '4px 12px', borderRadius: 12 }}>按钮</span></div>,
  iconCard: (
    <div style={{ ...box, flexDirection: 'column', gap: 3 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #E60039' }} />
      <div style={{ height: 4, width: 26, background: '#8A0E4B', borderRadius: 2 }} />
    </div>
  ),
  richtext: <div style={{ height: 44, padding: 8 }}><div style={{ ...line('55%'), background: '#a44' }} /><div style={line('90%')} /><div style={line('70%')} /></div>,
  gallery: (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, padding: 6, height: 44 }}>
      <div style={{ background: '#cbd5e0', borderRadius: 2 }} /><div style={{ background: '#cbd5e0', borderRadius: 2 }} />
      <div style={{ background: '#cbd5e0', borderRadius: 2 }} /><div style={{ background: '#cbd5e0', borderRadius: 2 }} />
    </div>
  ),
  slider: (
    <div style={{ ...box, background: '#3A0A22', position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: '44%', height: 38, background: '#C2185B', borderRadius: 3, zIndex: 2 }} />
    </div>
  ),
  grid: (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, padding: 6, height: 44 }}>
      <div style={{ background: '#f0e3ea', borderRadius: 2 }} /><div style={{ background: '#f0e3ea', borderRadius: 2 }} /><div style={{ background: '#f0e3ea', borderRadius: 2 }} />
    </div>
  ),
}

export default function AddChildPicker({
  types, onAdd,
}: {
  types: Block['type'][]
  onAdd: (type: Block['type']) => void
}) {
  if (!types.length) return null
  return (
    <div className="ed-add-picker">
      <div className="ed-label">添加组件</div>
      <div className="ed-palette-grid">
        {types.filter((t) => BLOCKS[t]).map((t) => (
          <button
            key={t}
            type="button"
            className="ed-palette-item"
            onClick={() => onAdd(t)}
            title={`添加${BLOCKS[t].label}`}
          >
            <div className="ed-thumb">{THUMBS[t]}</div>
            <div className="ed-thumb-label">{BLOCKS[t].label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

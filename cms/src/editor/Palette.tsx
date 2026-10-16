'use client'
import React from 'react'
import { BLOCKS, PAGE_BLOCKS } from './blocks'
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
  text: <div style={{ height: 44, padding: 8 }}><div style={line('90%')} /><div style={line('75%')} /><div style={line('55%')} /></div>,
  image: <div style={{ ...box, background: 'linear-gradient(135deg,#c9d3de,#e6ebf1)', color: '#9aa7b4' }}>🖼</div>,
  imageText: (
    <div style={{ display: 'flex', height: 44 }}>
      <div style={{ width: '50%', background: 'linear-gradient(135deg,#e3c9d4,#f3e6ec)' }} />
      <div style={{ flex: 1, padding: 6 }}><div style={line('80%')} /><div style={line('95%')} /></div>
    </div>
  ),
  button: <div style={box}><span style={{ background: '#E60039', color: '#fff', fontSize: 10, padding: '4px 12px', borderRadius: 12 }}>按钮</span></div>,
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

export default function Palette({ onAdd }: { onAdd: (type: Block['type']) => void }) {
  return (
    <aside className="ed-palette">
      <div className="ed-label">组件（拖入画布）</div>
      <div className="ed-palette-grid">
        {PAGE_BLOCKS.filter((t) => BLOCKS[t]).map((t) => (
          <button
            key={t}
            className="ed-palette-item"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/x-block', t)}
            onClick={() => onAdd(t)}
            title={`添加${BLOCKS[t].label}`}
          >
            <div className="ed-thumb">{THUMBS[t]}</div>
            <div className="ed-thumb-label">{BLOCKS[t].label}</div>
          </button>
        ))}
      </div>
    </aside>
  )
}

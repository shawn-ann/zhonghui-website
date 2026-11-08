'use client'
import React from 'react'
import { BLOCKS } from './blocks'
import type { Block } from './types'

const DEEP = '#8A0E4B'
const ROSE = '#E60039'
const LINE = '#ddd'
const FILL = '#f0d7e3'
const PINK = '#FFF1F6'
const BORDER = '#eadfe5'

const bar = (width: string, color = LINE, height = 5): React.CSSProperties => ({
  height, width, background: color, borderRadius: 2,
})
const pic = (): React.CSSProperties => ({
  background: 'linear-gradient(160deg,#f1dfe7,#dfc3d2)',
  borderRadius: 3,
})

const THUMBS: Record<Block['type'], React.ReactNode> = {
  section: (
    <div style={{ height: 44, padding: 5, background: PINK }}>
      <div style={{ height: '100%', border: '1px solid #eccfdd', borderRadius: 5, background: PINK, padding: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ ...bar('34%', DEEP, 4), margin: '0 auto' }} />
        <div style={{ height: 9, background: '#fff', border: '1px solid #f0dbe5', borderRadius: 3 }} />
        <div style={{ display: 'flex', gap: 3, flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, background: '#fff', border: '1px solid #f0dbe5', borderRadius: 3 }} />
          <div style={{ flex: 1, background: '#fff', border: '1px solid #f0dbe5', borderRadius: 3 }} />
        </div>
      </div>
    </div>
  ),
  stack: (
    <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '1px solid #e7cbd8', borderRadius: 5, background: '#fff', padding: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ flex: 1, background: FILL, borderRadius: 2 }} />
        <div style={{ flex: 1, background: '#f7e6ee', borderRadius: 2 }} />
        <div style={{ flex: 1, background: '#fbeff4', borderRadius: 2 }} />
      </div>
    </div>
  ),
  steps: (
    <div style={{ height: 44, padding: '5px 6px 5px 7px', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 11, top: 9, bottom: 9, borderLeft: '1.5px dashed #e8c3d3' }} />
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {[1, 2, 3].map((n, i) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: ROSE, color: '#fff', fontSize: 5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', position: 'relative', zIndex: 1 }}>{n}</span>
            <span style={bar(i === 1 ? '52%' : i === 2 ? '62%' : '56%', LINE, 4)} />
          </div>
        ))}
      </div>
    </div>
  ),
  imageText: (
    <div style={{ height: 44, padding: 4 }}>
      <div style={{ height: '100%', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '54%', background: 'linear-gradient(160deg,#f1dfe7,#dfc3d2)' }} />
        <div style={{ padding: '3px 5px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={bar('55%', DEEP, 4)} />
          <span style={bar('92%', LINE, 4)} />
        </div>
      </div>
    </div>
  ),
  infoList: (
    <div style={{ height: 44, padding: 5 }}>
      <div style={{ height: '100%', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '3px 5px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: ROSE, flex: 'none' }} />
            <span style={bar(i === 1 ? '64%' : '72%', LINE, 4)} />
          </div>
        ))}
      </div>
    </div>
  ),
  gallery: (
    <div style={{ height: 44, padding: 5, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3 }}>
      <div style={pic()} /><div style={{ ...pic(), filter: 'brightness(.96)' }} /><div style={pic()} />
    </div>
  ),
  slider: (
    <div style={{ height: 44, background: 'linear-gradient(135deg,#8A0E4B,#C2185B)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px', position: 'relative' }}>
      <span style={{ color: '#fff', fontSize: 13, opacity: 0.9 }}>‹</span>
      <span style={{ color: '#fff', fontSize: 13, opacity: 0.9 }}>›</span>
      <span style={{ position: 'absolute', left: 0, right: 0, bottom: 4, display: 'flex', justifyContent: 'center', gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: i === 0 ? '#fff' : 'rgba(255,255,255,.5)' }} />
        ))}
      </span>
    </div>
  ),
  hscroll: (
    <div style={{ height: 44, padding: '5px 0 5px 5px', overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'flex', gap: 4, height: '100%' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 32, flex: 'none', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '56%', ...pic(), borderRadius: 0 }} />
            <span style={{ ...bar('70%', LINE, 3), margin: '3px 3px 0' }} />
          </div>
        ))}
      </div>
      <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 16, background: `linear-gradient(90deg,rgba(250,247,249,0),#faf7f9)` }} />
    </div>
  ),
  grid: (
    <div style={{ height: 44, padding: 5, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: '1fr 1fr', gap: 3 }}>
      <div style={{ background: FILL, borderRadius: 2 }} />
      <div style={{ background: '#f7e6ee', borderRadius: 2 }} />
      <div style={{ background: FILL, borderRadius: 2 }} />
      <div style={{ background: '#f7e6ee', borderRadius: 2 }} />
      <div style={{ background: FILL, borderRadius: 2 }} />
      <div style={{ background: '#f7e6ee', borderRadius: 2 }} />
    </div>
  ),
  gridRow: (
    <div style={{ height: 44, padding: 5 }}>
      <div style={{ height: '100%', border: '1px dashed #d8a9be', borderRadius: 3, padding: 3, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3 }}>
        <div style={{ background: FILL, borderRadius: 2 }} />
        <div style={{ background: '#f7e6ee', borderRadius: 2 }} />
        <div style={{ background: FILL, borderRadius: 2 }} />
      </div>
    </div>
  ),
  gridCell: (
    <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 26, height: 26, border: '1px dashed #d8a9be', borderRadius: 4, background: '#fff' }} />
    </div>
  ),
  iconCard: (
    <div style={{ height: 44, padding: 4 }}>
      <div style={{ height: '100%', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <div style={{ width: 13, height: 13, border: `2px solid ${ROSE}`, borderRadius: '50%' }} />
        <span style={bar('42%', DEEP, 4)} />
        <span style={bar('54%', LINE, 3)} />
      </div>
    </div>
  ),
  iconList: (
    <div style={{ height: 44, padding: '5px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, border: `1.5px solid ${ROSE}`, borderRadius: '50%', flex: 'none' }} />
          <span style={bar(i === 1 ? '54%' : '62%', LINE, 4)} />
        </div>
      ))}
    </div>
  ),
  entries: (
    <div style={{ height: 44, padding: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {[0, 1].map((i) => (
        <div key={i} style={{ flex: 1, background: '#FFF7FA', borderRadius: 3, padding: '3px 4px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={bar('58%', DEEP, 4)} />
          <span style={bar(i === 1 ? '78%' : '88%', LINE, 3)} />
        </div>
      ))}
    </div>
  ),
  zigzag: (
    <div style={{ height: 44, padding: 5, position: 'relative' }}>
      <div style={{ position: 'absolute', left: '50%', top: 7, bottom: 7, borderLeft: '1.5px dashed #f0bcd3' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={bar('46%', LINE, 5)} />
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: ROSE, zIndex: 1 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: ROSE, zIndex: 1 }} />
          <span style={bar('46%', LINE, 5)} />
        </div>
      </div>
    </div>
  ),
  banner: (
    <div style={{ height: 44, display: 'flex' }}>
      <div style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5 }}>
        <span style={bar('72%', DEEP, 5)} />
        <span style={bar('48%', LINE, 4)} />
      </div>
      <div style={{ width: '46%', ...pic(), borderRadius: 0 }} />
    </div>
  ),
  heading: (
    <div style={{ height: 44, padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
      <span style={bar('44%', DEEP, 7)} />
      <span style={bar('30%', LINE, 4)} />
    </div>
  ),
  image: (
    <div style={{ height: 44, padding: 5 }}>
      <div style={{ ...pic(), height: '100%', borderRadius: 4 }} />
    </div>
  ),
  richtext: (
    <div style={{ height: 44, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={bar('42%', DEEP, 5)} />
      <span style={bar('92%', LINE, 4)} />
      <span style={bar('74%', LINE, 4)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: ROSE }} />
        <span style={bar('58%', LINE, 4)} />
      </div>
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
        {types.filter((t) => BLOCKS[t] && THUMBS[t]).map((t) => (
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

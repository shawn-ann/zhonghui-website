'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { renderDocument } from '../render/document'
import type { EditorDoc, Block } from './types'

export const CANVAS_STYLE =
  '.ed-selected{outline:3px solid #1E6FFF;outline-offset:-3px;background:rgba(30,111,255,.08)}' +
  '.ed-hover{outline:2px dashed #1E6FFF;outline-offset:-2px}'

const WRAP_PAD = 12

export default function Canvas({
  doc, selectedId, selectedLabel, onSelect, onEditField, onReorder, onAddAt, onDelete, deviceWidth = 1280,
}: {
  doc: EditorDoc
  selectedId?: string
  selectedLabel?: string
  onSelect: (id: string) => void
  onEditField: (blockId: string, field: string, value: string) => void
  onReorder?: (from: number, to: number) => void
  onAddAt?: (type: Block['type'], index: number) => void
  onDelete?: (id: string) => void
  deviceWidth?: number
}) {
  const ref = useRef<HTMLIFrameElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [contentHeight, setContentHeight] = useState(0)
  const [toolbar, setToolbar] = useState<{ top: number; left: number } | null>(null)
  const html = renderDocument(doc, { mode: 'external' })

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const measure = () => {
      const avail = wrap.clientWidth - WRAP_PAD * 2
      setScale(Math.min(1, avail > 0 ? avail / deviceWidth : 1))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [deviceWidth])

  const applySelection = useCallback((id?: string) => {
    const d = ref.current?.contentDocument
    if (!d) return
    d.querySelectorAll('[data-bid]').forEach((el) => {
      const isSelected = el.getAttribute('data-bid') === id
      el.classList.toggle('ed-selected', isSelected)
      if (isSelected) el.classList.remove('ed-hover')
    })
  }, [])

  const updateToolbar = useCallback((id?: string) => {
    const frame = ref.current
    const d = frame?.contentDocument
    if (!frame || !d || !id) { setToolbar(null); return }
    const el = d.querySelector(`[data-bid="${id}"]`) as HTMLElement | null
    if (!el) { setToolbar(null); return }
    const rect = el.getBoundingClientRect()
    setToolbar({ top: rect.top * scale + WRAP_PAD, left: rect.left * scale + WRAP_PAD })
  }, [scale])

  useEffect(() => {
    applySelection(selectedId)
    updateToolbar(selectedId)
  }, [selectedId, applySelection, updateToolbar])

  const handleLoad = () => {
    const frame = ref.current
    const d = frame?.contentDocument
    if (!d) return
    if (!d.getElementById('ed-canvas-style')) {
      const s = d.createElement('style')
      s.id = 'ed-canvas-style'
      s.textContent = CANVAS_STYLE
      d.head.appendChild(s)
    }
    // Any block (including nested section/grid children) is selectable.
    d.querySelectorAll('[data-bid]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        onSelect(el.getAttribute('data-bid')!)
      })
      el.addEventListener('mouseenter', () => {
        if (el.getAttribute('data-bid') !== selectedId) el.classList.add('ed-hover')
      })
      el.addEventListener('mouseleave', () => el.classList.remove('ed-hover'))
    })
    // Reorder stays top-level only: map each top-level slot to its block root.
    const topLevel = (Array.from(d.querySelectorAll('main#page > *')) as HTMLElement[])
      .map((host) =>
        host.hasAttribute('data-bid') ? host : (host.querySelector('[data-bid]') as HTMLElement | null),
      )
      .filter((el): el is HTMLElement => !!el)
    topLevel.forEach((el, index) => {
      el.setAttribute('draggable', 'true')
      el.dataset.idx = String(index)
    })
    // Inline edit any data-field, nested included.
    d.querySelectorAll('[data-field]').forEach((el) => {
      const host = (el as HTMLElement).closest('[data-bid]')
      if (!host) return
      el.addEventListener('dblclick', () => {
        const id = host.getAttribute('data-bid') || ''
        const field = el.getAttribute('data-field') || ''
        ;(el as HTMLElement).setAttribute('contenteditable', 'true')
        ;(el as HTMLElement).focus()
        const done = () => {
          ;(el as HTMLElement).removeAttribute('contenteditable')
          onEditField(id, field, (el as HTMLElement).innerText)
          el.removeEventListener('blur', done)
        }
        el.addEventListener('blur', done)
      })
    })
    topLevel.forEach((el) => {
      el.addEventListener('dragstart', (e) => {
        ;(e as DragEvent).dataTransfer?.setData('text/x-reorder', el.dataset.idx!)
      })
      el.addEventListener('dragover', (e) => e.preventDefault())
      el.addEventListener('drop', (e) => {
        e.preventDefault()
        const dt = (e as DragEvent).dataTransfer
        const to = Number(el.dataset.idx)
        if (!Number.isFinite(to)) return
        if (dt?.types.includes('text/x-block')) {
          const type = dt.getData('text/x-block') as Block['type']
          if (type) onAddAt?.(type, to)
        } else if (dt?.types.includes('text/x-reorder')) {
          const from = Number(dt.getData('text/x-reorder'))
          if (Number.isFinite(from) && from !== to) onReorder?.(from, to)
        }
      })
    })
    applySelection(selectedId)
    updateToolbar(selectedId)
    const h = d.body?.scrollHeight || d.documentElement?.scrollHeight || 0
    if (h) setContentHeight(h)
  }

  const deleteSelected = () => {
    if (!selectedId) return
    onDelete?.(selectedId)
  }

  return (
    <div className="ed-canvas">
      <div
        className="ed-canvas-wrap"
        ref={wrapRef}
        style={contentHeight ? { minHeight: contentHeight * scale + WRAP_PAD * 2 } : undefined}
      >
        <iframe
          ref={ref}
          title="canvas"
          className="ed-canvas-frame"
          srcDoc={html}
          onLoad={handleLoad}
          style={{ width: deviceWidth, height: '900px', border: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        />
      </div>
      {toolbar ? (
        <div className="ed-block-overlay" style={{ top: toolbar.top, left: toolbar.left }}>
          <span className="ed-block-badge">{selectedLabel || '区块'}</span>
          <button type="button" className="ed-block-del" onClick={deleteSelected}>删除</button>
        </div>
      ) : null}
    </div>
  )
}

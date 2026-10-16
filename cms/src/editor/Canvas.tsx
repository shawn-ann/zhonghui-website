'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { renderDocument } from '../render/document'
import type { EditorDoc, Block } from './types'

const OUTLINE = 'outline:2px solid #E60039'

export default function Canvas({
  doc, selectedId, onSelect, onEditField, onReorder, onAddAt, onDelete,
}: {
  doc: EditorDoc
  selectedId?: string
  onSelect: (id: string) => void
  onEditField: (blockId: string, field: string, value: string) => void
  onReorder?: (from: number, to: number) => void
  onAddAt?: (type: Block['type'], index: number) => void
  onDelete?: (index: number) => void
}) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [toolbar, setToolbar] = useState<{ top: number; left: number } | null>(null)
  const html = renderDocument(doc, { mode: 'external' })

  const applySelection = useCallback((id?: string) => {
    const d = ref.current?.contentDocument
    if (!d) return
    d.querySelectorAll('[data-bid]').forEach((el) => {
      el.classList.toggle('ed-selected', el.getAttribute('data-bid') === id)
    })
  }, [])

  const updateToolbar = useCallback((id?: string) => {
    const frame = ref.current
    const d = frame?.contentDocument
    if (!frame || !d || !id) { setToolbar(null); return }
    const el = d.querySelector(`[data-bid="${id}"]`) as HTMLElement | null
    if (!el) { setToolbar(null); return }
    const rect = el.getBoundingClientRect()
    setToolbar({ top: rect.top + 6, left: rect.left + 6 })
  }, [])

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
      s.textContent = `.ed-selected{${OUTLINE};outline-offset:-2px}`
      d.head.appendChild(s)
    }
    const topLevel = Array.from(d.querySelectorAll('main#page > [data-bid]')) as HTMLElement[]
    const topIds = new Set(topLevel.map((el) => el.getAttribute('data-bid')))
    topLevel.forEach((el, index) => {
      el.setAttribute('draggable', 'true')
      el.dataset.idx = String(index)
      el.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        onSelect(el.getAttribute('data-bid')!)
      })
    })
    // Only top-level text fields are inline-editable (nested editing returns in phase 2).
    d.querySelectorAll('[data-field]').forEach((el) => {
      const host = (el as HTMLElement).closest('[data-bid]')
      if (!host || !topIds.has(host.getAttribute('data-bid'))) return
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
  }

  const deleteSelected = () => {
    const d = ref.current?.contentDocument
    if (!d || !selectedId) return
    const top = Array.from(d.querySelectorAll('main#page > [data-bid]'))
    const i = top.findIndex((el) => el.getAttribute('data-bid') === selectedId)
    if (i >= 0) onDelete?.(i)
  }

  return (
    <div className="ed-canvas">
      <iframe ref={ref} title="canvas" className="ed-canvas-frame" srcDoc={html} onLoad={handleLoad} />
      {toolbar ? (
        <div className="ed-block-toolbar" style={{ top: toolbar.top, left: toolbar.left }}>
          <button type="button" onClick={deleteSelected}>删除选中区块</button>
        </div>
      ) : null}
    </div>
  )
}

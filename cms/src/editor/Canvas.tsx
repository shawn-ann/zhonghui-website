'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { renderDocument } from '../render/document'
import type { EditorDoc } from './types'

const OUTLINE = 'outline:2px solid #E60039'

export function highlightSelection(html: string, id?: string): string {
  if (!id) return html
  const marker = `data-bid="${id}"`
  const idx = html.indexOf(marker)
  if (idx === -1) return html
  const tagStart = html.lastIndexOf('<section', idx)
  const tagEnd = html.indexOf('>', idx)
  if (tagStart === -1 || tagEnd === -1) return html
  const openTag = html.slice(tagStart, tagEnd)
  let newTag: string
  if (/style="/.test(openTag)) {
    newTag = openTag.replace(/style="([^"]*)"/, (_m, s: string) => {
      const sep = s && !s.trim().endsWith(';') ? ';' : ''
      return `style="${s}${sep}${OUTLINE};"`
    })
  } else {
    newTag = `${openTag} style="${OUTLINE};"`
  }
  return html.slice(0, tagStart) + newTag + html.slice(tagEnd)
}

export default function Canvas({
  doc, selectedId, onSelect, onEditField, onReorder, onDelete,
}: {
  doc: EditorDoc
  selectedId?: string
  onSelect: (id: string) => void
  onEditField: (blockId: string, field: string, value: string) => void
  onReorder?: (from: number, to: number) => void
  onDelete?: (index: number) => void
}) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [toolbar, setToolbar] = useState<{ top: number; left: number } | null>(null)
  const html = renderDocument(doc, { mode: 'external' })

  const applySelection = useCallback((id?: string) => {
    const d = ref.current?.contentDocument
    if (!d) return
    d.querySelectorAll('[data-bid]').forEach((el) => {
      const on = el.getAttribute('data-bid') === id
      el.setAttribute('style', on ? `${OUTLINE};outline-offset:-2px` : '')
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
    const topLevel = Array.from(d.querySelectorAll('main#page > [data-bid]')) as HTMLElement[]
    topLevel.forEach((el, index) => {
      el.setAttribute('draggable', 'true')
      el.dataset.idx = String(index)
    })
    d.querySelectorAll('[data-bid]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        onSelect(el.getAttribute('data-bid')!)
      })
    })
    d.querySelectorAll('[data-field]').forEach((el) => {
      el.addEventListener('dblclick', () => {
        const host = (el as HTMLElement).closest('[data-bid]')
        const id = host?.getAttribute('data-bid') || ''
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
        ;(e as DragEvent).dataTransfer?.setData('text/plain', el.dataset.idx!)
      })
      el.addEventListener('dragover', (e) => e.preventDefault())
      el.addEventListener('drop', (e) => {
        e.preventDefault()
        const from = Number((e as DragEvent).dataTransfer?.getData('text/plain'))
        const to = Number(el.dataset.idx)
        if (!Number.isNaN(from) && !Number.isNaN(to) && from !== to) onReorder?.(from, to)
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

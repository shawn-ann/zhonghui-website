'use client'
import React, { useEffect, useRef } from 'react'
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
  doc, selectedId, onSelect, onEditField,
}: {
  doc: EditorDoc
  selectedId?: string
  onSelect: (id: string) => void
  onEditField: (blockId: string, field: string, value: string) => void
}) {
  const ref = useRef<HTMLIFrameElement>(null)
  const html = highlightSelection(renderDocument(doc, { mode: 'external' }), selectedId)

  useEffect(() => {
    const frame = ref.current
    if (!frame) return
    const bind = () => {
      const d = frame.contentDocument
      if (!d) return
      d.querySelectorAll('[data-bid]').forEach((el) => {
        el.addEventListener('click', (e) => { e.preventDefault(); onSelect(el.getAttribute('data-bid')!) })
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
    }
    frame.addEventListener('load', bind)
    return () => frame.removeEventListener('load', bind)
  }, [html, onSelect, onEditField])

  return (
    <div className="ed-canvas">
      <iframe ref={ref} title="canvas" className="ed-canvas-frame" srcDoc={html} />
    </div>
  )
}

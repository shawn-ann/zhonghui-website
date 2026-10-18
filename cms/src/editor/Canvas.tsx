'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SiteBody } from '../site/SiteDocument'
import { resolveDropContainer, resolveDropTarget } from './dropTarget'
import type { EditorDoc, Block } from './types'

export const CANVAS_STYLE =
  '.ed-selected{position:relative}' +
  '.ed-selected::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:9999;outline:3px solid #1E6FFF;outline-offset:-3px;background:rgba(30,111,255,.06)}' +
  '.ed-hover{outline:2px dashed #1E6FFF;outline-offset:-2px}' +
  '.ed-drop-zone{outline:3px dashed #1E6FFF !important;outline-offset:-3px}'

const WRAP_PAD = 12

// 画布文档只创建一次；内容由 React portal 渲染，更新不再触发 iframe 重载。
const FRAME_SRC = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">` +
  `<meta name="viewport" content="width=device-width, initial-scale=1.0">` +
  `<link rel="stylesheet" href="/assets/swiper-bundle.min.css">` +
  `<link rel="stylesheet" href="/assets/style.css">` +
  `<style>${CANVAS_STYLE}</style></head><body><div id="site-root"></div>` +
  `<script src="/assets/swiper-bundle.min.js"></script>` +
  `<script src="/assets/main.js"></script></body></html>`

export default function Canvas({
  doc, selectedId, selectedLabel, onSelect, onEditField, onReorder, onAddInto, onDelete, deviceWidth = 1280,
}: {
  doc: EditorDoc
  selectedId?: string
  selectedLabel?: string
  onSelect: (id: string) => void
  onEditField: (blockId: string, field: string, value: string) => void
  onReorder?: (from: number, to: number) => void
  onAddInto?: (parentId: string, type: Block['type'], index: number) => void
  onDelete?: (id: string) => void
  deviceWidth?: number
}) {
  const ref = useRef<HTMLIFrameElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [contentHeight, setContentHeight] = useState(0)
  const [toolbar, setToolbar] = useState<{ top: number; left: number } | null>(null)
  const [root, setRoot] = useState<HTMLElement | null>(null)

  // 事件只绑定一次，通过 ref 读取最新数据与回调。
  const latest = useRef({ doc, selectedId, onSelect, onEditField, onReorder, onAddInto })
  latest.current = { doc, selectedId, onSelect, onEditField, onReorder, onAddInto }

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
    const d = ref.current?.contentDocument
    if (!d || !id) { setToolbar(null); return }
    const el = d.querySelector(`[data-bid="${id}"]`) as HTMLElement | null
    if (!el) { setToolbar(null); return }
    const rect = el.getBoundingClientRect()
    setToolbar({ top: rect.top * scale + WRAP_PAD, left: rect.left * scale + WRAP_PAD })
  }, [scale])

  // 选中区块时，将 iframe 内部滚动到该区块（并把外层容器回到顶部，保证 iframe 可见）。
  const scrollToSelected = useCallback((id?: string) => {
    const frame = ref.current
    const win = frame?.contentWindow
    const d = frame?.contentDocument
    if (!frame || !win || !d || !id) return
    const el = d.querySelector(`[data-bid="${id}"]`) as HTMLElement | null
    if (!el) return
    const top = el.getBoundingClientRect().top + win.scrollY
    win.scrollTo({ top: Math.max(0, top - 80), behavior: 'auto' })
    wrapRef.current?.scrollTo({ top: 0 })
  }, [])

  const handleLoad = () => {
    const d = ref.current?.contentDocument
    if (!d) return
    const clearDropZones = () => d.querySelectorAll('.ed-drop-zone').forEach((n) => n.classList.remove('ed-drop-zone'))
    const highlight = (zoneId: string | null) => {
      clearDropZones()
      if (zoneId) d.querySelector(`[data-bid="${zoneId}"]`)?.classList.add('ed-drop-zone')
    }
    const topIndex = (el: Element): number => {
      const main = d.querySelector('main#page')
      if (!main) return -1
      return Array.from(main.children).findIndex((h) => h === el || h.contains(el))
    }

    d.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null
      if (target?.closest?.('a')) e.preventDefault()
      const bid = target?.closest?.('[data-bid]')?.getAttribute('data-bid')
      if (bid) latest.current.onSelect(bid)
    }, true)

    d.addEventListener('dblclick', (e) => {
      const target = e.target as HTMLElement | null
      const fieldEl = target?.closest?.('[data-field]') as HTMLElement | null
      const host = fieldEl?.closest?.('[data-bid]') as HTMLElement | null
      if (!fieldEl || !host) return
      e.preventDefault()
      const id = host.getAttribute('data-bid') || ''
      const field = fieldEl.getAttribute('data-field') || ''
      fieldEl.setAttribute('contenteditable', 'true')
      fieldEl.focus()
      const done = () => {
        fieldEl.removeAttribute('contenteditable')
        fieldEl.removeEventListener('blur', done)
        latest.current.onEditField(id, field, fieldEl.innerText)
      }
      fieldEl.addEventListener('blur', done)
    }, true)

    d.addEventListener('dragstart', (e) => {
      const target = (e.target as HTMLElement | null)?.closest?.('[data-bid]') as HTMLElement | null
      if (!target) return
      const idx = topIndex(target)
      if (idx < 0) return
      ;(e as DragEvent).dataTransfer?.setData('text/x-reorder', String(idx))
    })

    d.addEventListener('dragover', (e) => {
      const dt = (e as DragEvent).dataTransfer
      if (!dt) return
      if (dt.types.includes('text/x-block')) {
        const bid = (e.target as HTMLElement | null)?.closest?.('[data-bid]')?.getAttribute('data-bid')
        const zoneId = bid ? resolveDropContainer(latest.current.doc.blocks, bid) : null
        highlight(zoneId)
        if (zoneId) e.preventDefault()
      } else if (dt.types.includes('text/x-reorder')) {
        if ((e.target as HTMLElement | null)?.closest?.('main#page')) e.preventDefault()
      }
    })

    d.addEventListener('drop', (e) => {
      const dt = (e as DragEvent).dataTransfer
      if (!dt) return
      const target = (e.target as HTMLElement | null)?.closest?.('[data-bid]') as HTMLElement | null
      if (dt.types.includes('text/x-block')) {
        e.preventDefault()
        clearDropZones()
        const bid = target?.getAttribute('data-bid')
        const type = dt.getData('text/x-block') as Block['type']
        if (!bid || !type) return
        const hit = resolveDropTarget(latest.current.doc.blocks, bid, type)
        if (hit) latest.current.onAddInto?.(hit.parentId, type, hit.index)
      } else if (dt.types.includes('text/x-reorder')) {
        if (!target) return
        e.preventDefault()
        const to = topIndex(target)
        const from = Number(dt.getData('text/x-reorder'))
        if (Number.isFinite(from) && Number.isFinite(to) && from !== to) latest.current.onReorder?.(from, to)
      }
    })

    d.addEventListener('dragend', clearDropZones)
    setRoot(d.getElementById('site-root'))
  }

  // 每次 doc 更新后：维护顶层拖拽属性、初始化 Swiper/导航、测量高度。
  useEffect(() => {
    if (!root) return
    const d = root.ownerDocument
    d.querySelectorAll('main#page > *').forEach((el, i) => {
      el.setAttribute('draggable', 'true')
      el.setAttribute('data-idx', String(i))
    })
    ;(d.defaultView as unknown as { __zhSiteInit?: () => void } | null)?.__zhSiteInit?.()
    const measure = () => setContentHeight(d.body.scrollHeight)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(d.body)
    return () => ro.disconnect()
  }, [root, doc])

  // 选中态与滚动：仅在选中项变化时滚动。
  const prevSelected = useRef<string | undefined>(undefined)
  useEffect(() => {
    applySelection(selectedId)
    if (prevSelected.current !== selectedId) scrollToSelected(selectedId)
    prevSelected.current = selectedId
    updateToolbar(selectedId)
  }, [selectedId, doc, applySelection, scrollToSelected, updateToolbar])

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
          srcDoc={FRAME_SRC}
          onLoad={handleLoad}
          style={{ width: deviceWidth, height: '900px', border: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        />
        {root ? createPortal(<SiteBody page={doc} />, root) : null}
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

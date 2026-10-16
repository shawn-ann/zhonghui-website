'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import './editor.css'
import Palette from './Palette'
import Canvas from './Canvas'
import PropertyPanel from './PropertyPanel'
import TopBar from './TopBar'
import { BLOCKS } from './blocks'
import { getPage, savePage, publishPage, listMedia, type MediaItem } from './api'
import { addBlock, ensureIds, moveBlock, removeBlock, updateBlockField } from './state'
import { editorToPayloadBlocks } from './map'
import type { EditorDoc, Block } from './types'

export default function PageEditor({ id }: { id: number | string }) {
  const [doc, setDoc] = useState<EditorDoc | null>(null)
  const [selectedId, setSelectedId] = useState<string>()
  const [dirty, setDirty] = useState(false)
  const urlToId = useRef<Map<string, number | string>>(new Map())
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const editVersion = useRef(0)

  useEffect(() => {
    getPage(id).then((d) => setDoc({ ...d, blocks: ensureIds(d.blocks) }))
    listMedia()
      .then((items) => {
        for (const m of items) if (m.url) urlToId.current.set(m.url, m.id)
      })
      .catch(() => {})
  }, [id])

  useEffect(() => () => clearTimeout(timer.current), [])

  const persist = useCallback(
    (d: EditorDoc, version?: number) =>
      savePage(id, {
        title: d.title,
        route: d.route,
        seo: d.seo,
        blocks: editorToPayloadBlocks(d.blocks, urlToId.current),
      }).then(() => {
        if (version === undefined || version === editVersion.current) setDirty(false)
      }),
    [id],
  )

  const update = useCallback(
    (blocks: Block[]) => {
      setDoc((d) => {
        if (!d) return d
        const next = { ...d, blocks }
        const version = ++editVersion.current
        setDirty(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => persist(next, version), 800)
        return next
      })
    },
    [persist],
  )

  const onPickMedia = useCallback((item: MediaItem) => {
    if (item.url) urlToId.current.set(item.url, item.id)
  }, [])

  if (!doc) return <div className="ed-loading">加载中…</div>
  const idx = doc.blocks.findIndex((b) => b._id === selectedId)
  const selected = idx >= 0 ? doc.blocks[idx] : undefined

  const saveNow = () => {
    clearTimeout(timer.current)
    persist(doc, editVersion.current)
  }

  const publishNow = () => {
    clearTimeout(timer.current)
    publishPage(id, {
      title: doc.title,
      route: doc.route,
      seo: doc.seo,
      blocks: editorToPayloadBlocks(doc.blocks, urlToId.current),
    }).then(() => setDoc((d) => (d ? { ...d, _status: 'published' } : d)))
  }

  return (
    <div className="ed-root">
      <TopBar
        title={doc.title}
        status={doc._status}
        dirty={dirty}
        onPreview={() => window.open(`/preview/pages/${id}`, '_blank')}
        onSave={saveNow}
        onPublish={publishNow}
      />
      <div className="ed-body">
        <Palette onAdd={(type) => update(addBlock(doc.blocks, BLOCKS[type].defaults()))} />
        <Canvas
          doc={doc}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onEditField={(bid, field, value) => {
            const i = doc.blocks.findIndex((b) => b._id === bid)
            if (i >= 0) update(updateBlockField(doc.blocks, i, field, value))
          }}
          onReorder={(from, to) => update(moveBlock(doc.blocks, from, to))}
          onAddAt={(type, index) => update(addBlock(doc.blocks, BLOCKS[type].defaults(), index))}
          onDelete={(i) => update(removeBlock(doc.blocks, i))}
        />
        <PropertyPanel
          block={selected}
          onPickMedia={onPickMedia}
          onChange={(key, value) => {
            if (idx >= 0) update(updateBlockField(doc.blocks, idx, key, value))
          }}
        />
      </div>
    </div>
  )
}

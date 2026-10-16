'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import './editor.css'
import Palette from './Palette'
import Canvas from './Canvas'
import PropertyPanel from './PropertyPanel'
import TopBar from './TopBar'
import { BLOCKS } from './blocks'
import { getPage, savePage, publishPage } from './api'
import { addBlock, ensureIds, moveBlock, removeBlock, updateBlockField } from './state'
import type { EditorDoc, Block } from './types'

export default function PageEditor({ id }: { id: number | string }) {
  const [doc, setDoc] = useState<EditorDoc | null>(null)
  const [selectedId, setSelectedId] = useState<string>()
  const [dirty, setDirty] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    getPage(id).then((d) => setDoc({ ...d, blocks: ensureIds(d.blocks) }))
  }, [id])

  const persist = useCallback(
    (d: EditorDoc) =>
      savePage(id, { title: d.title, route: d.route, seo: d.seo, blocks: d.blocks }).then(() => setDirty(false)),
    [id],
  )

  const update = useCallback(
    (blocks: Block[]) => {
      setDoc((d) => {
        if (!d) return d
        const next = { ...d, blocks }
        setDirty(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => persist(next), 800)
        return next
      })
    },
    [persist],
  )

  if (!doc) return <div className="ed-loading">加载中…</div>
  const idx = doc.blocks.findIndex((b) => b._id === selectedId)
  const selected = idx >= 0 ? doc.blocks[idx] : undefined

  return (
    <div className="ed-root">
      <TopBar
        title={doc.title}
        status={doc._status}
        dirty={dirty}
        onPreview={() => window.open(`/preview/pages/${id}`, '_blank')}
        onSave={() => persist(doc)}
        onPublish={() =>
          publishPage(id, { title: doc.title, route: doc.route, seo: doc.seo, blocks: doc.blocks }).then(() =>
            setDoc((d) => (d ? { ...d, _status: 'published' } : d)),
          )
        }
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
          onDelete={(i) => update(removeBlock(doc.blocks, i))}
        />
        <PropertyPanel
          block={selected}
          onChange={(key, value) => {
            if (idx >= 0) update(updateBlockField(doc.blocks, idx, key, value))
          }}
        />
      </div>
    </div>
  )
}

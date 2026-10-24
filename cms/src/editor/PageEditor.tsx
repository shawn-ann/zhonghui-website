'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import './editor.css'
import StructureTree from './StructureTree'
import Canvas from './Canvas'
import PropertyPanel from './PropertyPanel'
import TopBar from './TopBar'
import { BLOCKS, makeDefaultBlock, type DefaultMedia } from './blocks'
import { getPage, savePage, publishPage, listMedia, listPages, type MediaItem, type PageSummary } from './api'
import {
  addBlock, ensureIds, moveBlock, newId,
  findPath, getAtPath, updateAtPath, removeAtPath, insertInto,
  blockChildren, withChildren, childPath, moveChild,
} from './state'
import { editorToPayloadBlocks } from './map'
import type { EditorDoc, Block } from './types'

export default function PageEditor({ id }: { id: number | string }) {
  const [doc, setDoc] = useState<EditorDoc | null>(null)
  const [selectedId, setSelectedId] = useState<string>()
  const [dirty, setDirty] = useState(false)
  const [pages, setPages] = useState<PageSummary[]>([])
  const urlToId = useRef<Map<string, number | string>>(new Map())
  const defaults = useRef<DefaultMedia>({})
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const editVersion = useRef(0)

  useEffect(() => {
    getPage(id).then((d) => setDoc({ ...d, blocks: ensureIds(d.blocks) }))
    listPages().then(setPages).catch(() => {})
    listMedia()
      .then((items) => {
        for (const m of items) if (m.url) urlToId.current.set(m.url, m.id)
        const sys = items.filter((m) => m.url && m.alt?.startsWith('sys-default-'))
        const images = sys
          .filter((m) => m.alt?.startsWith('sys-default-image'))
          .map((m) => m.url as string)
        const icon = sys.find((m) => m.alt === 'sys-default-icon')?.url
        const fallbackImage = items.find((m) => m.url && !/\.svg(\?|$)/i.test(m.url))?.url
        const fallbackIcon = items.find((m) => m.url && /\.svg(\?|$)/i.test(m.url))?.url
        defaults.current = {
          image: images[0] ?? fallbackImage,
          images,
          icon: icon ?? fallbackIcon,
        }
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
  const selectedPath = selectedId ? findPath(doc.blocks, selectedId) : null
  const selected = selectedPath ? getAtPath(doc.blocks, selectedPath) : undefined
  const selectedLabel = selected ? BLOCKS[selected.type]?.label : undefined

  const deleteBlock = (bid: string) => {
    const p = findPath(doc.blocks, bid)
    if (p) update(removeAtPath(doc.blocks, p))
  }

  const addSection = () => {
    const block = { ...BLOCKS.section.defaults(), _id: newId() } as Block
    const index = selectedPath ? selectedPath[0] + 1 : doc.blocks.length
    update(addBlock(doc.blocks, block, index))
    setSelectedId(block._id)
  }

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
        id={id}
        title={doc.title}
        status={doc._status}
        dirty={dirty}
        onPreview={() => window.open(`/preview/pages/${id}`, '_blank')}
        onSave={saveNow}
        onPublish={publishNow}
      />
      <div className="ed-body">
        <div className="ed-left">
          <StructureTree
            blocks={doc.blocks}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onSelectRoot={() => setSelectedId(undefined)}
            onDelete={deleteBlock}
            onMove={(parentId, index, dir) => {
              if (!parentId) { update(moveChild(doc.blocks, index, dir)); return }
              const p = findPath(doc.blocks, parentId)
              const parent = p ? getAtPath(doc.blocks, p) : undefined
              if (!p || !parent) return
              update(updateAtPath(doc.blocks, p, withChildren(parent, moveChild(blockChildren(parent), index, dir))))
            }}
            onAddSection={addSection}
          />
        </div>
        <Canvas
          doc={doc}
          selectedId={selectedId}
          selectedLabel={selectedLabel}
          onSelect={setSelectedId}
          onEditField={(bid, field, value) => {
            const p = findPath(doc.blocks, bid)
            const block = p ? getAtPath(doc.blocks, p) : undefined
            if (p && block) update(updateAtPath(doc.blocks, p, { ...block, [field]: value } as Block))
          }}
          onReorder={(from, to) => update(moveBlock(doc.blocks, from, to))}
          onDelete={deleteBlock}
        />
        <PropertyPanel
          block={selected}
          pages={pages}
          onPatch={(values) => {
            if (selectedPath && selected) {
              update(updateAtPath(doc.blocks, selectedPath, { ...selected, ...values } as Block))
            }
          }}
          onPickMedia={onPickMedia}
          onSelectChild={setSelectedId}
          onChange={(key, value) => {
            if (selectedPath && selected) {
              update(updateAtPath(doc.blocks, selectedPath, { ...selected, [key]: value } as Block))
            }
          }}
          onAddChild={(type) => {
            if (!selectedPath) return
            const block = { ...makeDefaultBlock(type, defaults.current), _id: newId() } as Block
            update(insertInto(doc.blocks, selectedPath, block))
            setSelectedId(block._id)
          }}
          onRemoveChild={(index) => {
            if (selectedPath && selected) update(removeAtPath(doc.blocks, childPath(selectedPath, selected, index)))
          }}
          onMoveChild={(index, dir) => {
            if (selectedPath && selected) {
              const next = moveChild(blockChildren(selected), index, dir)
              update(updateAtPath(doc.blocks, selectedPath, withChildren(selected, next)))
            }
          }}
        />
      </div>
    </div>
  )
}

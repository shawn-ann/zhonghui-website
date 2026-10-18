'use client'
import React, { useEffect, useRef, useState } from 'react'
import { BLOCKS, blockSummary, isLayout } from './blocks'
import { blockChildren } from './state'
import type { Block } from './types'

function Node({
  block, depth, selectedId, onSelect, onDelete, expanded, toggle,
  parentId, index, count, onMove,
}: {
  block: Block
  depth: number
  selectedId?: string
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  expanded: Set<string>
  toggle: (id: string) => void
  parentId?: string
  index: number
  count: number
  onMove?: (parentId: string | undefined, index: number, dir: -1 | 1) => void
}) {
  const id = block._id || ''
  const layout = isLayout(block.type)
  const children = layout ? blockChildren(block) : []
  const open = expanded.has(id)
  const label = BLOCKS[block.type]?.label ?? block.type
  const summary = (blockSummary(block) || '').slice(0, 12)
  return (
    <div>
      <div
        className={`ed-tree-row${selectedId === id ? ' is-selected' : ''}`}
        style={{ paddingLeft: 6 + depth * 14 }}
        onClick={() => id && onSelect(id)}
      >
        {layout && children.length > 0 ? (
          <button className="ed-tree-caret" onClick={(e) => { e.stopPropagation(); id && toggle(id) }}>{open ? '▾' : '▸'}</button>
        ) : <span className="ed-tree-caret" />}
        <span className="ed-tree-label">{label}</span>
        {summary ? <span className="ed-tree-summary">{summary}</span> : null}
        <span className="ed-tree-actions">
          {onMove ? (
            <>
              <button
                className="ed-tree-move" title="上移" disabled={index === 0}
                onClick={(e) => { e.stopPropagation(); onMove(parentId, index, -1) }}
              >↑</button>
              <button
                className="ed-tree-move" title="下移" disabled={index === count - 1}
                onClick={(e) => { e.stopPropagation(); onMove(parentId, index, 1) }}
              >↓</button>
            </>
          ) : null}
          <button className="ed-tree-del" title="删除" onClick={(e) => { e.stopPropagation(); id && onDelete(id) }}>✕</button>
        </span>
      </div>
      {layout && open ? children.map((c, i) => (
        <Node
          key={c._id} block={c} depth={depth + 1} selectedId={selectedId}
          onSelect={onSelect} onDelete={onDelete} expanded={expanded} toggle={toggle}
          parentId={id} index={i} count={children.length} onMove={onMove}
        />
      )) : null}
    </div>
  )
}

function collectIds(blocks: Block[], out: Set<string> = new Set()): Set<string> {
  for (const b of blocks) {
    if (b._id) out.add(b._id)
    if (isLayout(b.type)) collectIds(blockChildren(b), out)
  }
  return out
}

export default function StructureTree({
  blocks, selectedId, onSelect, onSelectRoot, onDelete, onMove, onAddSection,
}: {
  blocks: Block[]
  selectedId?: string
  onSelect: (id: string) => void
  onSelectRoot?: () => void
  onDelete: (id: string) => void
  onMove?: (parentId: string | undefined, index: number, dir: -1 | 1) => void
  onAddSection?: () => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => collectIds(blocks))
  const known = useRef<Set<string>>(new Set(collectIds(blocks)))
  // 仅自动展开"新出现"的节点（不影响用户手动折叠的节点）
  useEffect(() => {
    const all = collectIds(blocks)
    const added = [...all].filter((id) => !known.current.has(id))
    if (!added.length) return
    known.current = all
    setExpanded((s) => { const n = new Set(s); added.forEach((id) => n.add(id)); return n })
  }, [blocks])
  const toggle = (id: string) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  return (
    <div className="ed-tree">
      <div className="ed-tree-head">
        <span className="ed-label">结构</span>
        {onAddSection ? <button className="ed-tree-add" type="button" onClick={onAddSection}>＋ 分栏</button> : null}
      </div>
      <div
        className={`ed-tree-row ed-tree-root${selectedId ? '' : ' is-selected'}`}
        onClick={onSelectRoot}
      >
        <span className="ed-tree-caret">▾</span>
        <span className="ed-tree-label">页面根目录</span>
        <span className="ed-tree-summary">{blocks.length} 个分栏</span>
      </div>
      {blocks.length === 0 ? <p className="ed-muted">暂无分栏</p> : null}
      {blocks.map((b, i) => (
        <Node
          key={b._id} block={b} depth={1} selectedId={selectedId}
          onSelect={onSelect} onDelete={onDelete}
          expanded={expanded} toggle={toggle}
          parentId={undefined} index={i} count={blocks.length} onMove={onMove}
        />
      ))}
    </div>
  )
}

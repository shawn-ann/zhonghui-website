'use client'
import React, { useEffect } from 'react'
import { useListRelationships } from '@payloadcms/ui'

type RelationValue = { id?: number | string; title?: string } | number | string | null | undefined

/**
 * 文章分类列：列表单元格拿到的是分类 ID，默认关系单元格在本列表里没有触发解析，
 * 这里直接通过列表的关系缓存取标题。
 */
export default function CategoryCell({ cellData }: { cellData?: RelationValue }) {
  const id = cellData && typeof cellData === 'object' ? cellData.id : cellData
  const { documents, getRelationships } = useListRelationships()

  useEffect(() => {
    if (id != null) getRelationships([{ relationTo: 'case-categories', value: id }])
  }, [id, getRelationships])

  if (cellData == null) return <span>—</span>
  if (typeof cellData === 'object') return <span>{cellData.title || String(id ?? '')}</span>

  const doc = id != null ? documents?.['case-categories']?.[id] : undefined
  if (doc === false) return <span>—</span>
  if (doc && typeof doc === 'object' && 'title' in doc && doc.title) return <span>{String(doc.title)}</span>
  return <span>…</span>
}

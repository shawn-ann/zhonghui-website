'use client'
import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

/** 文章/分类编辑页的预览按钮：直接打开前台预览路由，不依赖静态重建。 */
export default function CollectionPreviewLink() {
  const { id, collectionSlug } = useDocumentInfo()
  if (!id) return null
  const base = collectionSlug === 'cases'
    ? `/preview/cases/${id}`
    : collectionSlug === 'case-categories'
      ? `/preview/case-categories/${id}`
      : ''
  if (!base) return null
  return (
    <a
      className="btn btn--style-secondary btn--size-medium"
      href={base}
      target="_blank"
      rel="noreferrer"
      style={{ marginRight: 8, textDecoration: 'none' }}
    >
      预览
    </a>
  )
}

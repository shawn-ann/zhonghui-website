'use client'
import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { formatBeijingTime } from '../../lib/datetime'

/**
 * Payload 的文档信息区用浏览器本地时区格式化时间，这里统一成北京时间，
 * 并替换掉默认的 `.doc-controls__meta`（见 admin-theme.css）。
 */
export default function ArticleDocumentMeta() {
  const { data } = useDocumentInfo()
  if (!data) return null
  const status = data._status === 'published' ? '已发布' : '草稿'
  return (
    <div className="zc-doc-meta">
      <span className={`zc-doc-status is-${data._status === 'published' ? 'published' : 'draft'}`}>{status}</span>
      <span>最后修改时间：{formatBeijingTime(data.updatedAt) || '—'}</span>
      <span>已创建：{formatBeijingTime(data.createdAt) || '—'}</span>
    </div>
  )
}

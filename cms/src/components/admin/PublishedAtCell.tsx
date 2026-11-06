import React from 'react'

/**
 * 发布日期是“日历日”，库里存成 UTC 零点；按北京时区显示会变成 08:00。
 * 列表里直接展示这一天，时间固定为 00:00:00。
 */
export function formatPublishedDate(value?: string | null): string {
  if (!value) return '—'
  const key = String(value).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return '—'
  return `${key.replace(/-/g, '/')} 00:00:00`
}

export default function PublishedAtCell({ cellData }: { cellData?: string | null }) {
  return <span>{formatPublishedDate(cellData)}</span>
}

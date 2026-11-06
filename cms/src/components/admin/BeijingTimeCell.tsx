'use client'
import React from 'react'
import { formatBeijingTime } from '../../lib/datetime'

/** 列表里的时间列统一显示北京时间。 */
export default function BeijingTimeCell({ cellData }: { cellData?: string | null }) {
  return <span>{formatBeijingTime(cellData) || '—'}</span>
}

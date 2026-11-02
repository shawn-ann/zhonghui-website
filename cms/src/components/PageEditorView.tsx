'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import PageEditor from '../editor/PageEditor'

export default function PageEditorView({ id: idProp }: { id?: number | string }) {
  const params = useParams() as { id?: string; segments?: string[] }
  const fallback = Array.isArray(params?.segments) ? params.segments[params.segments.length - 1] : undefined
  const id = idProp ?? params?.id ?? fallback
  if (!id || id === 'create') return <div style={{ padding: 24 }}>缺少页面 id</div>
  return <PageEditor id={id} />
}

'use client'
import React from 'react'
import { useField } from '@payloadcms/ui'
import RichTextControl from '../../editor/RichTextControl'
import '../../editor/editor.css'

/**
 * 文章正文复用页面编辑器的富文本控件，保证工具栏、图片和图集节点一致。
 */
export default function ArticleBodyField({ path, field }: { path: string; field: any }) {
  const { value, setValue } = useField<unknown>({ path })
  const label = typeof field?.label === 'string' ? field.label : '正文'
  return (
    <div className="field-type article-body-field">
      <RichTextControl
        inline
        label={field?.required ? `${label} *` : label}
        value={value}
        onChange={(next) => setValue(next)}
      />
    </div>
  )
}

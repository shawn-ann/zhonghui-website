'use client'
import React, { useEffect, useState } from 'react'
import { FieldLabel, useField, useFormFields } from '@payloadcms/ui'

export function slugPrefix(categorySlug?: string | null): string {
  return categorySlug ? `/blog/${categorySlug}/` : '/blog/'
}

export default function SlugField({ path, field }: { path: string; field: any }) {
  const { value, setValue } = useField<string | null>({ path })
  const category = useFormFields(([fields]) => (fields?.category?.value ?? null) as any)
  const [categorySlug, setCategorySlug] = useState('')

  useEffect(() => {
    const id = category && typeof category === 'object' ? category.id : category
    if (!id) {
      setCategorySlug('')
      return
    }
    if (category && typeof category === 'object' && category.slug) {
      setCategorySlug(String(category.slug))
      return
    }
    let cancelled = false
    fetch(`/api/case-categories/${encodeURIComponent(String(id))}?depth=0`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc) => { if (!cancelled) setCategorySlug(doc?.slug || '') })
      .catch(() => { if (!cancelled) setCategorySlug('') })
    return () => { cancelled = true }
  }, [category])

  const label = typeof field?.label === 'string' ? field.label : 'URL 别名'

  return (
    <div className="field-type slug-field">
      <FieldLabel label={label} path={path} required={Boolean(field?.required)} />
      <div className="slug-field__row">
        <span className="slug-field__prefix">{slugPrefix(categorySlug)}</span>
        <input
          className="slug-field__input"
          value={value ?? ''}
          onChange={(event) => setValue(event.target.value)}
          placeholder="xiaocao"
        />
      </div>
      <div className="field-description">只能使用小写字母、数字和连字符；发布后修改会自动生成旧链接跳转。</div>
    </div>
  )
}

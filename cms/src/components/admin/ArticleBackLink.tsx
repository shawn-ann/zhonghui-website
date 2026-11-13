'use client'
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * 文章编辑页左上角的返回入口。
 * 通过 portal 挂到文档页头，避免依赖 Payload 修改编辑视图结构。
 */
export default function ArticleBackLink() {
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setTarget(document.querySelector('.doc-header') as HTMLElement | null)
  }, [])

  if (!target) return null

  return createPortal(
    <a className="zc-back-link" href="/admin/collections/cases">
      <span aria-hidden="true">←</span>
      返回文章列表
    </a>,
    target,
  )
}

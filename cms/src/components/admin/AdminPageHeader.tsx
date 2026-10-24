import React from 'react'
import Link from 'next/link'

export type AdminBreadcrumb = {
  label: string
  href?: string
}

export function AdminPageHeader({
  breadcrumbs,
  title,
  description,
  actions,
}: {
  breadcrumbs: AdminBreadcrumb[]
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <>
      <nav aria-label="面包屑" className="zc-crumb">
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <span className="sep">/</span> : null}
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span className="current">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
      <div className="zc-page-head">
        <div>
          <h1 className="zc-page-title">{title}</h1>
          {description ? <p className="zc-page-desc">{description}</p> : null}
        </div>
        {actions ? <div className="zc-page-actions">{actions}</div> : null}
      </div>
    </>
  )
}

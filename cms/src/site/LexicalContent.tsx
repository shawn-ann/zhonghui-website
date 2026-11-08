import React, { Fragment, type ReactNode } from 'react'

type LexicalNode = {
  type?: string
  version?: number
  text?: string
  format?: number | string
  tag?: string
  listType?: string
  url?: string
  children?: LexicalNode[]
  src?: string
  alt?: string
  style?: string
  images?: Array<{ src?: string; alt?: string }>
  columns?: number
}

function styleFromCss(style?: string): React.CSSProperties | undefined {
  if (!style) return undefined
  const out: Record<string, string> = {}
  for (const part of style.split(';')) {
    const index = part.indexOf(':')
    if (index <= 0) continue
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (!key || !value) continue
    out[key.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())] = value
  }
  return Object.keys(out).length ? (out as React.CSSProperties) : undefined
}

function elementStyle(node: LexicalNode): React.CSSProperties | undefined {
  const align = typeof node.format === 'string' ? node.format : ''
  if (!align || align === 'left') return undefined
  return { textAlign: align as React.CSSProperties['textAlign'] }
}

function text(node: LexicalNode, key: string): ReactNode {
  let value: ReactNode = node.text || ''
  const format = typeof node.format === 'number' ? node.format : 0
  if (format & 16) value = <code>{value}</code>
  if (format & 2) value = <em>{value}</em>
  if (format & 1) value = <strong>{value}</strong>
  if (format & 8) value = <u>{value}</u>
  if (format & 4) value = <s>{value}</s>
  const style = styleFromCss(node.style)
  if (style) value = <span style={style}>{value}</span>
  return <Fragment key={key}>{value}</Fragment>
}

function children(node: LexicalNode, key: string): ReactNode[] {
  return (node.children || []).map((child, index) => renderNode(child, `${key}-${index}`))
}

function renderNode(node: LexicalNode, key: string): ReactNode {
  switch (node.type) {
    case 'text':
      return text(node, key)
    case 'linebreak':
      return <br key={key} />
    case 'paragraph':
      return <p key={key} style={elementStyle(node)}>{children(node, key)}</p>
    case 'heading':
      return React.createElement(node.tag || 'h2', { key, style: elementStyle(node) }, children(node, key))
    case 'list':
      return React.createElement(node.listType === 'number' ? 'ol' : 'ul', { key }, children(node, key))
    case 'listitem':
      return <li key={key}>{children(node, key)}</li>
    case 'quote':
      return <blockquote key={key}>{children(node, key)}</blockquote>
    case 'link':
    case 'autolink':
      return <a key={key} href={node.url || '#'}>{children(node, key)}</a>
    case 'rich-image': {
      if (!node.src) return null
      return (
        <figure className="richtext-image" key={key}>
          <img src={node.src} alt={node.alt || ''} />
        </figure>
      )
    }
    case 'image-row': {
      const images = (node.images || []).filter((image) => image?.src)
      if (!images.length) return null
      const columns = Math.min(4, Math.max(1, node.columns || 3))
      return (
        <div className={`richtext-gallery richtext-gallery-cols-${columns}`} key={key}>
          {images.map((image, index) => (
            <img key={`${image.src}-${index}`} src={image.src} alt={image.alt || ''} />
          ))}
        </div>
      )
    }
    default:
      return <Fragment key={key}>{children(node, key)}</Fragment>
  }
}

export default function LexicalContent({ data }: { data: unknown }) {
  if (!data || typeof data !== 'object') return null
  const root = (data as { root?: LexicalNode }).root
  if (!root) return null
  return <>{children(root, 'root')}</>
}

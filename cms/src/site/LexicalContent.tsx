import React, { Fragment, type ReactNode } from 'react'

type LexicalNode = {
  type?: string
  version?: number
  text?: string
  format?: number
  tag?: string
  listType?: string
  url?: string
  children?: LexicalNode[]
  src?: string
  alt?: string
  images?: Array<{ src?: string; alt?: string }>
  columns?: number
}

function text(node: LexicalNode, key: string): ReactNode {
  let value: ReactNode = node.text || ''
  const format = node.format || 0
  if (format & 16) value = <code>{value}</code>
  if (format & 2) value = <em>{value}</em>
  if (format & 1) value = <strong>{value}</strong>
  if (format & 8) value = <u>{value}</u>
  if (format & 4) value = <s>{value}</s>
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
      return <p key={key}>{children(node, key)}</p>
    case 'heading':
      return React.createElement(node.tag || 'h2', { key }, children(node, key))
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

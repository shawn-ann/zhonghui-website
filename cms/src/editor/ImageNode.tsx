import React, { useState } from 'react'
import {
  DecoratorNode,
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import MediaModal from './MediaModal'
import type { MediaItem } from './api'

type SerializedImageNode = Spread<{ src: string; alt?: string }, SerializedLexicalNode>

function ImageView({ nodeKey, src, alt }: { nodeKey: NodeKey; src: string; alt?: string }) {
  const [editor] = useLexicalComposerContext()
  const [picking, setPicking] = useState(false)

  const replace = (item: MediaItem) => {
    setPicking(false)
    if (!item.url) return
    const url = item.url
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node instanceof ImageNode) node.setImage(url, item.alt || '')
    })
  }

  return (
    <div className="rt-single-image" contentEditable={false}>
      <button
        type="button"
        className="rt-image-edit"
        title="点击更换图片"
        aria-label="更换图片"
        onClick={() => setPicking(true)}
      >
        <img src={src} alt={alt || ''} />
      </button>
      <button
        type="button"
        className="rt-image-row-delete"
        onClick={() => {
          editor.update(() => {
            const node = $getNodeByKey(nodeKey)
            if (node) node.remove()
          })
        }}
      >
        移除图片
      </button>
      {picking ? (
        <MediaModal
          title="更换图片"
          initialImages={[{ src, alt }]}
          onClose={() => setPicking(false)}
          onSelect={replace}
        />
      ) : null}
    </div>
  )
}

export class ImageNode extends DecoratorNode<React.JSX.Element> {
  __src: string
  __alt: string

  static getType(): string {
    return 'rich-image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__key)
  }

  constructor(src: string, alt = '', key?: NodeKey) {
    super(key)
    this.__src = src
    this.__alt = alt
  }

  static importJSON(serialized: SerializedImageNode): ImageNode {
    return new ImageNode(serialized.src, serialized.alt || '')
  }

  setImage(src: string, alt = ''): void {
    const writable = this.getWritable()
    writable.__src = src
    writable.__alt = alt
  }

  exportJSON(): SerializedImageNode {
    return { type: 'rich-image', version: 1, src: this.__src, alt: this.__alt }
  }

  createDOM(): HTMLElement {
    return document.createElement('div')
  }

  updateDOM(): false {
    return false
  }

  isInline(): false {
    return false
  }

  decorate(): React.JSX.Element {
    return <ImageView nodeKey={this.getKey()} src={this.__src} alt={this.__alt} />
  }
}

export function $insertImage(src: string, alt = '') {
  const selection = $getSelection()
  const node = new ImageNode(src, alt)
  if (selection) selection.insertNodes([node])
  else $getRoot().append(node)
  const paragraph = $createParagraphNode()
  node.insertAfter(paragraph)
  paragraph.selectStart()
  return paragraph.getKey()
}

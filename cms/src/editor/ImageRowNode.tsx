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

export type ImageRowItem = { src: string; alt?: string }
type SerializedImageRowNode = Spread<{ images: ImageRowItem[]; columns?: number }, SerializedLexicalNode>

function ImageRowView({
  nodeKey,
  images,
  columns,
}: {
  nodeKey: NodeKey
  images: ImageRowItem[]
  columns: number
}) {
  const [editor] = useLexicalComposerContext()
  const [picking, setPicking] = useState(false)
  const cols = Math.min(4, Math.max(1, columns || 3))

  const updateColumns = (next: number) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node instanceof ImageRowNode) node.setColumns(next)
    })
  }

  const updateImages = (items: MediaItem[]) => {
    const next = items
      .filter((item) => item.url)
      .map((item) => ({ src: item.url as string, alt: item.alt || '' }))
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node instanceof ImageRowNode) node.setImages(next)
    })
    setPicking(false)
  }

  return (
    <div className="rt-image-row" contentEditable={false}>
      <div className={`rt-image-row-grid rt-image-row-grid-cols-${cols}`}>
        {images.map((image, index) => (
          <button
            type="button"
            className="rt-image-edit"
            key={`${image.src}-${index}`}
            title="点击编辑图集"
            aria-label={`编辑图集，第 ${index + 1} 张`}
            onClick={() => setPicking(true)}
          >
            <img src={image.src} alt={image.alt || ''} />
          </button>
        ))}
      </div>
      <div className="rt-image-row-tools">
        <label>
          列数
          <select value={cols} onChange={(e) => updateColumns(Number(e.target.value))}>
            {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value} 列</option>)}
          </select>
        </label>
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
          移除图集
        </button>
      </div>
      {picking ? (
        <MediaModal
          title="编辑图集"
          multiple
          initialImages={images}
          confirmVerb="更新"
          onClose={() => setPicking(false)}
          onSelectMany={updateImages}
        />
      ) : null}
    </div>
  )
}

export class ImageRowNode extends DecoratorNode<React.JSX.Element> {
  __images: ImageRowItem[]
  __columns: number

  static getType(): string {
    return 'image-row'
  }

  static clone(node: ImageRowNode): ImageRowNode {
    return new ImageRowNode(node.__images, node.__columns, node.__key)
  }

  constructor(images: ImageRowItem[], columns = 3, key?: NodeKey) {
    super(key)
    this.__images = images
    this.__columns = columns
  }

  static importJSON(serialized: SerializedImageRowNode): ImageRowNode {
    return new ImageRowNode(serialized.images || [], serialized.columns || 3)
  }

  exportJSON(): SerializedImageRowNode {
    return {
      type: 'image-row',
      version: 1,
      images: this.__images,
      columns: this.__columns,
    }
  }

  setImages(images: ImageRowItem[]): void {
    const writable = this.getWritable()
    writable.__images = images
  }

  setColumns(columns: number): void {
    const writable = this.getWritable()
    writable.__columns = Math.min(4, Math.max(1, columns))
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
    return <ImageRowView nodeKey={this.getKey()} images={this.__images} columns={this.__columns} />
  }
}

export function $insertImageRow(images: ImageRowItem[], columns = 3) {
  const selection = $getSelection()
  const node = new ImageRowNode(images, columns)
  if (selection) selection.insertNodes([node])
  else $getRoot().append(node)
  const paragraph = $createParagraphNode()
  node.insertAfter(paragraph)
  paragraph.selectStart()
  return paragraph.getKey()
}

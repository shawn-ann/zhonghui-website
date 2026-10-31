import React from 'react'
import {
  DecoratorNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export type ImageRowItem = { src: string; alt?: string }
type SerializedImageRowNode = Spread<{ images: ImageRowItem[] }, SerializedLexicalNode>

function ImageRowView({ nodeKey, images }: { nodeKey: NodeKey; images: ImageRowItem[] }) {
  const [editor] = useLexicalComposerContext()
  return (
    <div className="rt-image-row" contentEditable={false}>
      <div className="rt-image-row-grid">
        {images.map((image, index) => (
          <img key={`${image.src}-${index}`} src={image.src} alt={image.alt || ''} />
        ))}
      </div>
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
  )
}

export class ImageRowNode extends DecoratorNode<React.JSX.Element> {
  __images: ImageRowItem[]

  static getType(): string {
    return 'image-row'
  }

  static clone(node: ImageRowNode): ImageRowNode {
    return new ImageRowNode(node.__images, node.__key)
  }

  constructor(images: ImageRowItem[], key?: NodeKey) {
    super(key)
    this.__images = images
  }

  static importJSON(serialized: SerializedImageRowNode): ImageRowNode {
    return new ImageRowNode(serialized.images || [])
  }

  exportJSON(): SerializedImageRowNode {
    return {
      type: 'image-row',
      version: 1,
      images: this.__images,
    }
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
    return <ImageRowView nodeKey={this.getKey()} images={this.__images} />
  }
}

export function $createImageRowNode(images: ImageRowItem[]): ImageRowNode {
  return new ImageRowNode(images)
}

export function $insertImageRow(images: ImageRowItem[]) {
  const selection = $getSelection()
  const node = $createImageRowNode(images)
  if (selection) selection.insertNodes([node])
  else $getRoot().append(node)
  return node
}

export function isImageRowNode(node: LexicalNode | null | undefined): node is ImageRowNode {
  return node instanceof ImageRowNode
}

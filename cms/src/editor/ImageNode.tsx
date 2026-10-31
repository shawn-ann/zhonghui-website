import React from 'react'
import {
  DecoratorNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

type SerializedImageNode = Spread<{ src: string; alt?: string }, SerializedLexicalNode>

function ImageView({ nodeKey, src, alt }: { nodeKey: NodeKey; src: string; alt?: string }) {
  const [editor] = useLexicalComposerContext()
  return (
    <div className="rt-single-image" contentEditable={false}>
      <img src={src} alt={alt || ''} />
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
}

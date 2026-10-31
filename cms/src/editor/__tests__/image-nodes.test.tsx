// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { createEditor, $getNodeByKey, $getRoot } from 'lexical'
import { ImageNode } from '../ImageNode'
import { ImageRowNode } from '../ImageRowNode'

describe('rich text image nodes', () => {
  it('updates a committed image without moving or mutating the original node', async () => {
    const editor = createEditor({ namespace: 'test', nodes: [ImageNode] })
    let key = ''
    let created: ImageNode | undefined

    editor.update(() => {
      created = new ImageNode('/a.jpg', 'A')
      $getRoot().append(created)
      key = created.getKey()
    })

    await Promise.resolve()

    editor.update(() => {
      const node = $getNodeByKey(key)
      if (!(node instanceof ImageNode)) throw new Error('image node not found')
      node.setImage('/b.jpg', 'B')
    })

    await Promise.resolve()
    const updated = editor.getEditorState().read(() => $getNodeByKey(key))

    expect(updated).toBeInstanceOf(ImageNode)
    expect(updated?.getKey()).toBe(key)
    expect(updated?.exportJSON()).toMatchObject({ type: 'rich-image', src: '/b.jpg', alt: 'B' })
    expect(created?.exportJSON()).toMatchObject({ type: 'rich-image', src: '/a.jpg', alt: 'A' })
  })

  it('updates all gallery images while keeping columns', async () => {
    const editor = createEditor({ namespace: 'test', nodes: [ImageRowNode] })
    let key = ''
    let created: ImageRowNode | undefined

    editor.update(() => {
      created = new ImageRowNode([{ src: '/a.jpg' }], 2)
      $getRoot().append(created)
      key = created.getKey()
    })

    await Promise.resolve()

    editor.update(() => {
      const node = $getNodeByKey(key)
      if (!(node instanceof ImageRowNode)) throw new Error('image row node not found')
      node.setImages([{ src: '/b.jpg', alt: 'B' }, { src: '/c.jpg', alt: 'C' }])
    })

    await Promise.resolve()
    const updated = editor.getEditorState().read(() => $getNodeByKey(key))

    expect(updated).toBeInstanceOf(ImageRowNode)
    expect(updated?.getKey()).toBe(key)
    expect(updated?.exportJSON()).toMatchObject({
      type: 'image-row',
      columns: 2,
      images: [{ src: '/b.jpg', alt: 'B' }, { src: '/c.jpg', alt: 'C' }],
    })
    expect(created?.exportJSON()).toMatchObject({
      type: 'image-row',
      columns: 2,
      images: [{ src: '/a.jpg' }],
    })
  })
})

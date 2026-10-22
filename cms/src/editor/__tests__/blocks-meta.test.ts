import { describe, it, expect } from 'vitest'
import { BLOCKS, isLayout, allowedChildTypes, blockSummary, makeDefaultBlock } from '../blocks'

describe('component categories', () => {
  it('classifies layout vs content', () => {
    expect(isLayout('section')).toBe(true)
    expect(isLayout('grid')).toBe(true)
    expect(isLayout('image')).toBe(false)
  })
  it('allowed children: section = layout blocks; grid = cards/text', () => {
    expect(allowedChildTypes('section')).toEqual(['heading', 'grid', 'gallery', 'banner', 'slider', 'richtext'])
    expect(allowedChildTypes('grid')).toEqual(['heading', 'text', 'image', 'imageText', 'iconCard', 'button'])
    expect(allowedChildTypes('image')).toEqual([])
  })
  it('summary for text/heading', () => {
    expect(blockSummary({ type: 'heading', title: '项目一览' } as any)).toBe('项目一览')
    expect(blockSummary({ type: 'grid', columns: 3 } as any)).toContain('3')
  })
  it('applies default content and media when adding blocks', () => {
    const media = { image: '/img.jpg', images: ['/a.jpg', '/b.jpg'], icon: '/i.svg' }
    expect(makeDefaultBlock('text')).toMatchObject({
      body: '在这里填写正文内容。', titleColor: '#8A0E4B', bodyColor: '#000000',
    })
    expect(makeDefaultBlock('image', media)).toMatchObject({ media: '/img.jpg' })
    expect(makeDefaultBlock('imageText', media)).toMatchObject({
      media: '/img.jpg', title: '图文卡片', titleColor: '#8A0E4B', descColor: '#000000',
    })
    expect(makeDefaultBlock('iconCard', media)).toMatchObject({
      icon: '/i.svg', title: '图标卡片', titleColor: '#8A0E4B', descColor: '#000000',
    })
    expect(makeDefaultBlock('button')).toMatchObject({ label: '按钮' })
    expect(makeDefaultBlock('gallery', media)).toMatchObject({ images: ['/a.jpg'] })
    expect(makeDefaultBlock('slider', media)).toMatchObject({ images: ['/a.jpg'] })
    expect(makeDefaultBlock('banner')).toMatchObject({
      title: '横幅标题', titleColor: '#8A0E4B', subColor: '#000000',
    })
    expect(makeDefaultBlock('heading')).toMatchObject({
      titleColor: '#8A0E4B', subtitleColor: '#000000',
    })
    expect(makeDefaultBlock('richtext')).toMatchObject({ html: expect.stringContaining('富文本内容') })
  })

  it('content blocks no longer expose background settings', () => {
    for (const t of ['text', 'image', 'imageText', 'button', 'richtext', 'gallery', 'slider'] as const) {
      const keys = BLOCKS[t].fields.map((f) => f.key)
      expect(keys).not.toContain('bg')
      expect(keys).not.toContain('alt')
    }
  })
})

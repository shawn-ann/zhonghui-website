import type { Block } from 'payload'

export const SliderBlock: Block = {
  slug: 'slider',
  labels: { singular: '轮播', plural: '轮播' },
  fields: [
    {
      name: 'images',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    // 旧字段：轮播不再使用背景。
    { name: 'bg', type: 'text', admin: { hidden: true } },
  ],
}

import type { Block } from 'payload'
import { bgField } from './common'

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
    bgField(),
  ],
}

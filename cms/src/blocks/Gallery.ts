import type { Block } from 'payload'
import { bgField, altField } from './common'

export const GalleryBlock: Block = {
  slug: 'gallery',
  labels: { singular: '图集', plural: '图集' },
  fields: [
    {
      name: 'images',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    { name: 'columns', type: 'number', defaultValue: 3, min: 1, max: 4 },
    bgField(),
    altField(),
  ],
}

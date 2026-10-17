import type { Block } from 'payload'
import { bgField, altField, linkField, paddingField } from './common'

export const ImageBlock: Block = {
  slug: 'image',
  labels: { singular: '图片', plural: '图片' },
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    { name: 'altText', type: 'text' },
    linkField(),
    bgField(),
    altField(),
    paddingField(),
  ],
}

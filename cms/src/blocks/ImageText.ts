import type { Block } from 'payload'
import { bgField, altField, linkField } from './common'

export const ImageTextBlock: Block = {
  slug: 'imageText',
  labels: { singular: '图文卡片', plural: '图文卡片' },
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    { name: 'title', type: 'text' },
    { name: 'desc', type: 'textarea' },
    linkField(),
    bgField(),
    altField(),
  ],
}

import type { Block } from 'payload'
import { legacyBgAltFields, linkField, paddingField } from './common'

export const ImageBlock: Block = {
  slug: 'image',
  labels: { singular: '图片', plural: '图片' },
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    { name: 'altText', type: 'text' },
    linkField(),
    {
      name: 'aspectRatio',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: '自动', value: 'auto' },
        { label: '1:1', value: '1:1' },
        { label: '4:3', value: '4:3' },
        { label: '3:4', value: '3:4' },
        { label: '16:9', value: '16:9' },
      ],
    },
    {
      name: 'fit',
      type: 'select',
      defaultValue: 'cover',
      options: [
        { label: '裁剪填充', value: 'cover' },
        { label: '完整显示', value: 'contain' },
      ],
    },
    ...legacyBgAltFields(),
    paddingField(),
  ],
}

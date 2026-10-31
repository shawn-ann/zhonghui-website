import type { Block } from 'payload'
import { legacyBgAltFields, pageLinkFields, paddingField } from './common'

export const ImageTextBlock: Block = {
  slug: 'imageText',
  labels: { singular: '图文卡片', plural: '图文卡片' },
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    { name: 'title', type: 'text' },
    { name: 'subtitle', type: 'text', label: '副标题（可选）' },
    { name: 'subtitleColor', type: 'text', admin: { description: '副标题颜色，留空沿用主题色' } },
    { name: 'desc', type: 'textarea' },
    {
      name: 'imageRatio',
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
    { name: 'titleColor', type: 'text', admin: { description: '标题颜色，留空沿用主题色' } },
    { name: 'descColor', type: 'text', admin: { description: '描述颜色，留空沿用主题色' } },
    ...pageLinkFields(),
    ...legacyBgAltFields(),
    paddingField(),
  ],
}

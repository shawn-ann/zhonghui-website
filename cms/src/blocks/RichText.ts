import type { Block } from 'payload'
import { legacyBgAltFields, paddingField } from './common'

export const RichTextBlock: Block = {
  slug: 'richtext',
  labels: { singular: '富文本', plural: '富文本' },
  fields: [
    { name: 'content', type: 'richText' },
    { name: 'textColor', type: 'text', label: '文字颜色', admin: { description: '留空沿用主题色；示例 #FFFFFF' } },
    ...legacyBgAltFields(),
    paddingField(),
  ],
}

import type { Block } from 'payload'
import { legacyBgAltFields, paddingField } from './common'

export const TextBlock: Block = {
  slug: 'text',
  labels: { singular: '文本', plural: '文本' },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'body', type: 'textarea', required: true },
    { name: 'titleColor', type: 'text', admin: { description: '标题颜色，留空沿用主题色' } },
    { name: 'bodyColor', type: 'text', admin: { description: '正文颜色，留空沿用主题色' } },
    {
      name: 'align',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: '左对齐', value: 'left' },
        { label: '居中', value: 'center' },
      ],
    },
    ...legacyBgAltFields(),
    paddingField(),
  ],
}

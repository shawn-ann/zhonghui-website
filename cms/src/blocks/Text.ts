import type { Block } from 'payload'
import { bgField, altField, paddingField } from './common'

export const TextBlock: Block = {
  slug: 'text',
  labels: { singular: '文本', plural: '文本' },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'body', type: 'textarea', required: true },
    {
      name: 'align',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: '左对齐', value: 'left' },
        { label: '居中', value: 'center' },
      ],
    },
    bgField(),
    altField(),
    paddingField(),
  ],
}

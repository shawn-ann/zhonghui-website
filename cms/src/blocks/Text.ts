import type { Block } from 'payload'

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
    { name: 'bg', type: 'text', admin: { description: '背景图路径/颜色/渐变，留空为白底' } },
    { name: 'alt', type: 'checkbox', label: '浅粉底', defaultValue: false },
  ],
}

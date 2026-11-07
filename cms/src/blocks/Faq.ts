import type { Block } from 'payload'

export const FaqBlock: Block = {
  slug: 'faq',
  labels: { singular: '常见问答', plural: '常见问答' },
  fields: [
    { name: 'title', type: 'text', label: '标题（可选）' },
    { name: 'collapsible', type: 'checkbox', label: '折叠显示', defaultValue: false },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      label: '问答',
      fields: [
        { name: 'q', type: 'text', label: '问题', required: true },
        { name: 'a', type: 'textarea', label: '答案', required: true },
      ],
    },
  ],
}

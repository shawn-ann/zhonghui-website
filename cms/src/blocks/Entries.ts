import type { Block } from 'payload'

export const EntriesBlock: Block = {
  slug: 'entries',
  labels: { singular: '文本条目', plural: '文本条目' },
  fields: [
    { name: 'title', type: 'text', label: '标题（可选）' },
    { name: 'collapsible', type: 'checkbox', label: '折叠显示', defaultValue: false },
    { name: 'labelPrefix', type: 'text', label: '标签前缀', defaultValue: 'Q：' },
    { name: 'textPrefix', type: 'text', label: '正文前缀', defaultValue: 'A：' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      label: '条目',
      fields: [
        { name: 'label', type: 'text', label: '标签', required: true },
        { name: 'text', type: 'textarea', label: '正文', required: true },
      ],
    },
  ],
}

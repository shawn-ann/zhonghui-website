import type { Block } from 'payload'

export const ZigzagBlock: Block = {
  slug: 'zigzag',
  labels: { singular: '交替图文', plural: '交替图文' },
  fields: [
    { name: 'title', type: 'text', label: '标题（可选）' },
    { name: 'showLine', type: 'checkbox', label: '显示中轴线', defaultValue: true },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      label: '条目',
      fields: [
        { name: 'icon', type: 'upload', relationTo: 'media', label: '图标（可选）' },
        { name: 'text', type: 'textarea', required: true, label: '文本' },
        {
          name: 'side',
          type: 'select',
          defaultValue: 'auto',
          label: '所在侧',
          options: [
            { label: '自动交替', value: 'auto' },
            { label: '左', value: 'left' },
            { label: '右', value: 'right' },
          ],
        },
      ],
    },
  ],
}

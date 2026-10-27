import type { Block } from 'payload'

export const InfoListBlock: Block = {
  slug: 'infoList',
  labels: { singular: '信息列表', plural: '信息列表' },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'label', type: 'text', label: '标签（可选）' },
        { name: 'desc', type: 'textarea', label: '说明', required: true },
      ],
    },
    { name: 'showDots', type: 'checkbox', label: '显示圆点', defaultValue: true },
  ],
}

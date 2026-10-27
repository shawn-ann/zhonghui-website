import type { Block } from 'payload'

export const IconListBlock: Block = {
  slug: 'iconList',
  labels: { singular: '图标列表', plural: '图标列表' },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'icon', type: 'upload', relationTo: 'media', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'desc', type: 'textarea' },
      ],
    },
    {
      name: 'iconPosition',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: '图标居左', value: 'left' },
        { label: '图标居右', value: 'right' },
        { label: '左右交替', value: 'alternate' },
      ],
    },
    { name: 'iconColor', type: 'text', label: '图标颜色（可选）' },
  ],
}

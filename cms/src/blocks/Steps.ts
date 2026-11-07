import type { Block } from 'payload'

export const StepsBlock: Block = {
  slug: 'steps',
  labels: { singular: '流程步骤', plural: '流程步骤' },
  fields: [
    { name: 'title', type: 'text', label: '标题（可选）' },
    // 旧字段：早期版本把配图放在步骤块内，保留列以避免触发删列迁移。
    { name: 'image', type: 'upload', relationTo: 'media', admin: { hidden: true } },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'image-left',
      options: [
        { label: '图片在左', value: 'image-left' },
        { label: '图片在右', value: 'image-right' },
        { label: '无图', value: 'none' },
      ],
      admin: { hidden: true },
    },
    { name: 'start', type: 'number', defaultValue: 1, min: 0, label: '起始编号' },
    { name: 'connector', type: 'checkbox', defaultValue: true, label: '显示虚线分隔' },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 1,
      label: '步骤',
      fields: [
        { name: 'title', type: 'text', required: true, label: '步骤' },
        { name: 'desc', type: 'textarea', label: '说明（可选）' },
      ],
    },
  ],
}

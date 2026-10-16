import type { Block } from 'payload'

export const HeadingBlock: Block = {
  slug: 'heading',
  labels: { singular: '标题', plural: '标题' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'subtitle', type: 'text' },
    { name: 'align', type: 'select', defaultValue: 'center', options: [{ label: '居中', value: 'center' }, { label: '左对齐', value: 'left' }] },
  ],
}

import type { Block } from 'payload'
import { paddingField } from './common'

export const HeadingBlock: Block = {
  slug: 'heading',
  labels: { singular: '标题', plural: '标题' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'subtitle', type: 'text' },
    { name: 'titleColor', type: 'text', admin: { description: '标题颜色，留空沿用主题色' } },
    { name: 'subtitleColor', type: 'text', admin: { description: '副标题颜色，留空沿用主题色' } },
    { name: 'align', type: 'select', defaultValue: 'center', options: [{ label: '居中', value: 'center' }, { label: '左对齐', value: 'left' }] },
    paddingField(),
  ],
}

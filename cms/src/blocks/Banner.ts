import type { Block } from 'payload'
import { bgField, altField } from './common'

export const BannerBlock: Block = {
  slug: 'banner',
  labels: { singular: '横幅', plural: '横幅' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'split',
      options: [
        { label: '左右（左文右图）', value: 'split' },
        { label: '整图（居中）', value: 'centered' },
      ],
    },
    { name: 'title', type: 'text' },
    { name: 'sub', type: 'text' },
    { name: 'titleColor', type: 'text', admin: { description: '标题颜色，留空沿用主题色' } },
    { name: 'subColor', type: 'text', admin: { description: '副标题颜色，留空沿用主题色' } },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'pattern', type: 'upload', relationTo: 'media' },
    bgField(),
    altField(),
  ],
}

import type { Block } from 'payload'
import { TextBlock } from './Text'
import { HeadingBlock } from './Heading'
import { ImageBlock } from './Image'
import { ImageTextBlock } from './ImageText'
import { IconCardBlock } from './IconCard'
import { ButtonBlock } from './Button'

export const StackBlock: Block = {
  slug: 'stack',
  labels: { singular: '纵向容器', plural: '纵向容器' },
  fields: [
    {
      name: 'gap',
      type: 'select',
      defaultValue: 'md',
      options: [
        { label: '紧凑', value: 'sm' },
        { label: '标准', value: 'md' },
        { label: '宽松', value: 'lg' },
      ],
    },
    {
      name: 'children',
      type: 'blocks',
      blocks: [HeadingBlock, TextBlock, ImageBlock, ImageTextBlock, IconCardBlock, ButtonBlock],
      labels: { singular: '内容', plural: '内容' },
    },
  ],
}

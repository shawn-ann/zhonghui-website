import type { Block } from 'payload'
import { ImageTextBlock } from './ImageText'

export const HscrollBlock: Block = {
  slug: 'hscroll',
  labels: { singular: '横向滚动', plural: '横向滚动' },
  fields: [
    { name: 'timeline', type: 'checkbox', label: '时间轴连接线', defaultValue: false },
    { name: 'children', type: 'blocks', blocks: [ImageTextBlock], labels: { singular: '卡片', plural: '卡片' } },
  ],
}

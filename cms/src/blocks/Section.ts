import type { Block } from 'payload'

export function makeSection(childrenBlocks: Block[]): Block {
  return {
    slug: 'section',
    labels: { singular: '分栏', plural: '分栏' },
    fields: [
      { name: 'bgImage', type: 'text', admin: { description: '背景图片 URL' } },
      { name: 'bgColor', type: 'text', admin: { description: '背景颜色，如 #FFF1F6' } },
      // 旧字段：迁移后不再使用，保留列以避免历史数据丢失。
      { name: 'bg', type: 'text', admin: { hidden: true } },
      { name: 'paddingY', type: 'select', defaultValue: 'md', label: '垂直内边距', options: [
        { label: '无', value: 'none' }, { label: '紧凑', value: 'sm' },
        { label: '标准', value: 'md' }, { label: '宽松', value: 'lg' },
      ] },
      { name: 'children', type: 'blocks', blocks: childrenBlocks },
    ],
  }
}

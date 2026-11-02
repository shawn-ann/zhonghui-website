import type { Block } from 'payload'

export function makeSection(childrenBlocks: Block[]): Block {
  return {
    slug: 'section',
    labels: { singular: '分栏', plural: '分栏' },
    fields: [
      { name: 'bg', type: 'text', admin: { description: '背景图路径/颜色/渐变' } },
      { name: 'paddingY', type: 'select', defaultValue: 'md', label: '垂直内边距', options: [
        { label: '无', value: 'none' }, { label: '紧凑', value: 'sm' },
        { label: '标准', value: 'md' }, { label: '宽松', value: 'lg' },
      ] },
      { name: 'children', type: 'blocks', blocks: childrenBlocks },
    ],
  }
}

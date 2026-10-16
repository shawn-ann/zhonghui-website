import type { Block } from 'payload'

export function makeSection(childrenBlocks: Block[]): Block {
  return {
    slug: 'section',
    labels: { singular: '分栏', plural: '分栏' },
    fields: [
      { name: 'bg', type: 'text', admin: { description: '背景图路径/颜色/渐变' } },
      {
        name: 'padding',
        type: 'select',
        defaultValue: 'md',
        options: [
          { label: '无', value: 'none' },
          { label: '小', value: 'sm' },
          { label: '中', value: 'md' },
          { label: '大', value: 'lg' },
        ],
      },
      { name: 'children', type: 'blocks', blocks: childrenBlocks },
    ],
  }
}

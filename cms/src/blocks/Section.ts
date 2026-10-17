import type { Block } from 'payload'

export function makeSection(childrenBlocks: Block[]): Block {
  return {
    slug: 'section',
    labels: { singular: '分栏', plural: '分栏' },
    fields: [
      { name: 'bg', type: 'text', admin: { description: '背景图路径/颜色/渐变' } },
      { name: 'children', type: 'blocks', blocks: childrenBlocks },
    ],
  }
}

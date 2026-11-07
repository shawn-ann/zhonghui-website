import type { Block } from 'payload'
import { gridContent } from './gridContent'
import { GridRowBlock } from './GridRow'

/** 网格允许的卡片/文本组件（编辑器同步使用）。 */
export const gridChildren: Block[] = gridContent

export function makeGrid(slug: string, label: string, cellComponents: Block[]): Block {
  return {
    slug,
    labels: { singular: label, plural: label },
    fields: [
      {
        name: 'layout',
        type: 'select',
        defaultValue: 'flow',
        options: [
          { label: '流式（自动换行）', value: 'flow' },
          { label: '按行（显式格子）', value: 'rows' },
        ],
      },
      { name: 'columns', type: 'number', defaultValue: 3, min: 1, max: 6 },
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
        name: 'columnRatio',
        type: 'text',
        defaultValue: '1:1:1',
        admin: { description: '正整数比例，段数需等于列数，如 2:3 或 1:2:1' },
      },
      {
        name: 'alignItems',
        type: 'select',
        defaultValue: 'stretch',
        options: [
          { label: '拉伸等高', value: 'stretch' },
          { label: '顶部对齐', value: 'start' },
          { label: '居中', value: 'center' },
          { label: '底部对齐', value: 'end' },
        ],
      },
      { name: 'children', type: 'blocks', blocks: cellComponents },
      { name: 'bgImage', type: 'text', admin: { description: '背景图片 URL' } },
      { name: 'bgColor', type: 'text', admin: { description: '背景颜色，如 #FFF1F6' } },
      { name: 'padding', type: 'number', min: 0, defaultValue: 0, label: '内容内边距(px)', admin: { description: '给带背景的网格留白' } },
      // 旧字段：迁移后不再使用，保留以避免触发删列迁移。
      { name: 'bg', type: 'text', admin: { hidden: true } },
      { name: 'alt', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
    ],
  }
}

// 保留内层网格定义以兼容历史数据；编辑器不再提供嵌套网格。
export const GridInner = makeGrid('gridInner', '网格(内层)', gridContent)
export const Grid = makeGrid('grid', '网格', [...gridContent, GridRowBlock, GridInner])

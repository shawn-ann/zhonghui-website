import type { Block } from 'payload'

export const IconCardBlock: Block = {
  slug: 'iconCard',
  labels: { singular: '图标卡片', plural: '图标卡片' },
  fields: [
    { name: 'icon', type: 'upload', relationTo: 'media', required: true },
    { name: 'title', type: 'text' },
    { name: 'desc', type: 'textarea' },
    { name: 'link', type: 'text', admin: { description: '站内路由或完整外链' } },
  ],
}

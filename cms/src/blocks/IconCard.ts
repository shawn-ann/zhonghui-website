import type { Block } from 'payload'
import { pageLinkFields } from './common'

export const IconCardBlock: Block = {
  slug: 'iconCard',
  labels: { singular: '图标卡片', plural: '图标卡片' },
  fields: [
    { name: 'icon', type: 'upload', relationTo: 'media', required: true },
    { name: 'title', type: 'text' },
    { name: 'desc', type: 'textarea' },
    { name: 'titleColor', type: 'text', admin: { description: '标题颜色，留空沿用主题色' } },
    { name: 'descColor', type: 'text', admin: { description: '描述颜色，留空沿用主题色' } },
    ...pageLinkFields(),
    { name: 'bgImage', type: 'text', admin: { description: '卡片背景图片 URL' } },
    { name: 'bgColor', type: 'text', admin: { description: '卡片背景颜色，如 #FFF1F6' } },
    { name: 'iconColor', type: 'text', admin: { description: '图标颜色，如 #E60039' } },
  ],
}

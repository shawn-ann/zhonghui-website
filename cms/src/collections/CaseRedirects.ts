import type { CollectionConfig } from 'payload'

export const CaseRedirects: CollectionConfig = {
  slug: 'case-redirects',
  labels: { singular: '文章重定向', plural: '文章重定向' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'createdAt'],
  },
  fields: [
    { name: 'from', type: 'text', required: true, unique: true, index: true, label: '旧路径' },
    { name: 'to', type: 'text', required: true, label: '新路径' },
    { name: 'createdAt', type: 'date', required: true, label: '创建时间', admin: { components: { Cell: '/components/admin/BeijingTimeCell' } } },
  ],
}

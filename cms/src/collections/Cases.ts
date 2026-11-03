import type { CollectionConfig } from 'payload'
import { validateCaseSlug } from './caseSlug'

export const Cases: CollectionConfig = {
  slug: 'cases',
  labels: { singular: '案例', plural: '案例' },
  access: { read: () => true },
  versions: { drafts: true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: '标题' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: '详情 URL 段，如 xiaocao；发布后修改会生成重定向' },
      validate: (value: unknown) => validateCaseSlug(value),
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'case-categories',
      required: true,
      label: '所属分类',
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: '封面大图',
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      label: '发布日期',
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    { name: 'body', type: 'richText', required: true, label: '正文' },
    { name: 'seoTitle', type: 'text', label: 'SEO 标题（可选）' },
    { name: 'seoDescription', type: 'textarea', label: 'SEO 描述（可选）' },
  ],
}

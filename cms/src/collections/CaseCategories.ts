import type { CollectionConfig } from 'payload'
import { validateCaseSlug } from './caseSlug'
import { redirectCategorySlug } from './redirectHooks'

const slugField = {
  name: 'slug',
  type: 'text' as const,
  required: true,
  unique: true,
  index: true,
  admin: { description: 'URL 段，只能使用小写字母、数字和连字符，如 study-case' },
  validate: (value: unknown) => validateCaseSlug(value),
}

export const CaseCategories: CollectionConfig = {
  slug: 'case-categories',
  labels: { singular: '案例分类', plural: '案例分类' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'order', 'pageSize'],
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (operation !== 'update' || !previousDoc?.slug) return doc
        if (previousDoc.slug === doc.slug) return doc
        await redirectCategorySlug(req.payload, doc.id, previousDoc.slug, doc.slug, doc.pageSize)
        return doc
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const linked = await req.payload.find({
          collection: 'cases',
          where: { category: { equals: id } },
          limit: 1,
          depth: 0,
        })
        if (linked.docs.length) {
          throw new Error('该分类下仍有案例，请先移动或删除这些案例')
        }
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: '分类名称' },
    slugField,
    { name: 'banner', type: 'upload', relationTo: 'media', label: '列表页 Banner' },
    { name: 'subtitle', type: 'text', label: '列表页副标题' },
    {
      name: 'pageSize',
      type: 'number',
      required: true,
      defaultValue: 12,
      min: 1,
      max: 48,
      label: '每页条数',
    },
    { name: 'order', type: 'number', defaultValue: 0, label: '排序（越小越前）' },
    { name: 'seoTitle', type: 'text', label: 'SEO 标题（可选）' },
    { name: 'seoDescription', type: 'textarea', label: 'SEO 描述（可选）' },
  ],
}

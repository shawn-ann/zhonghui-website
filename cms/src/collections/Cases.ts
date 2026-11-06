import type { CollectionConfig } from 'payload'
import { validateCaseSlug } from './caseSlug'
import { categorySlugOf, upsertRedirect } from './redirectHooks'
import { casePath } from '../generate/redirects'
import { resolvePublishedAt } from './publishedAt'

export const Cases: CollectionConfig = {
  slug: 'cases',
  labels: { singular: '文章', plural: '文章' },
  access: { read: () => true },
  versions: { drafts: true },
  defaultSort: '-publishedAt',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
    description: '管理文章内容；选择文章分类、封面并填写正文后发布。',
    components: {
      edit: {
        beforeDocumentControls: ['/components/admin/CollectionPreviewLink'],
      },
    },
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc, operation }) => {
        data.publishedAt = resolvePublishedAt({
          operation,
          current: (originalDoc as any)?.publishedAt,
          incoming: data.publishedAt,
          createdAt: (originalDoc as any)?.createdAt,
        })
        return data
      },
      async ({ data, originalDoc, req }) => {
        if (data._status !== 'published') return data
        const categorySlug = await categorySlugOf(req.payload, data.category)
        if (!categorySlug) return data
        const nextPath = casePath(categorySlug, String(data.slug))

        // publishedPath 只在发布时更新，因此“草稿改 slug 再发布”仍能拿到上一个公开 URL
        let previousPath = (originalDoc as any)?.publishedPath as string | undefined
        if (!previousPath && (originalDoc as any)?._status === 'published') {
          const oldCategory = await categorySlugOf(req.payload, (originalDoc as any)?.category)
          if (oldCategory && (originalDoc as any)?.slug) {
            previousPath = casePath(oldCategory, (originalDoc as any).slug)
          }
        }
        if (previousPath && previousPath !== nextPath) {
          await upsertRedirect(req.payload, previousPath, nextPath)
        }
        return { ...data, publishedPath: nextPath }
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: '文章标题' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'URL 别名',
      admin: { description: '文章链接的最后一段，如 xiaocao；发布后修改会自动生成旧链接跳转' },
      validate: (value: unknown) => validateCaseSlug(value),
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'case-categories',
      required: true,
      label: '文章分类',
      admin: { position: 'sidebar', allowCreate: false, allowEdit: false },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: '封面图',
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: '发布日期',
      admin: { hidden: true },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      label: '正文',
      admin: { components: { Field: '/components/admin/ArticleBodyField' } },
    },
    { name: 'publishedPath', type: 'text', hidden: true, admin: { readOnly: true } },
    { name: 'seoTitle', type: 'text', hidden: true },
    { name: 'seoDescription', type: 'textarea', hidden: true },
  ],
}

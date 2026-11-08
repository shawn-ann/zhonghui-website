import type { CollectionConfig } from 'payload'
import { scheduleRebuild } from '../build/scheduler'
import { shouldRebuildPublishedChange } from '../build/triggers'
import { pageBlocks } from '../blocks'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: '页面', plural: '页面' },
  versions: { drafts: true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'route', '_status'],
    components: {
      views: {
        list: { Component: '/components/PagesListView' },
        edit: {
          default: { Component: '/components/PageEditorView' },
        },
      },
    },
  },
  hooks: {
    afterChange: [({ doc, previousDoc, operation }: any) => {
      if (shouldRebuildPublishedChange(operation, doc, previousDoc)) scheduleRebuild()
    }],
    afterDelete: [({ doc }: any) => {
      if (shouldRebuildPublishedChange('delete', doc)) scheduleRebuild()
    }],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'route',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: '以 / 开头，如 /about/' },
      validate: (val: unknown) =>
        typeof val === 'string' && val.startsWith('/') ? true : 'route 必须以 / 开头',
    },
    { name: 'blocks', type: 'blocks', blocks: pageBlocks },
  ],
}

import type { Block } from 'payload'
import { bgField, altField, paddingField } from './common'

export const RichTextBlock: Block = {
  slug: 'richtext',
  labels: { singular: '富文本', plural: '富文本' },
  fields: [{ name: 'content', type: 'richText' }, bgField(), altField(), paddingField()],
}

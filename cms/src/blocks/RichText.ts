import type { Block } from 'payload'
import { legacyBgAltFields, paddingField } from './common'

export const RichTextBlock: Block = {
  slug: 'richtext',
  labels: { singular: '富文本', plural: '富文本' },
  fields: [{ name: 'content', type: 'richText' }, ...legacyBgAltFields(), paddingField()],
}

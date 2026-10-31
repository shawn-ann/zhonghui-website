import type { Block } from 'payload'
import { legacyBgAltFields, pageLinkFields, paddingField } from './common'

export const ButtonBlock: Block = {
  slug: 'button',
  labels: { singular: '按钮', plural: '按钮' },
  fields: [
    { name: 'label', type: 'text', required: true },
    ...pageLinkFields(),
    {
      name: 'style',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { label: '实心', value: 'primary' },
        { label: '描边', value: 'outline' },
      ],
    },
    ...legacyBgAltFields(),
    paddingField(),
  ],
}

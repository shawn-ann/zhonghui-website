import type { Field, GlobalConfig } from 'payload'

const itemFields = (): Field[] => [
  { name: 'label', type: 'text', required: true, label: '名称' },
  {
    name: 'page',
    type: 'relationship',
    relationTo: 'pages',
    required: true,
    label: '内部页面',
  },
]

export const Menu: GlobalConfig = {
  slug: 'menu',
  label: '菜单',
  access: { read: () => true },
  admin: {
    components: {
      views: {
        edit: { default: { Component: '/components/MenuEditorView' } },
      },
    },
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: '菜单项',
      fields: [
        ...itemFields(),
        {
          name: 'children',
          type: 'array',
          label: '子菜单',
          fields: itemFields(),
        },
      ],
    },
  ],
}

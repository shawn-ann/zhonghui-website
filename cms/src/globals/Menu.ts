import type { Field, GlobalConfig } from 'payload'

const itemFields = (): Field[] => [
  { name: 'label', type: 'text', required: true, label: '名称' },
  {
    name: 'linkType',
    type: 'select',
    defaultValue: 'page',
    label: '链接类型',
    options: [
      { label: '内部页面', value: 'page' },
      { label: '案例汇总', value: 'caseIndex' },
      { label: '案例分类', value: 'caseCategory' },
      { label: '外链', value: 'external' },
    ],
  },
  {
    name: 'page',
    type: 'relationship',
    relationTo: 'pages',
    label: '内部页面',
    admin: { condition: (_data, siblingData) => !siblingData?.linkType || siblingData.linkType === 'page' },
  },
  {
    name: 'caseCategory',
    type: 'relationship',
    relationTo: 'case-categories',
    label: '案例分类',
    admin: { condition: (_data, siblingData) => siblingData?.linkType === 'caseCategory' },
  },
  {
    name: 'externalUrl',
    type: 'text',
    label: '外链地址',
    admin: { condition: (_data, siblingData) => siblingData?.linkType === 'external' },
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

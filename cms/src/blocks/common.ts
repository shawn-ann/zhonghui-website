import type { Field } from 'payload'

export const bgField = (): Field => ({
  name: 'bg',
  type: 'text',
  admin: { description: '背景图路径/颜色/渐变，留空为白底' },
})

export const altField = (): Field => ({
  name: 'alt',
  type: 'checkbox',
  label: '浅粉底',
  defaultValue: false,
})

/**
 * 旧字段：内容组件已不再使用背景/浅粉底。
 * 保留为隐藏列，避免删除列触发数据库迁移。
 */
export const legacyBgAltFields = (): Field[] => [
  { name: 'bg', type: 'text', admin: { hidden: true } },
  { name: 'alt', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
]

export const paddingField = (): Field => ({
  name: 'padding',
  type: 'number',
  defaultValue: 0,
  min: 0,
  admin: { description: '内容内边距(px)，默认0' },
})

export const linkField = (name = 'link'): Field => ({
  name,
  type: 'text',
  admin: { description: '站内路由以 / 开头，或完整外链 https://…' },
})

/** 内部页面 / 外部链接二选一；旧的 link 文本保留为隐藏字段。 */
export const pageLinkFields = (): Field[] => [
  {
    name: 'linkType',
    type: 'select',
    defaultValue: 'none',
    label: '链接类型',
    options: [
      { label: '无链接', value: 'none' },
      { label: '内部页面', value: 'internal' },
      { label: '外部链接', value: 'external' },
    ],
  },
  {
    name: 'internalPage',
    type: 'relationship',
    relationTo: 'pages',
    label: '内部页面',
    admin: { description: '静态生成时解析为该页面的路由' },
  },
  { name: 'externalUrl', type: 'text', label: '外部链接', admin: { description: 'https://… / mailto: / tel:' } },
  { name: 'link', type: 'text', admin: { hidden: true } },
]

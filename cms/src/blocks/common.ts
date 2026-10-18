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

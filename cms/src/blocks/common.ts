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

export const linkField = (name = 'link'): Field => ({
  name,
  type: 'text',
  admin: { description: '站内路由以 / 开头，或完整外链 https://…' },
})

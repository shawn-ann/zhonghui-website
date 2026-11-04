import type { GlobalConfig } from 'payload'

export const CaseSettings: GlobalConfig = {
  slug: 'case-settings',
  label: '汇总页设置',
  access: { read: () => true },
  admin: { description: '配置文章汇总页的标题、Banner 和每页文章数。' },
  fields: [
    { name: 'indexTitle', type: 'text', defaultValue: '案例分享', label: '汇总页标题' },
    {
      name: 'indexSubtitle',
      type: 'text',
      defaultValue: '每一段旅程，都值得被记录',
      label: '汇总页副标题',
    },
    { name: 'indexBanner', type: 'upload', relationTo: 'media', label: '汇总页 Banner' },
    {
      name: 'indexPageSize',
      type: 'number',
      defaultValue: 12,
      min: 1,
      max: 48,
      label: '每页文章数',
    },
  ],
}

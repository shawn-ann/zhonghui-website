import type { GlobalConfig } from 'payload'

export const CaseSettings: GlobalConfig = {
  slug: 'case-settings',
  label: '案例汇总设置',
  access: { read: () => true },
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
      label: '汇总页每页条数',
    },
  ],
}

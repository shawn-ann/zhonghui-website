import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: '站点设置',
  access: { read: () => true },
  admin: {
    components: {
      views: {
        edit: { default: { Component: '/components/SiteSettingsView' } },
      },
    },
  },
  fields: [
    { name: 'logo', type: 'upload', relationTo: 'media', label: '导航 Logo' },
    { name: 'footerLogo', type: 'upload', relationTo: 'media', label: '页脚 Logo' },
    {
      name: 'footerInfo',
      type: 'array',
      label: '页脚信息',
      fields: [
        { name: 'label', type: 'text', label: '标签' },
        { name: 'text', type: 'text', label: '内容' },
      ],
    },
    {
      name: 'footerQr',
      type: 'array',
      label: '页脚二维码',
      fields: [
        { name: 'label', type: 'text', label: '名称' },
        { name: 'image', type: 'upload', relationTo: 'media', label: '二维码图片' },
      ],
    },
    { name: 'footerContactLabel', type: 'text', label: '联系按钮文字' },
    { name: 'footerContactPage', type: 'relationship', relationTo: 'pages', label: '联系按钮页面' },
    { name: 'copyright', type: 'text', label: '版权信息' },
    { name: 'langCurrentLabel', type: 'text', label: '当前语言名称' },
    { name: 'langOtherLabel', type: 'text', label: '其它语言名称' },
    { name: 'langOtherUrl', type: 'text', label: '其它语言链接' },
  ],
}

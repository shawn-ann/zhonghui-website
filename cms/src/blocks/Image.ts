import type { Block } from 'payload'

export const ImageBlock: Block = {
  slug: 'image',
  labels: { singular: '图片', plural: '图片' },
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    { name: 'altText', type: 'text' },
    { name: 'link', type: 'text' },
    { name: 'bg', type: 'text' },
    { name: 'alt', type: 'checkbox', label: '浅粉底', defaultValue: false },
  ],
}

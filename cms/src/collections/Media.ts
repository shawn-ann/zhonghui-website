import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: '媒体', plural: '媒体' },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: 'media',
    // SVG is allowed for icons. Scripts inside SVG do not execute when the file
    // is referenced via <img>, which is how icons are rendered on the site.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  },
  fields: [{ name: 'alt', type: 'text', required: true }],
}

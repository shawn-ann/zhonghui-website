import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: '用户', plural: '用户' },
  auth: { maxLoginAttempts: 0 },
  admin: { useAsTitle: 'email' },
  fields: [],
}

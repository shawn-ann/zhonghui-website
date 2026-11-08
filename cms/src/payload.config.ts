import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { zh } from '@payloadcms/translations/languages/zh'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { CaseCategories } from './collections/CaseCategories'
import { Cases } from './collections/Cases'
import { CaseRedirects } from './collections/CaseRedirects'
import { Menu } from './globals/Menu'
import { SiteSettings } from './globals/SiteSettings'
import { getBuildStatus, startBuild } from './build/manager'
import { getRebuildSchedulerState, resetPendingRebuild } from './build/scheduler'

const srcDir = path.resolve(process.cwd(), 'src')

const secret = process.env.PAYLOAD_SECRET
const databaseUrl = process.env.DATABASE_URL
if (!secret) throw new Error('PAYLOAD_SECRET is required')
if (!databaseUrl) throw new Error('DATABASE_URL is required')

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: srcDir,
    },
    meta: {
      titleSuffix: ' · 中惠文化管理后台',
      description: '中惠文化官网管理后台',
      icons: [{ rel: 'icon', type: 'image/jpeg', url: '/favicon.jpg' }],
    },
    timezones: { defaultTimezone: 'Asia/Shanghai' },
    dateFormat: 'yyyy/MM/dd HH:mm:ss',
    components: {
      Nav: '/components/admin/AdminNav',
      header: ['/components/admin/AdminMobileBar'],
      views: {
        dashboard: { Component: '/components/admin/DashboardRedirect' },
      },
      graphics: {
        Logo: '/components/Logo',
        Icon: '/components/Icon',
      },
    },
  },
  i18n: {
    supportedLanguages: { zh },
    fallbackLanguage: 'zh',
  },
  collections: [Users, Media, Pages, CaseCategories, Cases, CaseRedirects],
  globals: [Menu, SiteSettings],
  endpoints: [
    {
      path: '/rebuild',
      method: 'get',
      handler: async (req) => {
        const { user } = await req.payload.auth({ headers: req.headers })
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        return Response.json({ ...(await getBuildStatus()), ...getRebuildSchedulerState() })
      },
    },
    {
      path: '/rebuild',
      method: 'post',
      handler: async (req) => {
        const { user } = await req.payload.auth({ headers: req.headers })
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const result = await startBuild()
        if (result.started) resetPendingRebuild()
        return Response.json({ ...result.status, ...getRebuildSchedulerState() }, { status: result.started ? 202 : 409 })
      },
    },
  ],
  editor: lexicalEditor(),
  secret,
  typescript: {
    outputFile: path.resolve(srcDir, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: databaseUrl,
    },
  }),
  sharp,
  plugins: [],
})

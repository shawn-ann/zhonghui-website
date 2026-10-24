import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { zh } from '@payloadcms/translations/languages/zh'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { getBuildStatus, startBuild } from './build/manager'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const secret = process.env.PAYLOAD_SECRET
const databaseUrl = process.env.DATABASE_URL
if (!secret) throw new Error('PAYLOAD_SECRET is required')
if (!databaseUrl) throw new Error('DATABASE_URL is required')

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · 中惠文化管理后台',
      description: '中惠文化官网管理后台',
      icons: [{ rel: 'icon', type: 'image/jpeg', url: '/favicon.jpg' }],
    },
    components: {
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
  collections: [Users, Media, Pages],
  endpoints: [
    {
      path: '/rebuild',
      method: 'get',
      handler: async (req) => {
        const { user } = await req.payload.auth({ headers: req.headers })
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        return Response.json(getBuildStatus())
      },
    },
    {
      path: '/rebuild',
      method: 'post',
      handler: async (req) => {
        const { user } = await req.payload.auth({ headers: req.headers })
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const result = startBuild()
        return Response.json(result.status, { status: result.started ? 202 : 409 })
      },
    },
  ],
  editor: lexicalEditor(),
  secret,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: databaseUrl,
    },
  }),
  sharp,
  plugins: [],
})

import 'dotenv/config'

process.env.DISABLE_AUTO_REBUILD = '1'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const media = await payload.find({
  collection: 'media',
  where: { filename: { equals: 'test.png' } },
  limit: 1,
  depth: 0,
})
const qr = media.docs[0] as any
if (!qr) throw new Error('媒体库中未找到二维码 test.png')

const current: any = await payload.findGlobal({ slug: 'site-settings', depth: 1 })
const footerQr = (current.footerQr || []).map((item: any) => ({
  label: item.label,
  image: qr.id,
}))

await payload.updateGlobal({
  slug: 'site-settings',
  data: {
    footerQr,
    copyright: '',
    langOtherUrl: '',
  },
})

console.log(JSON.stringify({ qr: qr.id, footerQr: footerQr.map((q: any) => q.label), copyright: '', langOtherUrl: '' }, null, 2))
process.exit(0)

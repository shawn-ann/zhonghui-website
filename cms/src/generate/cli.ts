import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { loadSiteData } from './loadSiteData'
import { buildRelease } from './release'

async function main() {
  console.time('payload-init')
  const payload = await getPayload({ config })
  console.timeEnd('payload-init')
  console.time('load-data')
  const data = await loadSiteData(payload as any)
  console.timeEnd('load-data')
  console.time('build-release')
  const result = buildRelease(data)
  console.timeEnd('build-release')
  console.log(`Generated ${result.pages} pages -> ${result.outDir}`)
  await payload.destroy()
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })

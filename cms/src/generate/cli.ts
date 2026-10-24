import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { loadSiteData } from './loadSiteData'
import { buildRelease } from './release'

async function main() {
  const payload = await getPayload({ config })
  const data = await loadSiteData(payload as any)
  const result = buildRelease(data)
  console.log(`Generated ${result.pages} pages -> ${result.outDir}`)
  await payload.destroy()
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })

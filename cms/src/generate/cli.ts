import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import path from 'path'
import { fileURLToPath } from 'url'
import { rmSync } from 'fs'
import { loadSiteData } from './loadSiteData'
import { generateSite } from './buildSite'
import { writeSite } from './writeSite'
import { collectMediaUrls, copyMedia } from './media'

const dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const payload = await getPayload({ config })
  const data = await loadSiteData(payload as any)
  const outDir = path.resolve(dirname, '../../dist')
  const files = generateSite(data)
  rmSync(outDir, { recursive: true, force: true })
  writeSite(files, outDir)
  const mediaDir = path.resolve(dirname, '../../media')
  copyMedia(collectMediaUrls(data), mediaDir, outDir)
  console.log(`Generated ${data.pages.length} pages -> ${outDir}`)
  await payload.destroy()
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })

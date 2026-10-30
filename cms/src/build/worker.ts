import http from 'http'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../payload.config'
import { loadSiteData } from '../generate/loadSiteData'
import { buildRelease } from '../generate/release'

interface Status {
  status: 'idle' | 'building' | 'success' | 'error'
  startedAt?: string
  finishedAt?: string
  pages?: number
  error?: string
  logTail?: string
}

const cmsDir = process.cwd()
const releasesDir = process.env.SITE_RELEASES_DIR
  ? path.resolve(process.env.SITE_RELEASES_DIR)
  : path.join(cmsDir, 'releases')
const statusPath = path.join(releasesDir, '.build-status.json')
const logPath = path.join(releasesDir, '.build.log')
const port = Number(process.env.BUILDER_PORT || 4000)

let status: Status = { status: 'idle' }
let building = false
let client: Promise<any> | null = null

function tail(): string {
  try {
    return fs.readFileSync(logPath, 'utf8').slice(-4000)
  } catch {
    return ''
  }
}

function persist() {
  fs.mkdirSync(releasesDir, { recursive: true })
  status = { ...status, logTail: tail() }
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2))
}

function log(line: string) {
  fs.mkdirSync(releasesDir, { recursive: true })
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${line}\n`)
}

fs.mkdirSync(releasesDir, { recursive: true })
fs.writeFileSync(logPath, '')
persist()

async function getClient() {
  if (!client) {
    client = getPayload({ config }).catch((err) => {
      client = null
      throw err
    })
  }
  return client
}

async function runBuild(): Promise<Status> {
  if (building) return status
  building = true
  fs.mkdirSync(releasesDir, { recursive: true })
  fs.writeFileSync(logPath, '')
  const startedAt = new Date().toISOString()
  status = { status: 'building', startedAt }
  persist()

  try {
    let t = Date.now()
    const payload = await getClient()
    log(`payload ready ${Date.now() - t}ms`)

    t = Date.now()
    const data = await loadSiteData(payload as any)
    log(`data ${Date.now() - t}ms pages=${data.pages.length}`)

    t = Date.now()
    const result = buildRelease(data)
    log(`build ${Date.now() - t}ms -> ${result.outDir}`)

    status = {
      status: 'success',
      startedAt,
      finishedAt: new Date().toISOString(),
      pages: result.pages,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log(`ERROR ${message}`)
    status = {
      status: 'error',
      startedAt,
      finishedAt: new Date().toISOString(),
      error: message,
    }
  } finally {
    building = false
    persist()
  }
  return status
}

const server = http.createServer((req, res) => {
  res.setHeader('content-type', 'application/json; charset=utf-8')
  if (req.method === 'GET' && req.url === '/status') {
    res.statusCode = 200
    res.end(JSON.stringify({ ...status, logTail: tail() }))
    return
  }
  if (req.method === 'POST' && req.url === '/build') {
    if (building || status.status === 'building') {
      res.statusCode = 409
      res.end(JSON.stringify({ ...status, logTail: tail() }))
      return
    }
    void runBuild()
    res.statusCode = 202
    res.end(JSON.stringify({ ...status, logTail: tail() }))
    return
  }
  res.statusCode = 404
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(port, '0.0.0.0', () => {
  log(`builder listening on :${port}`)
  // 预热 Payload，避免第一次发布等待初始化。
  void getClient()
    .then(() => log('payload prewarmed'))
    .catch((err) => log(`payload prewarm failed: ${err instanceof Error ? err.message : err}`))
})

async function shutdown() {
  server.close()
  try {
    const payload = await client
    await payload?.destroy?.()
  } catch { /* noop */ }
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

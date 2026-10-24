import { spawn, type ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'

const cmsDir = process.cwd()
const releasesDir = process.env.SITE_RELEASES_DIR
  ? path.resolve(process.env.SITE_RELEASES_DIR)
  : path.join(cmsDir, 'releases')
const statusPath = path.join(releasesDir, '.build-status.json')
const logPath = path.join(releasesDir, '.build.log')

export interface BuildStatus {
  status: 'idle' | 'building' | 'success' | 'error'
  startedAt?: string
  finishedAt?: string
  pid?: number
  exitCode?: number | null
  error?: string
  logTail?: string
}

let running = false
let child: ChildProcess | null = null

function writeStatus(status: BuildStatus) {
  fs.mkdirSync(releasesDir, { recursive: true })
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2))
}

function readStatus(): BuildStatus {
  try {
    return JSON.parse(fs.readFileSync(statusPath, 'utf8')) as BuildStatus
  } catch {
    return { status: 'idle' }
  }
}

function isAlive(pid?: number): boolean {
  if (!pid) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function logTail(size = 4000): string {
  try {
    const raw = fs.readFileSync(logPath, 'utf8').slice(-size)
    return raw.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, '')
  } catch {
    return ''
  }
}

export function getBuildStatus(): BuildStatus {
  const status = readStatus()
  if (status.status === 'building' && !isAlive(status.pid)) {
    const next: BuildStatus = {
      ...status,
      status: 'error',
      error: '构建进程已退出',
      finishedAt: new Date().toISOString(),
      logTail: logTail(),
    }
    writeStatus(next)
    return next
  }
  return status
}

export function startBuild(): { started: boolean; status: BuildStatus } {
  const current = getBuildStatus()
  if (current.status === 'building' || running) return { started: false, status: current }

  fs.mkdirSync(releasesDir, { recursive: true })
  const startedAt = new Date().toISOString()
  writeStatus({ status: 'building', startedAt, logTail: '' })

  const localTsx = path.join(cmsDir, 'node_modules/.bin/tsx')
  const useLocal = fs.existsSync(localTsx)
  const bin = useLocal ? localTsx : 'npx'
  const args = useLocal ? ['src/generate/cli.ts'] : ['tsx', 'src/generate/cli.ts']

  const log = fs.createWriteStream(logPath, { flags: 'w' })
  child = spawn(bin, args, {
    cwd: cmsDir,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  running = true
  writeStatus({ status: 'building', startedAt, pid: child.pid, logTail: '' })

  child.stdout?.pipe(log)
  child.stderr?.pipe(log)

  child.on('close', (code) => {
    running = false
    child = null
    writeStatus({
      status: code === 0 ? 'success' : 'error',
      startedAt,
      finishedAt: new Date().toISOString(),
      exitCode: code,
      ...(code === 0 ? {} : { error: `构建失败，退出码 ${code}` }),
      logTail: logTail(),
    })
  })

  child.on('error', (err) => {
    running = false
    child = null
    writeStatus({
      status: 'error',
      startedAt,
      finishedAt: new Date().toISOString(),
      error: err.message,
      logTail: logTail(),
    })
  })

  return { started: true, status: getBuildStatus() }
}

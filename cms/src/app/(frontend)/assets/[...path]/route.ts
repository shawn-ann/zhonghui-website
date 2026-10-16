import { readFileSync, statSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const MAP: Record<string, string> = {
  'style.css': 'src/render/styles/base.css',
  'main.js': 'src/render/styles/main.js',
}

const TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
}

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params
  const rel = parts.join('/')
  const target = MAP[rel] ?? `src/static/${rel}`
  const abs = path.resolve(process.cwd(), target)
  const allowedRoots = [
    path.resolve(process.cwd(), 'src/static'),
    path.resolve(process.cwd(), 'src/render/styles'),
  ]
  if (!allowedRoots.some((r) => abs === r || abs.startsWith(r + path.sep))) {
    return new Response('Forbidden', { status: 403 })
  }
  let stat
  try {
    stat = statSync(abs)
  } catch {
    return new Response('Not found', { status: 404 })
  }
  if (!stat.isFile()) return new Response('Not found', { status: 404 })
  const type = TYPES[path.extname(abs)] ?? 'application/octet-stream'
  return new Response(readFileSync(abs), { headers: { 'content-type': type } })
}

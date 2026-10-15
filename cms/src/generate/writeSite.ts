import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'

export function writeSite(files: Map<string, string>, outDir: string): void {
  const root = path.resolve(outDir)
  for (const [rel, content] of files) {
    const full = path.resolve(path.join(outDir, rel))
    if (full !== root && !full.startsWith(root + path.sep)) {
      throw new Error(`refusing to write outside outDir: ${rel}`)
    }
    mkdirSync(path.dirname(full), { recursive: true })
    writeFileSync(full, content)
  }
}

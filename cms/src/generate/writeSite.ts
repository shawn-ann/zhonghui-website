import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'

export function writeSite(files: Map<string, string>, outDir: string): void {
  for (const [rel, content] of files) {
    const full = path.join(outDir, rel)
    mkdirSync(path.dirname(full), { recursive: true })
    writeFileSync(full, content)
  }
}

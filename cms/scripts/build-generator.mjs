import { build } from 'esbuild'

const common = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  packages: 'external',
  sourcemap: false,
  logLevel: 'info',
}

await build({ ...common, entryPoints: ['src/generate/cli.ts'], outfile: 'generator/generate.mjs' })
await build({ ...common, entryPoints: ['src/build/worker.ts'], outfile: 'generator/builder.mjs' })

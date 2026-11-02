const MIN_COLUMNS = 1
const MAX_COLUMNS = 5

export function clampColumns(columns: unknown): number {
  const value = Math.trunc(Number(columns) || 1)
  return Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, value))
}

export function defaultColumnRatio(columns: unknown): string {
  return Array.from({ length: clampColumns(columns) }, () => '1').join(':')
}

export function parseColumnRatio(value: unknown, columns: unknown): number[] | null {
  if (typeof value !== 'string') return null
  const count = clampColumns(columns)
  const parts = value.split(':').map((part) => part.trim())
  if (parts.length !== count || !parts.every((part) => /^\d+$/.test(part))) return null
  const numbers = parts.map(Number)
  if (numbers.some((number) => !Number.isSafeInteger(number) || number <= 0)) return null
  return numbers
}

export function normalizeColumnRatio(value: unknown, columns: unknown): string {
  const count = clampColumns(columns)
  if (value === 'equal') return defaultColumnRatio(count)
  if (value === 'leftNarrow' && count === 2) return '2:3'
  if (value === 'leftWide' && count === 2) return '3:2'
  const numbers = parseColumnRatio(value, count)
  return numbers ? numbers.join(':') : defaultColumnRatio(count)
}

export function ratioToGridTemplate(value: unknown, columns: unknown): string | undefined {
  const numbers = parseColumnRatio(value, columns)
  return numbers ? numbers.map((number) => `${number}fr`).join(' ') : undefined
}

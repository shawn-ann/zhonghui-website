import { beijingDayStart } from '../lib/datetime'

export function resolvePublishedAt(input: {
  operation: 'create' | 'update'
  current?: string | null
  incoming?: string | null
  createdAt?: string | null
  now?: Date
}): string {
  const { operation, current, incoming, createdAt, now } = input
  if (current) return String(current)
  if (operation === 'update') {
    return beijingDayStart(createdAt ?? now ?? new Date())
  }
  return incoming ? String(incoming) : beijingDayStart(now ?? new Date())
}

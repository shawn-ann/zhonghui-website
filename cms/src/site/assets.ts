import { safeUrl } from '../render/primitives'

export function hrefOf(link?: string): string {
  return safeUrl(link) || '#'
}

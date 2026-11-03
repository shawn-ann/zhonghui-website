export const RESERVED_SLUGS = new Set(['page', 'blog'])
export const SLUG_PATTERN = /^[a-z0-9-]+$/

export interface SlugValidationOptions {
  optional?: boolean
  reserved?: Set<string>
}

/** 分类与案例共用的 slug 校验；错误信息直接显示在 Payload 字段下。 */
export function validateCaseSlug(value: unknown, options: SlugValidationOptions = {}): true | string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return options.optional ? true : 'slug 必填'
  if (!SLUG_PATTERN.test(raw)) return 'slug 只能使用小写字母、数字和连字符'
  const reserved = options.reserved ?? RESERVED_SLUGS
  if (reserved.has(raw)) return 'slug 不能使用保留字 page/blog'
  return true
}

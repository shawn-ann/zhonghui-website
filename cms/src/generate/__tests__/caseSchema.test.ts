import { describe, expect, it } from 'vitest'
import { RESERVED_SLUGS, validateCaseSlug } from '../../collections/caseSlug'

describe('case slug validation', () => {
  it('accepts lowercase kebab-case', () => {
    expect(validateCaseSlug('study-case')).toBe(true)
    expect(validateCaseSlug('xiaocao-2025')).toBe(true)
  })

  it('rejects uppercase and invalid characters', () => {
    expect(validateCaseSlug('Page')).toBe('slug 只能使用小写字母、数字和连字符')
    expect(validateCaseSlug('中文')).toBe('slug 只能使用小写字母、数字和连字符')
    expect(validateCaseSlug('a b')).toBe('slug 只能使用小写字母、数字和连字符')
  })

  it('rejects reserved words and empty values', () => {
    expect(validateCaseSlug('page')).toBe('slug 不能使用保留字 page/blog')
    expect(validateCaseSlug('blog')).toBe('slug 不能使用保留字 page/blog')
    expect(validateCaseSlug('')).toBe('slug 必填')
    expect(validateCaseSlug(undefined)).toBe('slug 必填')
  })

  it('allows an empty optional value only when explicitly permitted', () => {
    expect(validateCaseSlug('', { optional: true })).toBe(true)
    expect(RESERVED_SLUGS.has('blog')).toBe(true)
  })
})

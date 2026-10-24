import { describe, expect, it } from 'vitest'
import { adminHtmlClasses, isAdminShellPath, isCustomAdminViewPath } from '../adminRoute'

describe('adminRoute', () => {
  it('marks authenticated admin pages as admin shell', () => {
    expect(isAdminShellPath('/admin/collections/pages')).toBe(true)
    expect(isAdminShellPath('/admin/globals/site-settings')).toBe(true)
    expect(isAdminShellPath('/admin/account')).toBe(true)
  })

  it('excludes auth and editor pages from the shell', () => {
    expect(isAdminShellPath('/admin/login')).toBe(false)
    expect(isAdminShellPath('/admin/forgot')).toBe(false)
    expect(isAdminShellPath('/admin/reset')).toBe(false)
    expect(isAdminShellPath('/admin/collections/pages/44')).toBe(false)
  })

  it('detects custom pages that provide their own header', () => {
    expect(isCustomAdminViewPath('/admin/collections/pages')).toBe(true)
    expect(isCustomAdminViewPath('/admin/collections/pages/')).toBe(true)
    expect(isCustomAdminViewPath('/admin/globals/menu')).toBe(true)
    expect(isCustomAdminViewPath('/admin/globals/site-settings')).toBe(true)
    expect(isCustomAdminViewPath('/admin/collections/media')).toBe(false)
  })

  it('builds html classes for server and client rendering', () => {
    expect(adminHtmlClasses('/admin/globals/menu')).toBe('admin-shell admin-custom-page')
    expect(adminHtmlClasses('/admin/collections/pages/44')).toBe('ed-route')
    expect(adminHtmlClasses('/admin/login')).toBe('')
  })
})

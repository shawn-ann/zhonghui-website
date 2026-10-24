import { isEditorPath } from './editorRoute'

const AUTH_PATH = /^\/admin\/(login|forgot|reset|logout)(?:\/|$)/
const CUSTOM_VIEW_PATHS = [
  /^\/admin\/collections\/pages\/?$/,
  /^\/admin\/globals\/(menu|site-settings)\/?$/,
]

function normalize(pathname?: string | null): string {
  return (pathname || '').replace(/\/+$/, '') || '/'
}

export function isAdminShellPath(pathname?: string | null): boolean {
  const path = normalize(pathname)
  return path.startsWith('/admin') && !AUTH_PATH.test(path) && !isEditorPath(path)
}

export function isCustomAdminViewPath(pathname?: string | null): boolean {
  const path = normalize(pathname)
  return CUSTOM_VIEW_PATHS.some((pattern) => pattern.test(path))
}

export function adminHtmlClasses(pathname?: string | null): string {
  const classes: string[] = []
  if (isEditorPath(pathname)) classes.push('ed-route')
  if (isAdminShellPath(pathname)) classes.push('admin-shell')
  if (isCustomAdminViewPath(pathname)) classes.push('admin-custom-page')
  return classes.join(' ')
}

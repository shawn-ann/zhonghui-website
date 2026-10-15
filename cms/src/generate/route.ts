export function routeToFile(route: string): string {
  const clean = route.trim().replace(/^\/+/, '').replace(/\/+$/, '')
  if (clean === '') return 'index.html'
  const segments = clean.split('/')
  if (segments.some((s) => s === '' || s === '.' || s === '..')) {
    throw new Error(`invalid route: ${route}`)
  }
  return `${clean}/index.html`
}

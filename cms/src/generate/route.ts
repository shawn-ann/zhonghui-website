export function routeToFile(route: string): string {
  const clean = route.trim().replace(/^\/+/, '').replace(/\/+$/, '')
  return clean === '' ? 'index.html' : `${clean}/index.html`
}

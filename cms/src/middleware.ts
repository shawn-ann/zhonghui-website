import { NextResponse, type NextRequest } from 'next/server'

// 把当前路径透传给服务端布局，用于首屏就决定是否隐藏 Payload 头部（避免闪烁）。
export function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', req.nextUrl.pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/admin/:path*'],
}

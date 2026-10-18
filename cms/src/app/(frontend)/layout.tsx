import React from 'react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/assets/swiper-bundle.min.css" />
        <link rel="stylesheet" href="/assets/style.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}

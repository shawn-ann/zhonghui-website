/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import { headers } from 'next/headers'
import React from 'react'

import { importMap } from './admin/importMap.js'
import RouteSync from '@/components/RouteSync'
import { isEditorPath } from '@/lib/editorRoute'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = async ({ children }: Args) => {
  const h = await headers()
  const isEditor = isEditorPath(h.get('x-pathname'))
  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunction}
      htmlProps={isEditor ? { className: 'ed-route' } : undefined}
    >
      <RouteSync />
      {children}
    </RootLayout>
  )
}

export default Layout

'use client'
import { useEffect } from 'react'

export default function PreviewSync({ id }: { id: string }) {
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel('zhonghui-preview')
    channel.onmessage = (event) => {
      if (event.data?.type === 'page-saved' && String(event.data.id) === String(id)) {
        window.location.reload()
      }
    }
    return () => channel.close()
  }, [id])
  return null
}

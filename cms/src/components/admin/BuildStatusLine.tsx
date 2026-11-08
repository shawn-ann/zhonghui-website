'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { formatBeijingTime } from '../../lib/datetime'

interface BuildState {
  status?: string
  pending?: boolean
  finishedAt?: string
  error?: string
}

export default function BuildStatusLine() {
  const [state, setState] = useState<BuildState | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/rebuild', { credentials: 'include', cache: 'no-store' })
      if (res.ok) setState(await res.json())
    } catch {
      // 状态读取失败不阻塞后台
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => { void load() }, 5000)
    return () => window.clearInterval(timer)
  }, [load])

  const publish = async () => {
    if (busy) return
    setBusy(true)
    try {
      await fetch('/api/rebuild', { method: 'POST', credentials: 'include' })
      await load()
    } finally {
      setBusy(false)
    }
  }

  const building = state?.status === 'building'
  const error = state?.status === 'error'
  const label = !state
    ? '检查发布状态…'
    : building
      ? '正在发布…'
      : state.pending
        ? '有更改待发布'
        : error
          ? '发布失败'
          : state.status === 'success'
            ? `已发布 ${state.finishedAt ? formatBeijingTime(state.finishedAt).slice(5, 16) : ''}`
            : '尚未发布'
  const tone = error ? 'is-error' : building || state?.pending ? 'is-pending' : state?.status === 'success' ? 'is-ok' : ''

  return (
    <div className={`zc-build-status ${tone}`} title={error ? state?.error : label}>
      <span className="zc-build-dot" />
      <span className="zc-build-label">{label}</span>
      <button type="button" disabled={busy || building} onClick={() => void publish()} title="立即发布">
        {busy || building ? '…' : '发布'}
      </button>
    </div>
  )
}

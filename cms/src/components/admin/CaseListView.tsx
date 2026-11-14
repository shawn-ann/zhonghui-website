'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { AdminPageHeader } from './AdminPageHeader'
import { formatBeijingTime } from '../../lib/datetime'
import './category-list.css'
import './case-list.css'

interface CaseRow {
  id: number | string
  title: string
  slug?: string
  category?: number | string | { id: number | string; title?: string; slug?: string }
  publishedAt?: string
  _status?: 'draft' | 'published'
}

async function errorDetail(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => null)
  const first = data?.errors?.[0]
  const nested = first?.data?.errors?.[0]
  const detail = nested?.message || first?.message || data?.message || data?.error
  return detail ? `${fallback}：${detail}` : `${fallback}：${res.status}`
}

function categoryTitle(row: CaseRow): string {
  if (!row.category) return '—'
  if (typeof row.category === 'object') return row.category.title || row.category.slug || '—'
  return String(row.category)
}

export default function CaseListView() {
  const [rows, setRows] = useState<CaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [deletingId, setDeletingId] = useState<number | string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/cases?limit=200&depth=1&draft=true&sort=-publishedAt', { credentials: 'include' })
      if (!res.ok) throw new Error(await errorDetail(res, '加载失败'))
      const data = await res.json()
      setRows(data.docs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const remove = async (row: CaseRow) => {
    if (deletingId != null) return
    if (!window.confirm(`确定删除文章「${row.title}」？`)) return
    setDeletingId(row.id)
    setError('')
    try {
      const res = await fetch(`/api/cases/${row.id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error(await errorDetail(res, '删除失败'))
      setRows((current) => current.filter((item) => item.id !== row.id))
      setToast('文章已删除')
      window.setTimeout(() => setToast(''), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="zc-page">
      {toast ? <div className="zc-toast">{toast}</div> : null}
      <AdminPageHeader
        breadcrumbs={[
          { label: '首页', href: '/admin/collections/pages' },
          { label: '文章列表' },
        ]}
        title="文章列表"
        description="管理案例文章的分类、封面、正文与发布状态。"
        actions={<>
          <a className="zc-btn secondary" href="/admin/tutorial#articles">查看教程</a>
          <a className="zc-btn" href="/admin/collections/cases/create">新建文章</a>
        </>}
      />

      {error ? <p className="zc-error" style={{ marginBottom: 12 }}>{error}</p> : null}
      {loading ? <p className="zc-muted">加载中…</p> : null}

      {!loading ? (
        <div className="zc-table-card">
          <div className="zc-table-scroll">
            <table className="zc-table">
              <thead>
                <tr>
                  <th>文章标题</th>
                  <th>分类</th>
                  <th>发布日期</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={5} className="zc-muted">暂无文章</td></tr>
                ) : rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{categoryTitle(row)}</td>
                    <td>{row.publishedAt ? formatBeijingTime(row.publishedAt) : '—'}</td>
                    <td>
                      <span className={`case-list-status is-${row._status || 'draft'}`}>
                        {row._status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td>
                      <div className="zc-row-actions">
                        <a href={`/admin/collections/cases/${row.id}`}>编辑</a>
                        <a href={`/preview/cases/${row.id}`} target="_blank" rel="noreferrer">预览</a>
                        <button
                          type="button"
                          className="is-danger"
                          disabled={deletingId === row.id}
                          onClick={() => void remove(row)}
                        >
                          {deletingId === row.id ? '删除中…' : '删除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}

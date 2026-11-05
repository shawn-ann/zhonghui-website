'use client'
import React, { useCallback, useEffect, useState } from 'react'
import MediaModal from '../../editor/MediaModal'
import '../../editor/editor.css'
import type { MediaItem } from '../../editor/api'
import { AdminPageHeader } from './AdminPageHeader'
import './category-list.css'

interface CategoryRow {
  id: number | string
  title: string
  slug: string
  subtitle?: string
  pageSize?: number
  banner?: number | string | { id: number | string; url?: string } | null
}

interface CategoryForm {
  id?: number | string
  title: string
  slug: string
  subtitle: string
  pageSize: number
  bannerId?: number | string
  bannerUrl?: string
}

const emptyForm: CategoryForm = {
  title: '', slug: '', subtitle: '', pageSize: 12,
}

const bannerId = (banner: CategoryRow['banner']): number | string | undefined =>
  banner && typeof banner === 'object' ? banner.id : banner ?? undefined
const bannerUrl = (banner: CategoryRow['banner']): string | undefined =>
  banner && typeof banner === 'object' ? banner.url : undefined

export default function CategoryListView() {
  const [rows, setRows] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CategoryForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/case-categories?limit=200&depth=1', { credentials: 'include' })
      if (!res.ok) throw new Error(`加载失败：${res.status}`)
      const data = await res.json()
      setRows(data.docs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!form) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (mediaOpen) setMediaOpen(false)
      else setForm(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [form, mediaOpen])

  const openCreate = () => setForm({ ...emptyForm })
  const openEdit = (row: CategoryRow) => setForm({
    id: row.id,
    title: row.title || '',
    slug: row.slug || '',
    subtitle: row.subtitle || '',
    pageSize: Number(row.pageSize) || 12,
    bannerId: bannerId(row.banner),
    bannerUrl: bannerUrl(row.banner),
  })

  const patch = (values: Partial<CategoryForm>) => setForm((current) => current ? { ...current, ...values } : current)

  const save = async () => {
    if (!form) return
    const title = form.title.trim()
    const slug = form.slug.trim()
    if (!title) { setError('请填写分类名称'); return }
    if (!/^[a-z0-9-]+$/.test(slug)) { setError('URL 别名只能使用小写字母、数字和连字符'); return }
    setSaving(true)
    setError('')
    try {
      const body = {
        title,
        slug,
        subtitle: form.subtitle,
        pageSize: Number(form.pageSize) || 12,
        banner: form.bannerId ?? null,
      }
      const res = await fetch(
        form.id != null ? `/api/case-categories/${form.id}` : '/api/case-categories',
        {
          method: form.id != null ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || `保存失败：${res.status}`)
      }
      setToast('已保存')
      setForm(null)
      await load()
      window.setTimeout(() => setToast(''), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: CategoryRow) => {
    if (!window.confirm(`确定删除分类「${row.title}」？`)) return
    setError('')
    try {
      const res = await fetch(`/api/case-categories/${row.id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || `删除失败：${res.status}`)
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="zc-page">
      {toast ? <div className="zc-toast">{toast}</div> : null}
      <AdminPageHeader
        breadcrumbs={[
          { label: '首页', href: '/admin/collections/pages' },
          { label: '分类管理' },
        ]}
        title="分类管理"
        description="先维护分类，再到文章列表创建内容。点击分类右侧「编辑」在抽屉中修改。"
        actions={<button type="button" className="zc-btn" onClick={openCreate}>新建分类</button>}
      />

      {error && !form ? <p className="zc-error" style={{ marginBottom: 12 }}>{error}</p> : null}
      {loading ? <p className="zc-muted">加载中…</p> : null}

      {!loading ? (
        <div className="zc-table-card">
          <div className="zc-table-scroll">
            <table className="zc-table">
              <thead>
                <tr><th>分类名称</th><th>URL 别名</th><th>每页文章数</th><th>操作</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={4} className="zc-muted">暂无分类</td></tr>
                ) : rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td><code>{row.slug}</code></td>
                    <td>{row.pageSize ?? 12}</td>
                    <td>
                      <div className="zc-row-actions">
                        <button type="button" onClick={() => openEdit(row)}>编辑</button>
                        <a href={`/preview/case-categories/${row.id}`} target="_blank" rel="noreferrer">预览</a>
                        <button type="button" className="is-danger" onClick={() => void remove(row)}>删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {form ? (
        <div className={`zc-drawer-overlay${mediaOpen ? ' has-modal' : ''}`} onClick={() => { if (!mediaOpen) setForm(null) }}>
          <aside className="zc-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="zc-drawer-head">
              <div>
                <h2>{form.id != null ? '编辑分类' : '新建分类'}</h2>
                <p>分类信息与列表页外观</p>
              </div>
              <button type="button" aria-label="关闭" onClick={() => setForm(null)}>✕</button>
            </div>

            <div className="zc-drawer-body">
              <label className="zc-field">
                <span>分类名称</span>
                <input value={form.title} onChange={(e) => patch({ title: e.target.value })} placeholder="如：案例分享" />
              </label>
              <label className="zc-field">
                <span>URL 别名</span>
                <input value={form.slug} onChange={(e) => patch({ slug: e.target.value })} placeholder="study-case" />
                <small>分类链接的最后一段，只能使用小写字母、数字和连字符。</small>
              </label>
              <label className="zc-field">
                <span>分类页副标题</span>
                <textarea value={form.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} rows={3} />
              </label>

              <div className="zc-field">
                <span>分类页 Banner</span>
                <div className="zc-banner-picker">
                  <div className="zc-banner-preview">
                    {form.bannerUrl ? <img src={form.bannerUrl} alt="" /> : <span>未选择图片</span>}
                  </div>
                  <div className="zc-banner-actions">
                    <button type="button" className="zc-btn secondary" onClick={() => setMediaOpen(true)}>选择图片</button>
                    {form.bannerId != null ? (
                      <button type="button" className="zc-btn secondary" onClick={() => patch({ bannerId: undefined, bannerUrl: undefined })}>移除</button>
                    ) : null}
                  </div>
                </div>
              </div>

              <label className="zc-field">
                <span>每页文章数</span>
                <input
                  type="number"
                  min={1}
                  max={48}
                  value={form.pageSize}
                  onChange={(e) => patch({ pageSize: Number(e.target.value) || 1 })}
                />
              </label>

              {error ? <p className="zc-error">{error}</p> : null}
            </div>

            <div className="zc-drawer-foot">
              {form.id != null ? (
                <a className="zc-btn secondary" href={`/preview/case-categories/${form.id}`} target="_blank" rel="noreferrer">预览列表页</a>
              ) : <span />}
              <div>
                <button type="button" className="zc-btn secondary" onClick={() => setForm(null)}>取消</button>
                <button type="button" className="zc-btn" disabled={saving} onClick={() => void save()}>{saving ? '保存中…' : '保存'}</button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {mediaOpen ? (
        <MediaModal
          title="选择分类 Banner"
          onClose={() => setMediaOpen(false)}
          onSelect={(item: MediaItem) => {
            patch({ bannerId: item.id, bannerUrl: item.url })
            setMediaOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

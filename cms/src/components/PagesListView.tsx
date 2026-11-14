'use client'
import React, { useCallback, useEffect, useState } from 'react'
import './pages-list.css'
import { AdminPageHeader } from './admin/AdminPageHeader'
import { formatBeijingTime } from '../lib/datetime'
import { normalizePageRoute, suggestCopyRoute, withoutBlockIds } from './pageCopy'

interface PageRow {
  id: number | string
  title: string
  route: string
  _status?: 'draft' | 'published'
  updatedAt?: string
}

type ModalState =
  | { mode: 'create'; title: string; route: string }
  | { mode: 'edit'; page: PageRow; title: string; route: string }
  | { mode: 'copy'; page: PageRow; title: string; route: string }
  | null

async function errorDetail(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => null)
  const first = data?.errors?.[0]
  const nested = first?.data?.errors?.[0]
  if (nested?.path === 'route') return `${fallback}：路由已存在，请换一个路径`
  if (nested?.message) return `${fallback}：${nested.path ? `${nested.path}：` : ''}${nested.message}`
  const detail = first?.message || first?.error || data?.message || data?.error
  return detail ? `${fallback}：${detail}` : `${fallback}：${res.status}`
}

export default function PagesListView() {
  const [pages, setPages] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>(null)
  const [saving, setSaving] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)
  const [publishingId, setPublishingId] = useState<number | string | null>(null)
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const notify = (kind: 'success' | 'error', text: string) => {
    setToast({ kind, text })
    window.setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pages?limit=200&depth=0&draft=true', { credentials: 'include' })
      if (!res.ok) throw new Error(await errorDetail(res, '加载失败'))
      const data = await res.json()
      setPages(data.docs as PageRow[])
    } catch (e) {
      notify('error', e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const saveModal = async () => {
    if (!modal || saving) return
    const title = modal.title.trim()
    const route = normalizePageRoute(modal.route)
    if (!title) { notify('error', '标题不能为空'); return }
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        const res = await fetch('/api/pages', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title, route, _status: 'draft' }),
        })
        if (!res.ok) throw new Error(await errorDetail(res, '创建失败'))
        const data = await res.json()
        const id = data.doc?.id ?? data.id
        notify('success', '页面已创建')
        setModal(null)
        if (id) window.location.href = `/admin/collections/pages/${id}`
        else await load()
        return
      }

      if (modal.mode === 'copy') {
        const sourceRes = await fetch(`/api/pages/${modal.page.id}?draft=true&depth=0`, { credentials: 'include' })
        if (!sourceRes.ok) throw new Error(await errorDetail(sourceRes, '读取被复制页面失败'))
        const sourceData = await sourceRes.json()
        const source = sourceData.doc ?? sourceData
        const res = await fetch('/api/pages', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title,
            route,
            blocks: withoutBlockIds(source.blocks ?? []),
            _status: 'draft',
          }),
        })
        if (!res.ok) throw new Error(await errorDetail(res, '复制失败'))
        const data = await res.json()
        const id = data.doc?.id ?? data.id
        notify('success', '页面已复制')
        setModal(null)
        if (id) window.location.href = `/admin/collections/pages/${id}`
        else await load()
        return
      }

      // 同步更新草稿与已发布版本，避免编辑器发布时把元信息改回旧值。
      for (const url of [`/api/pages/${modal.page.id}?draft=true`, `/api/pages/${modal.page.id}`]) {
        const res = await fetch(url, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title, route }),
        })
        if (!res.ok) throw new Error(await errorDetail(res, '保存失败'))
      }
      notify('success', '页面信息已保存')
      setModal(null)
      await load()
    } catch (e) {
      notify('error', e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const rebuildSite = async () => {
    if (rebuilding) return
    setRebuilding(true)
    try {
      const res = await fetch('/api/rebuild', { method: 'POST', credentials: 'include' })
      if (res.status === 401) throw new Error('登录已过期，请重新登录')
      let status = await res.json().catch(() => null)
      for (let i = 0; status?.status === 'building' && i < 120; i++) {
        await new Promise((r) => setTimeout(r, 1000))
        status = await fetch('/api/rebuild', { credentials: 'include' }).then((r) => r.json()).catch(() => null)
      }
      if (status?.status === 'success') notify('success', `站点已重建（${status.pages ?? 1} 个页面）`)
      else throw new Error(status?.error || '构建失败')
    } catch (e) {
      notify('error', `重建失败：${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setRebuilding(false)
    }
  }

  const publishPage = async (page: PageRow) => {
    if (publishingId != null) return
    if (!window.confirm(`确定发布页面「${page.title}」？`)) return
    setPublishingId(page.id)
    try {
      const sourceRes = await fetch(`/api/pages/${page.id}?draft=true&depth=0`, { credentials: 'include' })
      if (!sourceRes.ok) throw new Error(await errorDetail(sourceRes, '读取页面失败'))
      const data = await sourceRes.json()
      const doc = data.doc ?? data
      const res = await fetch(`/api/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: doc.title,
          route: doc.route,
          blocks: doc.blocks ?? [],
          _status: 'published',
        }),
      })
      if (!res.ok) throw new Error(await errorDetail(res, '发布失败'))
      await rebuildSite()
      await load()
    } catch (e) {
      notify('error', e instanceof Error ? e.message : '发布失败')
    } finally {
      setPublishingId(null)
    }
  }

  const removePage = async (page: PageRow) => {
    if (!window.confirm(`确定删除页面「${page.title}」？`)) return
    try {
      const res = await fetch(`/api/pages/${page.id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error(await errorDetail(res, '删除失败'))
      notify('success', '页面已删除')
      await load()
    } catch (e) {
      notify('error', e instanceof Error ? e.message : '删除失败')
    }
  }

  return (
    <div className="pl-wrap">
      {toast ? <div className={`zc-toast${toast.kind === 'error' ? ' is-error' : ''}`}>{toast.text}</div> : null}

      <AdminPageHeader
        breadcrumbs={[{ label: '首页' }]}
        title="页面"
        description="管理站点页面、路由与发布状态。修改后需重建站点使静态站生效。"
        actions={
          <>
            <a className="zc-btn secondary" href="/admin/tutorial#pages">查看教程</a>
            <button type="button" className="zc-btn secondary" disabled={rebuilding} onClick={rebuildSite}>
              {rebuilding ? '构建中…' : '重建站点'}
            </button>
            <button type="button" className="zc-btn" onClick={() => setModal({ mode: 'create', title: '', route: '/' })}>
              新建页面
            </button>
          </>
        }
      />

      {loading ? <p className="pl-muted">加载中…</p> : null}
      {!loading && pages.length === 0 ? <p className="pl-muted">暂无页面</p> : null}

      {!loading && pages.length > 0 ? (
        <div className="zc-table-card">
          <div className="zc-table-scroll">
        <table className="pl-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>路由</th>
              <th>状态</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id}>
                <td>{page.title}</td>
                <td><code>{page.route}</code></td>
                <td>
                  <span className={`pl-status is-${page._status || 'draft'}`}>
                    {page._status === 'published' ? '已发布' : '草稿'}
                  </span>
                </td>
                <td>{page.updatedAt ? formatBeijingTime(page.updatedAt) : '—'}</td>
                <td className="pl-actions">
                  <button type="button" onClick={() => setModal({ mode: 'edit', page, title: page.title, route: page.route })}>编辑</button>
                  <a href={`/admin/collections/pages/${page.id}`}>配置</a>
                  <button type="button" disabled={publishingId === page.id} onClick={() => void publishPage(page)}>
                    {publishingId === page.id ? '发布中…' : '发布'}
                  </button>
                  <button type="button" onClick={() => setModal({
                    mode: 'copy',
                    page,
                    title: `${page.title}（副本）`,
                    route: suggestCopyRoute(page.route, pages),
                  })}>复制</button>
                  <button type="button" className="pl-danger" onClick={() => removePage(page)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        </div>
      ) : null}

      {modal ? (
        <div className="pl-modal" onClick={() => !saving && setModal(null)}>
          <div className="pl-modal-body" onClick={(e) => e.stopPropagation()}>
            <div className="pl-modal-head">
              <h2>{modal.mode === 'create' ? '新建页面' : modal.mode === 'copy' ? '复制页面' : '编辑页面信息'}</h2>
              <button type="button" onClick={() => !saving && setModal(null)}>✕</button>
            </div>
            {modal.mode === 'copy' ? (
              <p className="pl-muted" style={{ margin: '0 0 4px' }}>
                将完整复制「{modal.page.title}」的全部区块内容，新页面保存为草稿。
              </p>
            ) : null}
            <label className="pl-field">
              <span>标题</span>
              <input
                value={modal.title}
                autoFocus
                onChange={(e) => setModal({ ...modal, title: e.target.value })}
              />
            </label>
            <label className="pl-field">
              <span>路由</span>
              <input
                value={modal.route}
                placeholder="/about/"
                onChange={(e) => setModal({ ...modal, route: e.target.value })}
              />
              <small>以 / 开头；保存时会自动补齐结尾的 /。</small>
            </label>
            <div className="pl-modal-actions">
              <button type="button" className="zc-btn secondary" onClick={() => !saving && setModal(null)}>取消</button>
              <button type="button" className="zc-btn" disabled={saving} onClick={saveModal}>
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

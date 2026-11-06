'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatBeijingTime } from '../lib/datetime'
import './menu-editor.css'
import { AdminPageHeader } from './admin/AdminPageHeader'

interface PageOption { id: number | string; title: string; route: string; status?: string }
interface CategoryOption { id: number | string; title: string; slug: string }
type LinkType = 'page' | 'caseCategory' | 'external'
interface MenuItem {
  id?: number | string
  label: string
  linkType: LinkType
  pageId?: number | string
  categoryId?: number | string
  externalUrl?: string
  children: MenuItem[]
}
type ModalState =
  | { mode: 'create'; parent: number | null; index?: number; label: string; linkType: LinkType; pageId?: number | string; categoryId?: number | string; externalUrl?: string }
  | { mode: 'edit'; parent: number | null; index: number; label: string; linkType: LinkType; pageId?: number | string; categoryId?: number | string; externalUrl?: string }
  | null

const relationIdOf = (value: any): number | string | undefined =>
  value && typeof value === 'object' ? value.id : value ?? undefined

const pageIdValue = (value: number | string | undefined) =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value

const linkTypeOf = (i: any): LinkType => {
  if (i?.linkType === 'caseCategory' || i?.linkType === 'external') return i.linkType
  return 'page'
}

function normalizeItems(raw: any): MenuItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((i: any) => ({
    id: i?.id,
    label: String(i?.label ?? ''),
    linkType: linkTypeOf(i),
    pageId: relationIdOf(i?.page),
    categoryId: relationIdOf(i?.caseCategory),
    externalUrl: i?.externalUrl ? String(i.externalUrl) : undefined,
    children: normalizeItems(i?.children),
  }))
}

function itemKey(parent: number | null, index: number) {
  return `${parent ?? 'root'}-${index}`
}

export default function MenuEditorView() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [pages, setPages] = useState<PageOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [savedAt, setSavedAt] = useState('')
  const version = useRef(0)
  const pending = useRef<MenuItem[] | null>(null)
  const inFlight = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [modal, setModal] = useState<ModalState>(null)
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [drag, setDrag] = useState<{ parent: number | null; index: number } | null>(null)
  const [over, setOver] = useState<string | null>(null)

  const notify = (kind: 'success' | 'error', text: string) => {
    setToast({ kind, text })
    window.setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [menuRes, pagesRes, categoriesRes] = await Promise.all([
        fetch('/api/globals/menu?depth=1', { credentials: 'include' }),
        fetch('/api/pages?limit=200&depth=0&draft=true', { credentials: 'include' }),
        fetch('/api/case-categories?limit=200&depth=0', { credentials: 'include' }),
      ])
      if (!menuRes.ok) throw new Error(`加载菜单失败：${menuRes.status}`)
      if (!pagesRes.ok) throw new Error(`加载页面失败：${pagesRes.status}`)
      if (!categoriesRes.ok) throw new Error(`加载文章分类失败：${categoriesRes.status}`)
      const menu = await menuRes.json()
      const pageData = await pagesRes.json()
      const categoryData = await categoriesRes.json()
      setItems(normalizeItems(menu.items))
      setSaveState('idle')
      setPages((pageData.docs || []).map((p: any) => ({
        id: p.id, title: p.title || '', route: p.route || '', status: p._status,
      })))
      setCategories((categoryData.docs || []).map((c: any) => ({
        id: c.id, title: c.title || '', slug: c.slug || '',
      })))
    } catch (e) {
      notify('error', e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const pageMap = useMemo(() => new Map(pages.map((p) => [String(p.id), p])), [pages])
  const categoryMap = useMemo(() => new Map(categories.map((c) => [String(c.id), c])), [categories])

  const linkText = (item: MenuItem): string => {
    if (item.linkType === 'caseCategory') {
      const c = item.categoryId != null ? categoryMap.get(String(item.categoryId)) : undefined
      return c ? `${c.title}（/blog/${c.slug}/）` : '未选择文章分类'
    }
    if (item.linkType === 'external') return item.externalUrl || '未填写外链'
    const p = item.pageId != null ? pageMap.get(String(item.pageId)) : undefined
    return p ? `${p.title}（${p.route}）` : '未选择页面'
  }

  const payloadItem = (it: MenuItem) => ({
    ...(it.id != null ? { id: it.id } : {}),
    label: it.label,
    linkType: it.linkType,
    page: it.linkType === 'page' ? pageIdValue(it.pageId) : null,
    caseCategory: it.linkType === 'caseCategory' ? pageIdValue(it.categoryId) : null,
    externalUrl: it.linkType === 'external' ? it.externalUrl ?? '' : null,
  })

  const buildPayload = (list: MenuItem[]) => list.map((it) => ({
    ...payloadItem(it),
    ...(it.children.length ? { children: it.children.map(payloadItem) } : {}),
  }))

  const flush = async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      while (pending.current) {
        const next = pending.current
        pending.current = null
        const v = version.current
        setSaveState('saving')
        const res = await fetch('/api/globals/menu', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ items: buildPayload(next) }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          const first = data?.errors?.[0]
          throw new Error(first?.message || `保存失败：${res.status}`)
        }
        const data = await res.json()
        const saved = data.result ?? data.doc ?? data
        if (v === version.current) {
          setItems(normalizeItems(saved.items))
          setSavedAt(formatBeijingTime(new Date()))
          setSaveState('saved')
        }
      }
    } catch (e) {
      setSaveState('error')
      notify('error', e instanceof Error ? e.message : '保存失败')
    } finally {
      inFlight.current = false
      if (pending.current) void flush()
    }
  }

  const scheduleSave = (next: MenuItem[]) => {
    version.current += 1
    setItems(next)
    pending.current = next
    setSaveState('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { void flush() }, 400)
  }

  const update = (next: MenuItem[]) => scheduleSave(next)

  const retrySave = () => {
    pending.current = items
    void flush()
  }

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const siblings = (parent: number | null) => (parent == null ? items : items[parent]?.children || [])

  const replaceSiblings = (parent: number | null, next: MenuItem[]) => {
    if (parent == null) update(next)
    else update(items.map((it, i) => (i === parent ? { ...it, children: next } : it)))
  }

  const move = (parent: number | null, from: number, to: number) => {
    const list = siblings(parent)
    if (to < 0 || to >= list.length || from === to) return
    const next = list.slice()
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    replaceSiblings(parent, next)
  }

  const openCreate = (parent: number | null) => setModal({
    mode: 'create', parent, label: '', linkType: 'page', pageId: pages[0]?.id,
  })
  const openEdit = (parent: number | null, index: number) => {
    const item = siblings(parent)[index]
    setModal({
      mode: 'edit', parent, index, label: item.label, linkType: item.linkType,
      pageId: item.pageId, categoryId: item.categoryId, externalUrl: item.externalUrl,
    })
  }

  const saveModal = () => {
    if (!modal) return
    const label = modal.label.trim()
    if (!label) { notify('error', '名称不能为空'); return }
    if (modal.linkType === 'page' && modal.pageId == null) { notify('error', '请选择内部页面'); return }
    if (modal.linkType === 'caseCategory' && modal.categoryId == null) { notify('error', '请选择文章分类'); return }
    if (modal.linkType === 'external' && !modal.externalUrl?.trim()) { notify('error', '请填写外链地址'); return }
    const item: MenuItem = {
      label,
      linkType: modal.linkType,
      pageId: modal.linkType === 'page' ? modal.pageId : undefined,
      categoryId: modal.linkType === 'caseCategory' ? modal.categoryId : undefined,
      externalUrl: modal.linkType === 'external' ? modal.externalUrl?.trim() : undefined,
      children: [],
    }
    if (modal.mode === 'create') {
      const list = siblings(modal.parent).slice()
      const at = modal.index == null ? list.length : modal.index
      list.splice(at, 0, item)
      replaceSiblings(modal.parent, list)
    } else {
      const list = siblings(modal.parent).slice()
      list[modal.index] = { ...list[modal.index], ...item, children: list[modal.index].children }
      replaceSiblings(modal.parent, list)
    }
    setModal(null)
  }

  const remove = (parent: number | null, index: number) => {
    const item = siblings(parent)[index]
    if (!window.confirm(`确定删除菜单项「${item.label}」${item.children.length ? '及其子菜单' : ''}？`)) return
    replaceSiblings(parent, siblings(parent).filter((_, i) => i !== index))
  }

  const doDrop = (parent: number | null, to: number) => {
    if (!drag || drag.parent !== parent) return
    move(parent, drag.index, to)
    setDrag(null)
    setOver(null)
  }


  const renderRow = (item: MenuItem, parent: number | null, index: number, child = false) => {
    const key = itemKey(parent, index)
    return (
      <tr
        key={item.id ?? key}
        className={`${child ? 'me-child' : ''} ${over === key ? 'is-over' : ''}`}
        draggable
        onDragStart={(e) => {
          setDrag({ parent, index })
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', key)
        }}
        onDragOver={(e) => {
          if (!drag || drag.parent !== parent || drag.index === index) return
          e.preventDefault()
          setOver(key)
        }}
        onDragLeave={() => setOver((k) => (k === key ? null : k))}
        onDrop={(e) => { e.preventDefault(); doDrop(parent, index) }}
        onDragEnd={() => { setDrag(null); setOver(null) }}
      >
        <td className="me-name">
          <span className="me-handle" title="拖动排序">⠿</span>
          {item.label}
        </td>
        <td><code>{linkText(item)}</code></td>
        <td className="me-ops">
          <button type="button" disabled={index === 0} onClick={() => move(parent, index, index - 1)} title="上移">↑</button>
          <button type="button" disabled={index === siblings(parent).length - 1} onClick={() => move(parent, index, index + 1)} title="下移">↓</button>
          <button type="button" onClick={() => openEdit(parent, index)}>编辑</button>
          {!child ? <button type="button" onClick={() => openCreate(index)}>添加子菜单</button> : null}
          <button type="button" className="me-danger" onClick={() => remove(parent, index)}>删除</button>
        </td>
      </tr>
    )
  }

  const rows: React.ReactNode[] = []
  items.forEach((item, i) => {
    rows.push(renderRow(item, null, i))
    item.children.forEach((c, j) => rows.push(renderRow(c, i, j, true)))
  })

  return (
    <div className="me-wrap">
      {toast ? <div className={`zc-toast${toast.kind === 'error' ? ' is-error' : ''}`}>{toast.text}</div> : null}
      <AdminPageHeader
        breadcrumbs={[
          { label: '首页', href: '/admin/collections/pages' },
          { label: '菜单' },
        ]}
        title="菜单"
        description="修改会自动保存；保存后请在页面列表点「重建站点」使静态站生效。"
        actions={
          <>
            {saveState !== 'idle' ? (
              <span className={`me-save is-${saveState}`}>
                {saveState === 'saving' ? '保存中…' : null}
                {saveState === 'saved' ? `已自动保存${savedAt ? ` · ${savedAt}` : ''}` : null}
                {saveState === 'error' ? (
                  <>
                    保存失败
                    <button type="button" onClick={retrySave}>重试</button>
                  </>
                ) : null}
              </span>
            ) : null}
            <button type="button" className="zc-btn" onClick={() => openCreate(null)}>添加菜单项</button>
          </>
        }
      />

      {loading ? <p className="me-muted">加载中…</p> : null}
      {!loading && items.length === 0 ? <p className="me-muted">暂无菜单项</p> : null}
      {!loading && items.length > 0 ? (
        <div className="zc-table-card">
          <div className="zc-table-scroll">
            <table className="me-table">
              <thead>
                <tr><th>名称</th><th>链接</th><th>操作</th></tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        </div>
      ) : null}

      {modal ? (
        <div className="me-modal" onClick={() => setModal(null)}>
          <div className="me-modal-body" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-head">
              <h2>{modal.mode === 'create' ? '添加菜单项' : '编辑菜单项'}</h2>
              <button type="button" onClick={() => setModal(null)}>✕</button>
            </div>
            <label className="me-field">
              <span>名称</span>
              <input autoFocus value={modal.label} onChange={(e) => setModal({ ...modal, label: e.target.value })} />
            </label>
            <label className="me-field">
              <span>链接类型</span>
              <select
                value={modal.linkType}
                onChange={(e) => setModal({ ...modal, linkType: e.target.value as LinkType })}
              >
                <option value="page">内部页面</option>
                <option value="caseCategory">文章分类</option>
                <option value="external">外链</option>
              </select>
            </label>
            {modal.linkType === 'page' ? (
              <label className="me-field">
                <span>内部页面</span>
                <select value={modal.pageId ?? ''} onChange={(e) => setModal({ ...modal, pageId: e.target.value })}>
                  <option value="">选择页面…</option>
                  {pages.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.title}（{p.route}）</option>
                  ))}
                </select>
              </label>
            ) : null}
            {modal.linkType === 'caseCategory' ? (
              <label className="me-field">
                <span>文章分类</span>
                <select value={modal.categoryId ?? ''} onChange={(e) => setModal({ ...modal, categoryId: e.target.value })}>
                  <option value="">选择分类…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.title}（/blog/{c.slug}/）</option>
                  ))}
                </select>
              </label>
            ) : null}
            {modal.linkType === 'external' ? (
              <label className="me-field">
                <span>外链地址</span>
                <input
                  value={modal.externalUrl ?? ''}
                  placeholder="https://"
                  onChange={(e) => setModal({ ...modal, externalUrl: e.target.value })}
                />
              </label>
            ) : null}
            <div className="me-modal-actions">
              <button type="button" className="zc-btn secondary" onClick={() => setModal(null)}>取消</button>
              <button type="button" className="zc-btn" onClick={saveModal}>确定</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

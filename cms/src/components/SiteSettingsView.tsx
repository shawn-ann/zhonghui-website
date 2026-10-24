'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import './site-settings-editor.css'
import { uploadMedia } from '../editor/api'
import { DEFAULT_SETTINGS } from '../site/config'
import { AdminPageHeader } from './admin/AdminPageHeader'

interface PageOption { id: number | string; title: string; route: string }
interface InfoRow { label: string; text: string }
interface QrRow { label: string; imageId?: number | string; imageUrl?: string }

interface FormState {
  logoId?: number | string
  logoUrl?: string
  footerLogoId?: number | string
  footerLogoUrl?: string
  footerInfo: InfoRow[]
  footerQr: QrRow[]
  footerContactLabel: string
  footerContactPageId?: number | string
  copyright: string
  langCurrentLabel: string
  langOtherLabel: string
  langOtherUrl: string
}

const num = (v: string | number | undefined | null) =>
  typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v ?? null

const emptyForm = (): FormState => ({
  logoId: undefined,
  logoUrl: DEFAULT_SETTINGS.logo,
  footerLogoId: undefined,
  footerLogoUrl: DEFAULT_SETTINGS.footerLogo,
  footerInfo: DEFAULT_SETTINGS.footerInfo.map((i) => ({ ...i })),
  footerQr: DEFAULT_SETTINGS.footerQr.map((q) => ({ label: q.label })),
  footerContactLabel: '联系我们',
  footerContactPageId: undefined,
  copyright: DEFAULT_SETTINGS.copyright,
  langCurrentLabel: DEFAULT_SETTINGS.langCurrentLabel,
  langOtherLabel: DEFAULT_SETTINGS.langOtherLabel,
  langOtherUrl: DEFAULT_SETTINGS.langOtherUrl || '',
})

function fromRaw(raw: any): FormState {
  const settings = raw || {}
  return {
    logoId: settings.logo?.id,
    logoUrl: settings.logo?.url || DEFAULT_SETTINGS.logo,
    footerLogoId: settings.footerLogo?.id,
    footerLogoUrl: settings.footerLogo?.url || DEFAULT_SETTINGS.footerLogo,
    footerInfo: Array.isArray(settings.footerInfo) && settings.footerInfo.length
      ? settings.footerInfo.map((i: any) => ({ label: i.label || '', text: i.text || '' }))
      : DEFAULT_SETTINGS.footerInfo.map((i) => ({ ...i })),
    footerQr: Array.isArray(settings.footerQr)
      ? settings.footerQr.map((q: any) => ({ label: q.label || '', imageId: q.image?.id, imageUrl: q.image?.url }))
      : DEFAULT_SETTINGS.footerQr.map((q) => ({ label: q.label })),
    footerContactLabel: settings.footerContactLabel || '联系我们',
    footerContactPageId: settings.footerContactPage?.id ?? settings.footerContactPage,
    copyright: typeof settings.copyright === 'string' ? settings.copyright : DEFAULT_SETTINGS.copyright,
    langCurrentLabel: settings.langCurrentLabel || DEFAULT_SETTINGS.langCurrentLabel,
    langOtherLabel: settings.langOtherLabel || DEFAULT_SETTINGS.langOtherLabel,
    langOtherUrl: settings.langOtherUrl || DEFAULT_SETTINGS.langOtherUrl || '',
  }
}

function UploadButton({
  busy,
  disabled,
  onFile,
}: {
  busy: boolean
  disabled: boolean
  onFile: (file: File) => void
}) {
  return (
    <label className={`ss-upload${disabled ? ' is-disabled' : ''}`}>
      <span>{busy ? '上传中…' : '上传'}</span>
      <input
        className="ss-file"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.currentTarget.value = ''
        }}
      />
    </label>
  )
}

export default function SiteSettingsView() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [pages, setPages] = useState<PageOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const notify = (kind: 'success' | 'error', text: string) => {
    setToast({ kind, text })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [settingsRes, pagesRes] = await Promise.all([
        fetch('/api/globals/site-settings?depth=1', { credentials: 'include' }),
        fetch('/api/pages?limit=200&depth=0&draft=true', { credentials: 'include' }),
      ])
      if (!settingsRes.ok) throw new Error(`加载设置失败：${settingsRes.status}`)
      if (!pagesRes.ok) throw new Error(`加载页面失败：${pagesRes.status}`)
      const settings = await settingsRes.json()
      const pageData = await pagesRes.json()
      setForm(fromRaw(settings))
      setPages((pageData.docs || []).map((p: any) => ({ id: p.id, title: p.title || '', route: p.route || '' })))
      setDirty(false)
    } catch (e) {
      notify('error', e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    return () => clearTimeout(toastTimer.current)
  }, [load])

  const patch = (values: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...values }))
    setDirty(true)
  }

  const patchInfo = (index: number, values: Partial<InfoRow>) => {
    patch({ footerInfo: form.footerInfo.map((r, i) => (i === index ? { ...r, ...values } : r)) })
  }

  const moveInfo = (index: number, dir: -1 | 1) => {
    const to = index + dir
    if (to < 0 || to >= form.footerInfo.length) return
    const list = form.footerInfo.slice()
    const [row] = list.splice(index, 1)
    list.splice(to, 0, row)
    patch({ footerInfo: list })
  }

  const patchQr = (index: number, values: Partial<QrRow>) => {
    patch({ footerQr: form.footerQr.map((r, i) => (i === index ? { ...r, ...values } : r)) })
  }

  const upload = async (file: File, apply: (id: number | string, url: string) => void, key: string) => {
    setUploading(key)
    try {
      const media = await uploadMedia(file)
      if (media.url) apply(media.id, media.url)
    } catch (e) {
      notify('error', e instanceof Error ? e.message : '上传失败')
    } finally {
      setUploading(null)
    }
  }

  const save = async () => {
    if (saving) return
    setSaving(true)
    try {
      const body = {
        logo: num(form.logoId),
        footerLogo: num(form.footerLogoId),
        footerInfo: form.footerInfo,
        footerQr: form.footerQr.map((q) => ({
          label: q.label,
          ...(q.imageId != null ? { image: num(q.imageId) } : {}),
        })),
        footerContactLabel: form.footerContactLabel,
        footerContactPage: num(form.footerContactPageId),
        copyright: form.copyright,
        langCurrentLabel: form.langCurrentLabel,
        langOtherLabel: form.langOtherLabel,
        langOtherUrl: form.langOtherUrl,
      }
      const res = await fetch('/api/globals/site-settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const first = data?.errors?.[0]
        throw new Error(first?.message || `保存失败：${res.status}`)
      }
      notify('success', '站点设置已保存')
      setDirty(false)
      await load()
    } catch (e) {
      notify('error', e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    if (!window.confirm('恢复默认设置？保存后才会生效。')) return
    setForm(emptyForm())
    setDirty(true)
  }

  const uploadButton = (
    key: string,
    onPick: (id: number | string, url: string) => void,
  ) => (
    <UploadButton
      busy={uploading === key}
      disabled={uploading != null}
      onFile={(file) => void upload(file, onPick, key)}
    />
  )

  if (loading) return <div className="ss-wrap"><p className="ss-muted">加载中…</p></div>

  return (
    <div className="ss-wrap">
      {toast ? <div className={`zc-toast${toast.kind === 'error' ? ' is-error' : ''}`}>{toast.text}</div> : null}

      <AdminPageHeader
        breadcrumbs={[
          { label: '首页', href: '/admin/collections/pages' },
          { label: '站点设置' },
        ]}
        title="站点设置"
        description="保存后，请在页面列表点「重建站点」使静态站生效。"
        actions={
          <>
            <button type="button" className="zc-btn secondary" onClick={reset}>恢复默认</button>
            <button type="button" className="zc-btn" disabled={!dirty || saving} onClick={save}>
              {saving ? '保存中…' : '保存更改'}
            </button>
          </>
        }
      />

      <div className="ss-cards">
        <section className="zc-card">
          <div className="zc-card-head">
            <div>
              <h2 className="zc-card-title">页头</h2>
              <p className="zc-card-hint">导航 Logo 与语言切换。</p>
            </div>
            <span className="ss-card-sub">导航区域</span>
          </div>
          <div className="ss-grid2">
            <div className="ss-field">
              <span>导航 Logo</span>
              <div className="ss-media">
                <div className="ss-thumb"><img src={form.logoUrl} alt="" /></div>
                {uploadButton('logo', (id, url) => patch({ logoId: id, logoUrl: url }))}
                {form.logoId != null ? <button type="button" className="ss-danger-link" onClick={() => patch({ logoId: undefined, logoUrl: DEFAULT_SETTINGS.logo })}>移除</button> : null}
              </div>
            </div>
            <label className="ss-field"><span>当前语言名称</span>
              <input className="zc-input" value={form.langCurrentLabel} onChange={(e) => patch({ langCurrentLabel: e.target.value })} />
            </label>
            <label className="ss-field"><span>其它语言名称</span>
              <input className="zc-input" value={form.langOtherLabel} onChange={(e) => patch({ langOtherLabel: e.target.value })} />
            </label>
            <label className="ss-field"><span>其它语言链接</span>
              <input className="zc-input" value={form.langOtherUrl} onChange={(e) => patch({ langOtherUrl: e.target.value })} />
            </label>
          </div>
        </section>

        <section className="zc-card">
          <div className="zc-card-head">
            <div>
              <h2 className="zc-card-title">页脚</h2>
              <p className="zc-card-hint">页脚 Logo、联系方式、二维码与版权。</p>
            </div>
            <span className="ss-card-sub">页脚区域</span>
          </div>
          <div className="ss-grid2">
            <div className="ss-field">
              <span>页脚 Logo</span>
              <div className="ss-media">
                <div className="ss-thumb ss-thumb-dark"><img src={form.footerLogoUrl} alt="" /></div>
                {uploadButton('footerLogo', (id, url) => patch({ footerLogoId: id, footerLogoUrl: url }))}
                {form.footerLogoId != null ? <button type="button" className="ss-danger-link" onClick={() => patch({ footerLogoId: undefined, footerLogoUrl: DEFAULT_SETTINGS.footerLogo })}>移除</button> : null}
              </div>
            </div>
            <label className="ss-field"><span>版权信息</span>
              <input className="zc-input" value={form.copyright} onChange={(e) => patch({ copyright: e.target.value })} />
              <small>留空时页脚不显示版权文本。</small>
            </label>
          </div>
          <div className="ss-subhead">页脚信息</div>
          <div className="ss-rows">
            {form.footerInfo.map((row, i) => (
              <div className="ss-row" key={i}>
                <span className="ss-handle">⠿</span>
                <input className="zc-input ss-label-input" value={row.label} placeholder="📍 地址：" onChange={(e) => patchInfo(i, { label: e.target.value })} />
                <input className="zc-input ss-grow" value={row.text} placeholder="内容" onChange={(e) => patchInfo(i, { text: e.target.value })} />
                <button type="button" className="ss-mini" disabled={i === 0} onClick={() => moveInfo(i, -1)} title="上移">↑</button>
                <button type="button" className="ss-mini" disabled={i === form.footerInfo.length - 1} onClick={() => moveInfo(i, 1)} title="下移">↓</button>
                <button type="button" className="ss-mini ss-danger" onClick={() => patch({ footerInfo: form.footerInfo.filter((_, j) => j !== i) })}>删除</button>
              </div>
            ))}
          </div>
          <button type="button" className="ss-add" onClick={() => patch({ footerInfo: [...form.footerInfo, { label: '', text: '' }] })}>＋ 添加信息行</button>
        </section>

        <section className="zc-card">
          <div className="zc-card-head">
            <div>
              <h2 className="zc-card-title">二维码</h2>
              <p className="zc-card-hint">数量不限，可上传图片；未上传时显示占位。</p>
            </div>
          </div>
          <div className="ss-qr-grid">
            {form.footerQr.map((qr, i) => (
              <div className="ss-qr-card" key={i}>
                <input className="zc-input" value={qr.label} placeholder="名称" onChange={(e) => patchQr(i, { label: e.target.value })} />
                {qr.imageUrl ? <div className="ss-qr-thumb"><img src={qr.imageUrl} alt={qr.label} /></div> : <div className="ss-qr-thumb">未上传</div>}
                <div className="ss-qr-actions">
                  {uploadButton(`qr-${i}`, (id, url) => patchQr(i, { imageId: id, imageUrl: url }))}
                  {qr.imageId != null ? <button type="button" className="ss-mini" onClick={() => patchQr(i, { imageId: undefined, imageUrl: undefined })}>移除</button> : null}
                  <button type="button" className="ss-mini ss-danger" onClick={() => patch({ footerQr: form.footerQr.filter((_, j) => j !== i) })}>删除</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="ss-add" onClick={() => patch({ footerQr: [...form.footerQr, { label: '' }] })}>＋ 添加二维码</button>
        </section>

        <section className="zc-card">
          <div className="zc-card-head">
            <div>
              <h2 className="zc-card-title">联系按钮</h2>
              <p className="zc-card-hint">不选择页面时，页脚不显示联系按钮。</p>
            </div>
          </div>
          <div className="ss-grid2">
            <label className="ss-field"><span>按钮文字</span>
              <input className="zc-input" value={form.footerContactLabel} onChange={(e) => patch({ footerContactLabel: e.target.value })} />
            </label>
            <label className="ss-field"><span>链接页面</span>
              <select className="zc-input" value={form.footerContactPageId ?? ''} onChange={(e) => patch({ footerContactPageId: e.target.value || undefined })}>
                <option value="">不显示按钮</option>
                {pages.map((p) => <option key={p.id} value={String(p.id)}>{p.title}（{p.route}）</option>)}
              </select>
            </label>
          </div>
        </section>
      </div>

      <div className="ss-bottom">
        <button type="button" className="zc-btn secondary" onClick={reset}>恢复默认</button>
        <button type="button" className="zc-btn" disabled={!dirty || saving} onClick={save}>
          {saving ? '保存中…' : '保存更改'}
        </button>
      </div>
    </div>
  )
}

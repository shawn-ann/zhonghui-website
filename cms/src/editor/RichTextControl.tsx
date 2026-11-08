'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { HeadingNode, QuoteNode, $createHeadingNode } from '@lexical/rich-text'
import { ListNode, ListItemNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list'
import { LinkNode, AutoLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { $getSelectionStyleValueForProperty, $patchStyleText, $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getNodeByKey, $getSelection, $isElementNode, $isRangeSelection, FORMAT_ELEMENT_COMMAND, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND } from 'lexical'
import { ImageRowNode, $insertImageRow } from './ImageRowNode'
import { ImageNode, $insertImage } from './ImageNode'
import MediaModal from './MediaModal'
import { normalizeHexColor } from './colorValue'

function Toolbar() {
  const [editor] = useLexicalComposerContext()
  const [picker, setPicker] = useState<'image' | 'gallery' | null>(null)
  const [color, setColor] = useState('')
  const [colorText, setColorText] = useState('')

  useEffect(() => {
    const syncColor = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return
        const value = normalizeHexColor($getSelectionStyleValueForProperty(selection, 'color', ''))
        setColor(value)
        setColorText(value)
      })
    }
    syncColor()
    return editor.registerUpdateListener(syncColor)
  }, [editor])

  const format = (value: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, value)
  }
  const block = (type: 'paragraph' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      $setBlocksType(selection, () => (type === 'paragraph' ? $createParagraphNode() : $createHeadingNode(type)))
    })
  }
  const list = (type: 'ul' | 'ol') => {
    editor.dispatchCommand(type === 'ul' ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND, undefined)
  }
  const align = (value: 'left' | 'center' | 'right') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value)
  }
  const focusParagraph = (key: string | null) => {
    window.setTimeout(() => {
      editor.focus()
      if (!key) return
      editor.update(() => {
        const node = $getNodeByKey(key)
        if ($isElementNode(node)) node.selectStart()
      })
    }, 50)
  }

  const applyColor = (color: string | null) => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      $patchStyleText(selection, { color })
    })
  }

  const commitColorText = () => {
    const next = normalizeHexColor(colorText)
    if (next) {
      setColor(next)
      setColorText(next)
      applyColor(next)
    } else {
      setColorText(color)
    }
  }

  const link = () => {
    const url = window.prompt('链接地址（留空取消）')
    if (url !== null) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url || null)
  }

  return (
    <>
    <div className="rt-toolbar">
      <button type="button" onClick={() => format('bold')}><b>B</b></button>
      <button type="button" onClick={() => format('italic')}><i>I</i></button>
      <button type="button" onClick={() => format('underline')}><u>U</u></button>
      <label className="rt-color" title="文字颜色">
        <input
          type="color"
          value={color || '#5A4A52'}
          onChange={(e) => {
            const next = normalizeHexColor(e.target.value)
            setColor(next)
            setColorText(next)
            applyColor(next)
          }}
        />
        <input
          className="rt-color-value"
          value={colorText}
          placeholder="默认色"
          aria-label="文字颜色色号"
          spellCheck={false}
          onChange={(e) => setColorText(e.target.value)}
          onBlur={commitColorText}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitColorText()
              e.currentTarget.blur()
            }
          }}
        />
      </label>
      <button type="button" onClick={() => { setColor(''); setColorText(''); applyColor(null) }} title="清除文字颜色">默认色</button>
      <span className="rt-divider" />
      <button type="button" onClick={() => block('h2')}>H2</button>
      <button type="button" onClick={() => block('h3')}>H3</button>
      <button type="button" onClick={() => block('paragraph')}>正文</button>
      <button type="button" onClick={() => align('left')} title="左对齐">左对齐</button>
      <button type="button" onClick={() => align('center')} title="居中">居中</button>
      <button type="button" onClick={() => align('right')} title="右对齐">右对齐</button>
      <span className="rt-divider" />
      <button type="button" onClick={() => list('ul')}>• 列表</button>
      <button type="button" onClick={() => list('ol')}>1. 列表</button>
      <button type="button" onClick={link}>链接</button>
      <span className="rt-divider" />
      <button type="button" onClick={() => setPicker('image')}>图片</button>
      <button type="button" onClick={() => setPicker('gallery')}>图集</button>
      <span className="rt-divider" />
      <button type="button" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>撤销</button>
      <button type="button" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>重做</button>
    </div>
    {picker === 'image' ? (
      <MediaModal
        title="插入图片"
        onClose={() => setPicker(null)}
        onSelect={(item) => {
          let paragraphKey: string | null = null
          if (item.url) editor.update(() => { paragraphKey = $insertImage(item.url as string, item.alt || '') })
          setPicker(null)
          focusParagraph(paragraphKey)
        }}
      />
    ) : null}
    {picker === 'gallery' ? (
      <MediaModal
        title="插入图集（可多选）"
        multiple
        onClose={() => setPicker(null)}
        onSelectMany={(items) => {
          const images = items
            .filter((item) => item.url)
            .map((item) => ({ src: item.url as string, alt: item.alt || '' }))
          let paragraphKey: string | null = null
          if (images.length) {
            editor.update(() => { paragraphKey = $insertImageRow(images) })
          }
          setPicker(null)
          focusParagraph(paragraphKey)
        }}
      />
    ) : null}
    </>
  )
}

const EMPTY_STATE = {
  root: {
    type: 'root', version: 1, direction: null, format: '', indent: 0,
    children: [{
      type: 'paragraph', version: 1, direction: null, format: '', indent: 0, textFormat: 0, children: [],
    }],
  },
}

/** 表单被整体重置（如“恢复到已发布版本”）时，把外部值同步回编辑器，避免旧内容覆盖新内容。 */
function ValueSyncPlugin({ value }: { value: unknown }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    const next = value && typeof value === 'object' ? value : EMPTY_STATE
    const current = editor.getEditorState().toJSON()
    if (JSON.stringify(next) === JSON.stringify(current)) return
    editor.setEditorState(editor.parseEditorState(JSON.stringify(next)))
  }, [editor, value])
  return null
}

function Editor({
  value,
  onChange,
}: {
  value: unknown
  onChange: (value: unknown) => void
}) {
  const initialConfig = useMemo(() => ({
    namespace: 'zhonghui-rich-text',
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, ImageRowNode, ImageNode],
    onError: (error: Error) => { throw error },
    editorState: value && typeof value === 'object' ? JSON.stringify(value) : undefined,
    theme: {
      paragraph: 'rt-p',
      heading: { h2: 'rt-h2', h3: 'rt-h3' },
      text: { bold: 'rt-bold', italic: 'rt-italic', underline: 'rt-underline' },
      list: { ul: 'rt-ul', ol: 'rt-ol', listitem: 'rt-li' },
      link: 'rt-link',
    },
  }), [])

  return (
    <div className="rt-shell">
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar />
        <RichTextPlugin
          contentEditable={<ContentEditable className="rt-content" />}
          placeholder={<div className="rt-placeholder">在这里编辑富文本内容…</div>}
          ErrorBoundary={({ children }) => <>{children}</>}
        />
        <ValueSyncPlugin value={value} />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin
          onChange={(editorState) => {
            const next = editorState.toJSON()
            if (JSON.stringify(next) !== JSON.stringify(value)) onChange(next)
          }}
        />
      </LexicalComposer>
    </div>
  )
}

export default function RichTextControl({
  label,
  value,
  onChange,
  inline = false,
}: {
  label: string
  value: unknown
  onChange: (value: unknown) => void
  inline?: boolean
}) {
  const [open, setOpen] = useState(false)

  if (inline) {
    return (
      <div className="ed-ctl rt-control rt-inline">
        <span>{label}</span>
        <Editor value={value} onChange={onChange} />
      </div>
    )
  }

  return (
    <div className="ed-ctl rt-control">
      <span>{label}</span>
      <button type="button" className="rt-open" onClick={() => setOpen(true)}>
        {value ? '编辑正文' : '填写正文'}
      </button>
      <span className="rt-state">{value ? '已填写富文本内容' : '尚未填写内容'}</span>
      {open ? (
        <div className="ed-modal rt-modal" onClick={() => setOpen(false)}>
          <div className="ed-modal-body rt-modal-body" onClick={(e) => e.stopPropagation()}>
            <div className="ed-modal-head">
              <b>编辑正文</b>
              <button type="button" onClick={() => setOpen(false)}>✕</button>
            </div>
            <Editor value={value} onChange={onChange} />
            <div className="rt-modal-actions">
              <button type="button" className="rt-done" onClick={() => setOpen(false)}>完成</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

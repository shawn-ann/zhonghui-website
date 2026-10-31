'use client'
import React, { useMemo, useState } from 'react'
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
import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND } from 'lexical'

function Toolbar() {
  const [editor] = useLexicalComposerContext()

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
  const link = () => {
    const url = window.prompt('链接地址（留空取消）')
    if (url !== null) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url || null)
  }

  return (
    <div className="rt-toolbar">
      <button type="button" onClick={() => format('bold')}><b>B</b></button>
      <button type="button" onClick={() => format('italic')}><i>I</i></button>
      <button type="button" onClick={() => format('underline')}><u>U</u></button>
      <span className="rt-divider" />
      <button type="button" onClick={() => block('h2')}>H2</button>
      <button type="button" onClick={() => block('h3')}>H3</button>
      <button type="button" onClick={() => block('paragraph')}>正文</button>
      <span className="rt-divider" />
      <button type="button" onClick={() => list('ul')}>• 列表</button>
      <button type="button" onClick={() => list('ol')}>1. 列表</button>
      <button type="button" onClick={link}>链接</button>
      <span className="rt-divider" />
      <button type="button" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>撤销</button>
      <button type="button" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>重做</button>
    </div>
  )
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
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
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
}: {
  label: string
  value: unknown
  onChange: (value: unknown) => void
}) {
  const [open, setOpen] = useState(false)

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

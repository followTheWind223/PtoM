import { useEffect, useRef } from 'react'
import {
  Editor,
  rootCtx,
  defaultValueCtx,
  rootAttrsCtx,
  editorViewCtx,
  editorViewOptionsCtx,
} from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { gfm } from '@milkdown/kit/preset/gfm'
import { nord } from '@milkdown/theme-nord'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { history } from '@milkdown/kit/plugin/history'
import { indent } from '@milkdown/kit/plugin/indent'
import { trailing } from '@milkdown/kit/plugin/trailing'
import { cursor } from '@milkdown/kit/plugin/cursor'
import { clipboard } from '@milkdown/kit/plugin/clipboard'
import { replaceAll, getMarkdown } from '@milkdown/kit/utils'
import { useEditorStore, type OpenFile } from '../../stores/editorStore'

interface MarkdownEditorProps {
  file: OpenFile
  onChange: (content: string) => void
  isActive: boolean
}

export function MarkdownEditor({ file, onChange, isActive }: MarkdownEditorProps) {
  const editorRef = useRef<Editor | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isInternalChange = useRef(false)
  // 由 ProseMirror 的 editable() 回调实时读取，切换模式无需重建编辑器
  const editableRef = useRef(file.mode !== 'preview')

  editableRef.current = file.mode !== 'preview'

  // 创建 Milkdown 编辑器实例（仅在挂载时）
  useEffect(() => {
    if (!containerRef.current) return

    Editor.make()
      .config((ctx) => {
        // 应用 Nord 主题
        nord(ctx)
        ctx.set(rootCtx, containerRef.current!)
        ctx.set(defaultValueCtx, file.content)
        ctx.set(rootAttrsCtx, {
          class: 'milkdown-editor',
          'data-milkdown-root': 'true',
        })
        // 浏览模式只读
        ctx.set(editorViewOptionsCtx, {
          editable: () => editableRef.current,
        })
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(listener)
      .use(indent)
      .use(trailing)
      .use(cursor)
      .use(clipboard)
      .create()
      .then((created) => {
        editorRef.current = created

        // 如果当前是活跃标签，注册到 store 供 Toolbar 使用
        if (isActive) {
          useEditorStore.getState().setActiveEditorRef({ current: created })
        }

        // 监听 Markdown 内容变化，同步到 store
        created.action((ctx) => {
          const listenerManager = ctx.get(listenerCtx)
          listenerManager.markdownUpdated((_ctx, markdown) => {
            if (!isInternalChange.current) {
              isInternalChange.current = true
              onChange(markdown)
              // 异步重置标记，避免同步递归更新
              setTimeout(() => {
                isInternalChange.current = false
              }, 0)
            }
          })
        })
      })
      .catch((err) => {
        console.error('[MarkdownEditor] Failed to create editor:', err)
      })

    return () => {
      if (editorRef.current) {
        // 清除 store 中的引用
        const storeRef = useEditorStore.getState().activeEditorRef
        if (storeRef.current === editorRef.current) {
          useEditorStore.getState().setActiveEditorRef({ current: null })
        }
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, []) // 仅在挂载时创建一次

  // 当 isActive 变化时，更新 store 中的编辑器引用
  useEffect(() => {
    if (isActive && editorRef.current) {
      useEditorStore.getState().setActiveEditorRef({ current: editorRef.current })
    }
  }, [isActive])

  // 模式切换时让 ProseMirror 重新求值 editable()
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      view.dispatch(view.state.tr)
    })
  }, [file.mode])

  // 当外部内容变化时（如源码模式编辑后切回），更新编辑器内容
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || isInternalChange.current) return

    editor.action((ctx) => {
      const currentMarkdown = getMarkdown()(ctx)
      if (currentMarkdown !== file.content) {
        isInternalChange.current = true
        replaceAll(file.content)(ctx)
        setTimeout(() => {
          isInternalChange.current = false
        }, 0)
      }
    })
  }, [file.content])

  // 源码模式切换时聚焦 textarea
  useEffect(() => {
    if (isActive && file.mode === 'source' && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isActive, file.mode])

  // 源码模式：纯文本编辑
  if (file.mode === 'source') {
    return (
      <div className="h-full flex flex-col bg-editor-bg">
        <textarea
          ref={textareaRef}
          value={file.content}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 w-full resize-none border-0 outline-none px-8 py-6 font-mono text-[13px] leading-relaxed bg-editor-bg text-editor-text max-w-4xl mx-auto"
          placeholder="开始编辑 Markdown..."
          spellCheck={false}
        />
      </div>
    )
  }

  // 编辑 / 浏览模式：Milkdown 编辑器（浏览模式只读）
  return (
    <div
      className={`h-full overflow-hidden ${
        file.mode === 'preview' ? 'ptom-preview-mode' : ''
      }`}
    >
      <div ref={containerRef} className="h-full" />
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { Editor, rootCtx, defaultValueCtx, rootAttrsCtx } from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { gfm } from '@milkdown/kit/preset/gfm'
import { nord } from '@milkdown/theme-nord'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { history } from '@milkdown/kit/plugin/history'
import { indent } from '@milkdown/kit/plugin/indent'
import { trailing } from '@milkdown/kit/plugin/trailing'
import { cursor } from '@milkdown/kit/plugin/cursor'
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

  // 创建 Milkdown 编辑器实例（仅在挂载时）
  useEffect(() => {
    if (!containerRef.current) return

    let editor: Editor | null = null

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
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(listener)
      .use(indent)
      .use(trailing)
      .use(cursor)
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

  // 当外部内容变化时（如切换文件），更新编辑器内容
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
    if (isActive && file.isSourceMode && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isActive, file.isSourceMode])

  // 源码模式：纯文本编辑
  if (file.isSourceMode) {
    return (
      <div className="h-full flex flex-col">
        <textarea
          ref={textareaRef}
          value={file.content}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 w-full resize-none border-0 outline-none p-6 font-mono text-sm leading-relaxed bg-editor-bg text-editor-text"
          placeholder="开始编辑 Markdown..."
          spellCheck={false}
        />
      </div>
    )
  }

  // WYSIWYG 模式：Milkdown 编辑器
  return (
    <div className="h-full overflow-hidden">
      <div ref={containerRef} className="h-full" />
    </div>
  )
}

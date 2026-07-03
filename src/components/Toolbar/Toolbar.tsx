import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  TextQuote,
  Table,
  PenLine,
  CodeXml,
  Eye,
} from 'lucide-react'
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
} from '@milkdown/kit/preset/commonmark'
import {
  toggleStrikethroughCommand,
  insertTableCommand,
} from '@milkdown/kit/preset/gfm'
import type { Editor } from '@milkdown/kit/core'
import { useEditorStore, type ViewMode } from '../../stores/editorStore'

interface ToolbarButton {
  label: string
  title: string
  icon: JSX.Element
  action: (editor: Editor) => void
}

const ICON_CLS = 'w-4 h-4'

const FORMAT_GROUPS: ToolbarButton[][] = [
  [
    {
      label: 'bold',
      title: '粗体 (Ctrl+B)',
      icon: <Bold className={ICON_CLS} />,
      action: (editor) => editor.action((ctx) => ctx.get(toggleStrongCommand.key)()),
    },
    {
      label: 'italic',
      title: '斜体 (Ctrl+I)',
      icon: <Italic className={ICON_CLS} />,
      action: (editor) => editor.action((ctx) => ctx.get(toggleEmphasisCommand.key)()),
    },
    {
      label: 'strikethrough',
      title: '删除线',
      icon: <Strikethrough className={ICON_CLS} />,
      action: (editor) => editor.action((ctx) => ctx.get(toggleStrikethroughCommand.key)()),
    },
    {
      label: 'code',
      title: '行内代码 (Ctrl+`)',
      icon: <Code className={ICON_CLS} />,
      action: (editor) => editor.action((ctx) => ctx.get(toggleInlineCodeCommand.key)()),
    },
  ],
  [
    {
      label: 'heading1',
      title: '一级标题 (Ctrl+1)',
      icon: <Heading1 className={ICON_CLS} />,
      action: (editor) => editor.action((ctx) => ctx.get(wrapInHeadingCommand.key)(1)),
    },
    {
      label: 'heading2',
      title: '二级标题 (Ctrl+2)',
      icon: <Heading2 className={ICON_CLS} />,
      action: (editor) => editor.action((ctx) => ctx.get(wrapInHeadingCommand.key)(2)),
    },
    {
      label: 'heading3',
      title: '三级标题 (Ctrl+3)',
      icon: <Heading3 className={ICON_CLS} />,
      action: (editor) => editor.action((ctx) => ctx.get(wrapInHeadingCommand.key)(3)),
    },
  ],
  [
    {
      label: 'bulletList',
      title: '无序列表',
      icon: <List className={ICON_CLS} />,
      action: (editor) => editor.action((ctx) => ctx.get(wrapInBulletListCommand.key)()),
    },
    {
      label: 'orderedList',
      title: '有序列表',
      icon: <ListOrdered className={ICON_CLS} />,
      action: (editor) => editor.action((ctx) => ctx.get(wrapInOrderedListCommand.key)()),
    },
    {
      label: 'blockquote',
      title: '引用',
      icon: <TextQuote className={ICON_CLS} />,
      action: (editor) => editor.action((ctx) => ctx.get(wrapInBlockquoteCommand.key)()),
    },
    {
      label: 'table',
      title: '插入表格',
      icon: <Table className={ICON_CLS} />,
      action: (editor) =>
        editor.action((ctx) => ctx.get(insertTableCommand.key)({ row: 3, col: 3 })),
    },
  ],
]

const MODES: { mode: ViewMode; title: string; label: string; icon: JSX.Element }[] = [
  { mode: 'wysiwyg', title: '编辑模式 — 所见即所得', label: '编辑', icon: <PenLine className="w-3.5 h-3.5" /> },
  { mode: 'source', title: '源码模式 (Ctrl+/)', label: '源码', icon: <CodeXml className="w-3.5 h-3.5" /> },
  { mode: 'preview', title: '浏览模式 — 只读 (Ctrl+E)', label: '浏览', icon: <Eye className="w-3.5 h-3.5" /> },
]

export function Toolbar() {
  const { openFiles, activeIndex, setMode } = useEditorStore()
  const currentFile =
    activeIndex >= 0 && activeIndex < openFiles.length
      ? openFiles[activeIndex]
      : null

  if (!currentFile) return null

  // 只有 WYSIWYG 模式能执行富文本命令
  const formatEnabled = currentFile.mode === 'wysiwyg'

  const handleAction = (btn: ToolbarButton) => {
    const editor = useEditorStore.getState().activeEditorRef?.current
    if (editor && formatEnabled) {
      btn.action(editor)
    }
  }

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-200 bg-gray-50/80 backdrop-blur overflow-x-auto select-none">
      {FORMAT_GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <div className="w-px h-5 bg-gray-200 mx-1.5" />}
          {group.map((btn) => (
            <button
              key={btn.label}
              onClick={() => handleAction(btn)}
              disabled={!formatEnabled}
              className="p-1.5 rounded-md text-gray-500 transition-colors enabled:hover:bg-gray-200 enabled:hover:text-gray-800 disabled:opacity-30 disabled:cursor-default"
              title={btn.title}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      ))}

      <div className="flex-1" />

      {/* 模式切换（类 Typora：编辑 / 源码 / 浏览） */}
      <div className="flex items-center rounded-lg bg-gray-200/70 p-0.5 flex-shrink-0">
        {MODES.map(({ mode, title, label, icon }) => {
          const active = currentFile.mode === mode
          return (
            <button
              key={mode}
              onClick={() => setMode(currentFile.path, mode)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                active
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title={title}
            >
              {icon}
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

import { useEditorStore } from '../../stores/editorStore'
import { toggleStrongCommand } from '@milkdown/kit/preset/commonmark'
import { toggleEmphasisCommand } from '@milkdown/kit/preset/commonmark'
import { toggleInlineCodeCommand } from '@milkdown/kit/preset/commonmark'
import { wrapInHeadingCommand } from '@milkdown/kit/preset/commonmark'
import { wrapInBlockquoteCommand } from '@milkdown/kit/preset/commonmark'
import { wrapInBulletListCommand } from '@milkdown/kit/preset/commonmark'
import { wrapInOrderedListCommand } from '@milkdown/kit/preset/commonmark'
import { toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm'
import { insertTableCommand } from '@milkdown/kit/preset/gfm'
import type { Editor } from '@milkdown/kit/core'

interface ToolbarButton {
  label: string
  title: string
  icon: JSX.Element
  action: (editor: Editor) => void
}

const BoldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
    <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
  </svg>
)

const ItalicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </svg>
)

const StrikethroughIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7.1-5.3 1.3-5.3 4.4.1 2 1.3 3.1 3.4 3.9M19.3 13.3c.8 1 1.1 2.2.9 3.5-.3 2.5-2 4.3-5.1 4.3-1.7 0-3.4-.5-5-.9M7.5 8.2h9M7.5 15.8h9" />
  </svg>
)

const CodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
)

const HeadingIcon = (level: number) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <text x="3" y="18" fontSize="16" fontWeight="bold" fill="currentColor" stroke="none">H</text>
    <text x="14" y="18" fontSize="10" fontWeight="bold" fill="currentColor" stroke="none">{level}</text>
  </svg>
)

const ListBulletedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none" />
  </svg>
)

const ListOrderedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="10" y1="6" x2="21" y2="6" />
    <line x1="10" y1="12" x2="21" y2="12" />
    <line x1="10" y1="18" x2="21" y2="18" />
    <text x="2" y="9" fontSize="9" fill="currentColor" stroke="none">1</text>
    <text x="2" y="15" fontSize="9" fill="currentColor" stroke="none">2</text>
    <text x="2" y="21" fontSize="9" fill="currentColor" stroke="none">3</text>
  </svg>
)

const QuoteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
  </svg>
)

const TableIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
)

const SourceModeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
)

function buildButtons(): ToolbarButton[] {
  return [
    {
      label: 'bold',
      title: '粗体 (Ctrl+B)',
      icon: <BoldIcon />,
      action: (editor) => {
        editor.action((ctx) => {
          ctx.get(toggleStrongCommand.key)()
        })
      },
    },
    {
      label: 'italic',
      title: '斜体 (Ctrl+I)',
      icon: <ItalicIcon />,
      action: (editor) => {
        editor.action((ctx) => {
          ctx.get(toggleEmphasisCommand.key)()
        })
      },
    },
    {
      label: 'strikethrough',
      title: '删除线',
      icon: <StrikethroughIcon />,
      action: (editor) => {
        editor.action((ctx) => {
          ctx.get(toggleStrikethroughCommand.key)()
        })
      },
    },
    {
      label: 'code',
      title: '行内代码 (Ctrl+`)',
      icon: <CodeIcon />,
      action: (editor) => {
        editor.action((ctx) => {
          ctx.get(toggleInlineCodeCommand.key)()
        })
      },
    },
    {
      label: 'heading1',
      title: '一级标题 (Ctrl+1)',
      icon: HeadingIcon(1),
      action: (editor) => {
        editor.action((ctx) => {
          ctx.get(wrapInHeadingCommand.key)(1)
        })
      },
    },
    {
      label: 'heading2',
      title: '二级标题 (Ctrl+2)',
      icon: HeadingIcon(2),
      action: (editor) => {
        editor.action((ctx) => {
          ctx.get(wrapInHeadingCommand.key)(2)
        })
      },
    },
    {
      label: 'heading3',
      title: '三级标题 (Ctrl+3)',
      icon: HeadingIcon(3),
      action: (editor) => {
        editor.action((ctx) => {
          ctx.get(wrapInHeadingCommand.key)(3)
        })
      },
    },
    {
      label: 'bulletList',
      title: '无序列表',
      icon: <ListBulletedIcon />,
      action: (editor) => {
        editor.action((ctx) => {
          ctx.get(wrapInBulletListCommand.key)()
        })
      },
    },
    {
      label: 'orderedList',
      title: '有序列表',
      icon: <ListOrderedIcon />,
      action: (editor) => {
        editor.action((ctx) => {
          ctx.get(wrapInOrderedListCommand.key)()
        })
      },
    },
    {
      label: 'blockquote',
      title: '引用',
      icon: <QuoteIcon />,
      action: (editor) => {
        editor.action((ctx) => {
          ctx.get(wrapInBlockquoteCommand.key)()
        })
      },
    },
    {
      label: 'table',
      title: '插入表格',
      icon: <TableIcon />,
      action: (editor) => {
        editor.action((ctx) => {
          ctx.get(insertTableCommand.key)({ row: 3, col: 3 })
        })
      },
    },
  ]
}

export function Toolbar() {
  const { openFiles, activeIndex, toggleSourceMode } = useEditorStore()
  const currentFile =
    activeIndex >= 0 && activeIndex < openFiles.length
      ? openFiles[activeIndex]
      : null

  if (!currentFile) return null

  const buttons = buildButtons()

  const handleAction = (btn: ToolbarButton) => {
    // 获取当前活跃编辑器的引用
    const editor = useEditorStore.getState().activeEditorRef?.current
    if (editor) {
      btn.action(editor)
    }
  }

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 overflow-x-auto select-none">
      {/* 格式化按钮 */}
      <div className="flex items-center gap-0.5">
        {buttons.slice(0, 4).map((btn) => (
          <button
            key={btn.label}
            onClick={() => handleAction(btn)}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
            title={btn.title}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* 分隔线 */}
      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* 标题按钮 */}
      <div className="flex items-center gap-0.5">
        {buttons.slice(4, 7).map((btn) => (
          <button
            key={btn.label}
            onClick={() => handleAction(btn)}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
            title={btn.title}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* 分隔线 */}
      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* 列表和块元素 */}
      <div className="flex items-center gap-0.5">
        {buttons.slice(7).map((btn) => (
          <button
            key={btn.label}
            onClick={() => handleAction(btn)}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
            title={btn.title}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* 分隔线 */}
      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* 源码模式切换 */}
      <button
        onClick={() => toggleSourceMode(currentFile.path)}
        className={`p-1.5 rounded transition-colors ${
          currentFile.isSourceMode
            ? 'bg-blue-100 text-blue-600'
            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
        }`}
        title="切换源码模式 (Ctrl+/)"
      >
        <SourceModeIcon />
      </button>

      <div className="flex-1" />
    </div>
  )
}

import { useState, useEffect } from 'react'
import type { FileEntry } from '../../types/electron'

interface FileTreeNodeProps {
  entry: FileEntry
  onFileClick: (entry: FileEntry) => void
  depth: number
}

export function FileTreeNode({ entry, onFileClick, depth }: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState<FileEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (expanded && !loaded && entry.isDirectory) {
      loadChildren()
    }
  }, [expanded])

  const loadChildren = async () => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.readDir(entry.path)
    if (result.success && result.entries) {
      const filtered = result.entries.filter(
        (e) => e.isDirectory || e.name.endsWith('.md') || e.name.endsWith('.pdf')
      )
      setChildren(filtered)
    }
    setLoaded(true)
  }

  const handleClick = () => {
    if (entry.isDirectory) {
      setExpanded(!expanded)
    } else {
      onFileClick(entry)
    }
  }

  const isMd = entry.name.endsWith('.md')
  const isPdf = entry.name.endsWith('.pdf')

  return (
    <div>
      <div
        onClick={handleClick}
        className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-sidebar-hover text-sm transition-colors"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        title={entry.name}
      >
        {/* 展开/折叠箭头 (仅目录) */}
        {entry.isDirectory ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}

        {/* 图标 */}
        {entry.isDirectory ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 flex-shrink-0 ${
              expanded ? 'text-blue-400' : 'text-yellow-500'
            }`}
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            {expanded ? (
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v1z" />
            ) : (
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            )}
          </svg>
        ) : isPdf ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-red-400 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-blue-400 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        )}

        {/* 名称 */}
        <span className="truncate text-gray-700">{entry.name}</span>
      </div>

      {/* 子节点 */}
      {entry.isDirectory && expanded && (
        <div>
          {children.map((child) => (
            <FileTreeNode
              key={child.path}
              entry={child}
              onFileClick={onFileClick}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

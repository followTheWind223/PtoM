import type { FileEntry } from '../../types/electron'
import { FileTreeNode } from './FileTreeNode'

interface FileTreeProps {
  entries: FileEntry[]
  onFileClick: (entry: FileEntry) => void
}

export function FileTree({ entries, onFileClick }: FileTreeProps) {
  // 目录在前，文件在后；各自按名称排序
  const sorted = [...entries].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })

  if (sorted.length === 0) {
    return (
      <p className="text-xs text-gray-400 px-2 py-3">此目录为空</p>
    )
  }

  return (
    <div className="space-y-0.5">
      {sorted.map((entry) => (
        <FileTreeNode
          key={entry.path}
          entry={entry}
          onFileClick={onFileClick}
          depth={0}
        />
      ))}
    </div>
  )
}

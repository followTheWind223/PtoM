import { useState, useEffect, useCallback } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { FileTree } from '../FileTree/FileTree'
import type { FileEntry } from '../../types/electron'

export function Sidebar() {
  const { workspacePath, setWorkspacePath, openFile, addRecentFile } =
    useEditorStore()
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadDir = useCallback(async (dirPath: string) => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.readDir(dirPath)
    if (result.success && result.entries) {
      // 过滤：只显示 md 文件和目录
      const filtered = result.entries.filter(
        (e) => e.isDirectory || e.name.endsWith('.md') || e.name.endsWith('.pdf')
      )
      setEntries(filtered)
    } else {
      setError(result.error || '无法读取目录')
    }
  }, [])

  useEffect(() => {
    if (workspacePath) {
      loadDir(workspacePath)
    } else {
      setEntries([])
    }
  }, [workspacePath, loadDir])

  const handleOpenFolder = async () => {
    if (!window.electronAPI) return
    const dirPath = await window.electronAPI.openFolder()
    if (dirPath) {
      setWorkspacePath(dirPath)
      setError(null)
    }
  }

  const handleFileClick = async (entry: FileEntry) => {
    if (entry.isDirectory) return

    if (!window.electronAPI) return

    const result = await window.electronAPI.readFile(entry.path)
    if (result.success && result.content !== undefined) {
      openFile({
        path: entry.path,
        name: entry.name,
        content: result.content,
        isModified: false,
        isSourceMode: false,
      })
      addRecentFile(entry.path)
    }
  }

  return (
    <div className="h-full flex flex-col bg-sidebar-bg">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-gray-700">文件浏览</h2>
        <button
          onClick={handleOpenFolder}
          className="p-1 rounded hover:bg-sidebar-hover text-gray-500 hover:text-gray-700 transition-colors"
          title="打开文件夹"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto py-1">
        {!workspacePath ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 text-gray-300 mb-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            <p className="text-sm text-gray-400 mb-2">尚未打开工作目录</p>
            <button
              onClick={handleOpenFolder}
              className="text-xs text-blue-500 hover:text-blue-600 underline"
            >
              打开文件夹
            </button>
          </div>
        ) : error ? (
          <div className="px-4 py-3">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : (
          <div className="px-2">
            <div className="text-xs text-gray-400 px-2 py-1 truncate" title={workspacePath}>
              {workspacePath.split(/[/\\]/).pop() || workspacePath}
            </div>
            <FileTree entries={entries} onFileClick={handleFileClick} />
          </div>
        )}
      </div>

      {/* 底部状态 */}
      <div className="px-4 py-2 border-t border-sidebar-border">
        <PythonStatus />
      </div>
    </div>
  )
}

/** Python 服务状态指示器 */
function PythonStatus() {
  const [running, setRunning] = useState(false)

  useEffect(() => {
    async function check() {
      if (window.electronAPI) {
        const result = await window.electronAPI.checkPythonHealth()
        setRunning(result.running)
      }
    }
    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${
          running ? 'bg-green-400' : 'bg-gray-300'
        }`}
      />
      <span className="text-xs text-gray-400">
        {running ? 'PDF 转换就绪' : '转换服务未连接'}
      </span>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { FolderOpen, Folder, RefreshCw } from 'lucide-react'
import { useEditorStore } from '../../stores/editorStore'
import { useConvertStore } from '../../stores/convertStore'
import { FileTree } from '../FileTree/FileTree'
import { openFileFromPath, convertPdf } from '../../lib/fileOps'
import type { FileEntry } from '../../types/electron'

export function Sidebar() {
  const { workspacePath, setWorkspacePath } = useEditorStore()
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadDir = useCallback(async (dirPath: string) => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.readDir(dirPath)
    if (result.success && result.entries) {
      // 过滤：只显示 md/pdf 文件和目录
      const filtered = result.entries.filter(
        (e) =>
          e.isDirectory ||
          e.name.endsWith('.md') ||
          e.name.endsWith('.markdown') ||
          e.name.endsWith('.pdf')
      )
      setEntries(filtered)
      setError(null)
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
    if (entry.name.toLowerCase().endsWith('.pdf')) {
      // 点击 PDF：转换后打开
      await convertPdf(entry.path)
      // 转换会在工作目录生成 .md，刷新文件树
      if (workspacePath) loadDir(workspacePath)
    } else {
      await openFileFromPath(entry.path)
    }
  }

  return (
    <div className="h-full flex flex-col bg-sidebar-bg">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-sidebar-border">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          文件浏览
        </h2>
        <div className="flex items-center gap-0.5">
          {workspacePath && (
            <button
              onClick={() => loadDir(workspacePath)}
              className="p-1 rounded hover:bg-sidebar-hover text-gray-400 hover:text-gray-600 transition-colors"
              title="刷新"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleOpenFolder}
            className="p-1 rounded hover:bg-sidebar-hover text-gray-400 hover:text-gray-600 transition-colors"
            title="打开文件夹"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto py-1">
        {!workspacePath ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <Folder className="w-10 h-10 text-gray-300 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-gray-400 mb-2">尚未打开工作目录</p>
            <button
              onClick={handleOpenFolder}
              className="text-xs text-blue-500 hover:text-blue-600 underline underline-offset-2"
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
            <div
              className="text-xs text-gray-400 px-2 py-1 truncate font-medium"
              title={workspacePath}
            >
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
  const { pythonRunning, setPythonRunning } = useConvertStore()

  useEffect(() => {
    async function check() {
      if (window.electronAPI) {
        try {
          const result = await window.electronAPI.checkPythonHealth()
          setPythonRunning(result.running)
        } catch {
          setPythonRunning(false)
        }
      }
    }
    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [setPythonRunning])

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${
          pythonRunning ? 'bg-green-400' : 'bg-gray-300'
        }`}
      />
      <span className="text-xs text-gray-400">
        {pythonRunning ? 'PDF 转换就绪' : '转换服务未连接'}
      </span>
    </div>
  )
}

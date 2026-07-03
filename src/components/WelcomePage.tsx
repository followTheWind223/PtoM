import { useState, useCallback, DragEvent } from 'react'
import { useEditorStore } from '../stores/editorStore'
import { useConvertStore } from '../stores/convertStore'

export function WelcomePage() {
  const { openFile, addRecentFile, recentFiles, setWorkspacePath } = useEditorStore()
  const { status, setStatus, setProgress, setError, setResultMarkdown } =
    useConvertStore()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleOpenFile = async () => {
    if (!window.electronAPI) return
    const filePath = await window.electronAPI.openFile()
    if (filePath) {
      await openFileFromPath(filePath)
    }
  }

  const handleOpenFolder = async () => {
    if (!window.electronAPI) return
    const dirPath = await window.electronAPI.openFolder()
    if (dirPath) {
      setWorkspacePath(dirPath)
    }
  }

  const openFileFromPath = async (filePath: string) => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.readFile(filePath)
    if (result.success && result.content !== undefined) {
      const name = filePath.split(/[/\\]/).pop() || filePath
      openFile({
        path: filePath,
        name,
        content: result.content,
        isModified: false,
        isSourceMode: false,
      })
      addRecentFile(filePath)
    }
  }

  const convertPdf = async (pdfPath: string) => {
    if (!window.electronAPI) return

    setStatus('converting')
    setProgress('正在解析 PDF...')

    const result = await window.electronAPI.convertPdf(pdfPath)

    if (result.success && result.markdown) {
      setResultMarkdown(result.markdown)

      const name = pdfPath.split(/[/\\]/).pop()?.replace('.pdf', '.md') || 'converted.md'
      openFile({
        path: pdfPath.replace('.pdf', '.md'),
        name,
        content: result.markdown,
        isModified: true,
        isSourceMode: false,
      })
    } else {
      setError(result.error || '转换失败')
    }
  }

  const handleImportPdf = async () => {
    if (!window.electronAPI) return
    const pdfPath = await window.electronAPI.openFile({
      filters: [{ name: 'PDF 文件', extensions: ['pdf'] }],
    })
    if (!pdfPath) return
    await convertPdf(pdfPath)
  }

  // 拖拽事件处理
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      const filePath = (file as any).path // Electron 会暴露文件路径
      if (!filePath) continue

      if (file.name.endsWith('.pdf')) {
        await convertPdf(filePath)
      } else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        await openFileFromPath(filePath)
      }
    }
  }, [])

  return (
    <div
      className="h-full flex items-center justify-center bg-editor-bg"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-center max-w-md w-full px-8">
        {/* Logo / 图标 */}
        <div className="mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-20 h-20 mx-auto text-blue-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-gray-800 mb-2">PtoM</h1>
        <p className="text-gray-500 mb-8">PDF to Markdown 桌面文档浏览器</p>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleOpenFile}
            className="block w-full px-4 py-2.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            打开 Markdown 文件
          </button>

          <button
            onClick={handleOpenFolder}
            className="block w-full px-4 py-2.5 bg-white text-gray-700 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            打开文件夹
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-400">或者</span>
            </div>
          </div>

          <button
            onClick={handleImportPdf}
            disabled={status === 'converting'}
            className="block w-full px-4 py-2.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'converting' ? '正在转换...' : '导入 PDF 并转换'}
          </button>

          {/* 拖拽区域 */}
          <div
            className={`mt-6 p-8 border-2 border-dashed rounded-xl transition-colors ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300'
            }`}
          >
            {isDragOver ? (
              <p className="text-sm text-blue-500 font-medium">
                释放文件以导入
              </p>
            ) : (
              <div className="text-sm text-gray-400">
                <p>拖拽 PDF / Markdown 文件到此处</p>
                <p className="text-xs mt-1 text-gray-300">
                  或拖拽到编辑器窗口任意位置
                </p>
              </div>
            )}
          </div>

          {/* 转换错误提示 */}
          {status === 'error' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-left">
              {useConvertStore.getState().error}
            </div>
          )}
        </div>

        {/* 最近文件列表 */}
        {recentFiles.length > 0 && (
          <div className="mt-8 text-left">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              最近打开
            </h3>
            <div className="space-y-0.5">
              {recentFiles.map((filePath) => {
                const name = filePath.split(/[/\\]/).pop() || filePath
                return (
                  <button
                    key={filePath}
                    onClick={() => openFileFromPath(filePath)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors group"
                    title={filePath}
                  >
                    <div className="text-sm text-gray-700 truncate">{name}</div>
                    <div className="text-xs text-gray-400 truncate">{filePath}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

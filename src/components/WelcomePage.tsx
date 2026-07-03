import { useState, useCallback, DragEvent } from 'react'
import {
  FileText,
  FolderOpen,
  FileUp,
  Loader2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { useEditorStore } from '../stores/editorStore'
import { useConvertStore } from '../stores/convertStore'
import { openFileFromPath, convertPdf, handleDroppedFiles } from '../lib/fileOps'

export function WelcomePage() {
  const { recentFiles, setWorkspacePath } = useEditorStore()
  const { status, error } = useConvertStore()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleOpenFile = async () => {
    if (!window.electronAPI) return
    const filePath = await window.electronAPI.openFile()
    if (filePath) {
      if (filePath.toLowerCase().endsWith('.pdf')) {
        await convertPdf(filePath)
      } else {
        await openFileFromPath(filePath)
      }
    }
  }

  const handleOpenFolder = async () => {
    if (!window.electronAPI) return
    const dirPath = await window.electronAPI.openFolder()
    if (dirPath) {
      setWorkspacePath(dirPath)
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
    await handleDroppedFiles(Array.from(e.dataTransfer.files))
  }, [])

  const converting = status === 'converting'

  return (
    <div
      className="h-full overflow-y-auto bg-gradient-to-b from-gray-50 to-white"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="min-h-full flex items-center justify-center py-10">
        <div className="text-center max-w-md w-full px-8">
          {/* Logo */}
          <div className="mb-5 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-50">
            <FileText className="w-10 h-10 text-blue-500" strokeWidth={1.5} />
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-1.5 tracking-tight">PtoM</h1>
          <p className="text-sm text-gray-400 mb-8">
            PDF to Markdown · 类 Typora 的桌面文档浏览器
          </p>

          {/* 拖拽 / 导入区域 */}
          <button
            onClick={handleImportPdf}
            disabled={converting}
            className={`w-full p-8 border-2 border-dashed rounded-2xl transition-all text-center group ${
              isDragOver
                ? 'border-blue-400 bg-blue-50 scale-[1.02]'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
            } ${converting ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
          >
            {converting ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500">正在转换 PDF，请稍候...</p>
              </div>
            ) : isDragOver ? (
              <div className="flex flex-col items-center gap-2">
                <FileUp className="w-8 h-8 text-blue-500" />
                <p className="text-sm text-blue-600 font-medium">释放文件以导入</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileUp className="w-8 h-8 text-gray-300 group-hover:text-blue-400 transition-colors" />
                <p className="text-sm text-gray-500">
                  <span className="text-blue-500 font-medium">点击导入 PDF</span>
                  ，或拖拽文件到此处
                </p>
                <p className="text-xs text-gray-300">支持 PDF / Markdown 文件</p>
              </div>
            )}
          </button>

          {/* 转换错误提示 */}
          {status === 'error' && error && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-left">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 次要操作 */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleOpenFile}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-600 text-sm rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-gray-400" />
              打开文件
            </button>
            <button
              onClick={handleOpenFolder}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-600 text-sm rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-gray-400" />
              打开文件夹
            </button>
          </div>

          {/* 最近文件列表 */}
          {recentFiles.length > 0 && (
            <div className="mt-8 text-left">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                <Clock className="w-3 h-3" />
                最近打开
              </h3>
              <div className="space-y-0.5">
                {recentFiles.slice(0, 5).map((filePath) => {
                  const name = filePath.split(/[/\\]/).pop() || filePath
                  return (
                    <button
                      key={filePath}
                      onClick={() => openFileFromPath(filePath)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
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
    </div>
  )
}

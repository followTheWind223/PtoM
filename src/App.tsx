import { useEffect, useCallback, useState } from 'react'
import { FileUp } from 'lucide-react'
import { useEditorStore } from './stores/editorStore'
import { useConvertStore } from './stores/convertStore'
import { Sidebar } from './components/layout/Sidebar'
import { MainArea } from './components/layout/MainArea'
import { WelcomePage } from './components/WelcomePage'
import {
  openFileFromPath,
  convertPdf,
  handleDroppedFiles,
  saveActiveFile,
  saveActiveFileAs,
} from './lib/fileOps'

export default function App() {
  const { openFiles, sidebarVisible } = useEditorStore()
  const { setPythonRunning } = useConvertStore()
  const [isGlobalDragOver, setIsGlobalDragOver] = useState(false)

  // 启动时检查 Python 服务状态
  useEffect(() => {
    async function checkPython() {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.checkPythonHealth()
          setPythonRunning(result.running)
        }
      } catch {
        setPythonRunning(false)
      }
    }
    checkPython()
  }, [setPythonRunning])

  // 监听菜单事件（经由 preload 的 onMenu 订阅，contextIsolation 下无法直接访问 ipcRenderer）
  useEffect(() => {
    const api = window.electronAPI
    if (!api?.onMenu) return

    const unsubscribers = [
      api.onMenu('menu:openFile', async () => {
        const filePath = await api.openFile()
        if (!filePath) return
        if (filePath.toLowerCase().endsWith('.pdf')) {
          await convertPdf(filePath)
        } else {
          await openFileFromPath(filePath)
        }
      }),
      api.onMenu('menu:openFolder', async () => {
        const dirPath = await api.openFolder()
        if (dirPath) {
          useEditorStore.getState().setWorkspacePath(dirPath)
        }
      }),
      api.onMenu('menu:importPdf', async () => {
        const pdfPath = await api.openFile({
          filters: [{ name: 'PDF 文件', extensions: ['pdf'] }],
        })
        if (pdfPath) {
          await convertPdf(pdfPath)
        }
      }),
      api.onMenu('menu:save', () => {
        saveActiveFile()
      }),
      api.onMenu('menu:saveAs', () => {
        saveActiveFileAs()
      }),
      api.onMenu('menu:toggleSidebar', () => {
        useEditorStore.getState().toggleSidebar()
      }),
      api.onMenu('menu:toggleSourceMode', () => {
        const state = useEditorStore.getState()
        const currentFile = state.openFiles[state.activeIndex]
        if (currentFile) {
          state.toggleSourceMode(currentFile.path)
        }
      }),
      api.onMenu('menu:togglePreviewMode', () => {
        const state = useEditorStore.getState()
        const currentFile = state.openFiles[state.activeIndex]
        if (currentFile) {
          state.togglePreviewMode(currentFile.path)
        }
      }),
    ]

    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  }, [])

  // 全局拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setIsGlobalDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // 仅在真正离开窗口时取消高亮
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsGlobalDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsGlobalDragOver(false)
    await handleDroppedFiles(Array.from(e.dataTransfer.files))
  }, [])

  const hasOpenFiles = openFiles.length > 0

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 侧边栏 */}
      <div
        className={`sidebar-transition flex-shrink-0 border-r border-sidebar-border ${
          sidebarVisible ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <Sidebar />
      </div>

      {/* 主编辑区 */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {hasOpenFiles ? <MainArea /> : <WelcomePage />}

        {/* 全局拖拽覆盖层 */}
        {isGlobalDragOver && (
          <div className="absolute inset-4 z-50 bg-blue-500/5 backdrop-blur-[2px] border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-2xl shadow-xl px-8 py-6 text-center">
              <FileUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-base font-semibold text-gray-700">释放文件以导入</p>
              <p className="text-xs text-gray-400 mt-1">
                PDF 自动转换为 Markdown · MD 直接打开
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

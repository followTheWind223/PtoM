import { Loader2, FileText, AlertCircle, X } from 'lucide-react'
import { useEditorStore, type ViewMode } from '../../stores/editorStore'
import { useConvertStore } from '../../stores/convertStore'
import { TabBar } from '../TabBar/TabBar'
import { Toolbar } from '../Toolbar/Toolbar'
import { MarkdownEditor } from '../Editor/MarkdownEditor'

const MODE_LABELS: Record<ViewMode, string> = {
  wysiwyg: '编辑模式',
  source: '源码模式',
  preview: '浏览模式',
}

/** 粗略字数统计：中日韩字符按字计，其他按空白分词 */
function countWords(text: string): number {
  const cjk = text.match(/[一-鿿぀-ヿ가-힯]/g)?.length || 0
  const nonCjk = text
    .replace(/[一-鿿぀-ヿ가-힯]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return cjk + nonCjk
}

export function MainArea() {
  const { openFiles, activeIndex } = useEditorStore()
  const { status, progress, error, reset } = useConvertStore()
  const currentFile =
    activeIndex >= 0 && activeIndex < openFiles.length
      ? openFiles[activeIndex]
      : null

  return (
    <div className="h-full flex flex-col">
      {/* 标签栏 */}
      <TabBar />

      {/* 工具栏 */}
      <Toolbar />

      {/* 编辑器区域 — 使用 visibility 而非 display:none，保持 ProseMirror 的 DOM 测量 */}
      <div className="flex-1 overflow-hidden relative">
        {openFiles.map((file, index) => {
          const isActive = index === activeIndex
          return (
            <div
              key={file.path}
              className="absolute inset-0"
              style={{
                visibility: isActive ? 'visible' : 'hidden',
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              <MarkdownEditor
                file={file}
                onChange={(content) => {
                  useEditorStore.getState().updateContent(file.path, content)
                  useEditorStore.getState().markModified(file.path, true)
                }}
                isActive={isActive}
              />
            </div>
          )
        })}

        {/* 转换进度覆盖层 */}
        {status === 'converting' && (
          <div className="absolute inset-x-0 top-4 z-40 flex justify-center pointer-events-none">
            <div className="flex items-center gap-3 bg-white rounded-full shadow-lg border border-gray-100 pl-3 pr-5 py-2">
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-sm text-gray-600">{progress || '正在转换 PDF...'}</span>
            </div>
          </div>
        )}

        {/* 转换错误提示 */}
        {status === 'error' && error && (
          <div className="absolute inset-x-0 top-4 z-40 flex justify-center">
            <div className="flex items-center gap-2 bg-red-50 rounded-lg shadow-lg border border-red-200 pl-3 pr-2 py-2 max-w-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600 truncate">{error}</span>
              <button
                onClick={reset}
                className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      {currentFile && (
        <div className="flex items-center justify-between px-4 py-1 border-t border-gray-200 bg-gray-50 text-xs text-gray-400 select-none">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-3 h-3 flex-shrink-0" />
            <span className="truncate" title={currentFile.path}>
              {currentFile.path}
            </span>
            {currentFile.isModified && (
              <span className="text-orange-500 flex-shrink-0">● 未保存</span>
            )}
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span>{countWords(currentFile.content)} 字</span>
            <span>{MODE_LABELS[currentFile.mode]}</span>
          </div>
        </div>
      )}
    </div>
  )
}

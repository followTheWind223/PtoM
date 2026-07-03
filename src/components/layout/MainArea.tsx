import { useEditorStore } from '../../stores/editorStore'
import { TabBar } from '../TabBar/TabBar'
import { Toolbar } from '../Toolbar/Toolbar'
import { MarkdownEditor } from '../Editor/MarkdownEditor'

export function MainArea() {
  const { openFiles, activeIndex } = useEditorStore()
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
      </div>

      {/* 底部状态栏 */}
      {currentFile && (
        <div className="flex items-center justify-between px-4 py-1 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 select-none">
          <div className="flex items-center gap-3">
            <span>{currentFile.path}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{currentFile.isSourceMode ? '源码模式' : '预览模式'}</span>
            {currentFile.isModified && (
              <span className="text-orange-500">● 已修改</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

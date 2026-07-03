import { useEditorStore } from '../../stores/editorStore'

export function TabBar() {
  const { openFiles, activeIndex, setActiveFile, closeFile } = useEditorStore()

  if (openFiles.length === 0) return null

  const handleClose = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    closeFile(openFiles[index].path)
  }

  return (
    <div className="flex items-center bg-gray-100 border-b border-gray-200 overflow-x-auto select-none">
      <div className="flex flex-nowrap">
        {openFiles.map((file, index) => {
          const isActive = index === activeIndex
          return (
            <div
              key={file.path}
              onClick={() => setActiveFile(index)}
              className={`
                group flex items-center gap-1.5 px-3 py-2 text-sm cursor-pointer
                border-r border-gray-200 min-w-0 max-w-48
                transition-colors
                ${
                  isActive
                    ? 'bg-editor-bg text-gray-800 border-t-2 border-t-blue-500'
                    : 'text-gray-600 hover:bg-gray-200 border-t-2 border-t-transparent'
                }
              `}
              title={file.path}
            >
              {/* 文件图标 */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 flex-shrink-0 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>

              {/* 文件名 */}
              <span className="truncate">{file.name}</span>

              {/* 修改指示器 */}
              {file.isModified && (
                <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
              )}

              {/* 关闭按钮 */}
              <button
                onClick={(e) => handleClose(e, index)}
                className="
                  flex-shrink-0 p-0.5 rounded hover:bg-gray-300
                  opacity-0 group-hover:opacity-100 transition-opacity
                  text-gray-500 hover:text-gray-700
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

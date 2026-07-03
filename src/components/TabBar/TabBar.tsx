import { FileText, X } from 'lucide-react'
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
              onAuxClick={(e) => {
                // 中键点击关闭标签
                if (e.button === 1) handleClose(e, index)
              }}
              className={`
                group flex items-center gap-1.5 px-3 py-1.5 text-[13px] cursor-pointer
                border-r border-gray-200 min-w-0 max-w-48
                transition-colors
                ${
                  isActive
                    ? 'bg-white text-gray-800 shadow-[inset_0_2px_0_0_theme(colors.blue.500)]'
                    : 'text-gray-500 hover:bg-gray-200/70'
                }
              `}
              title={file.path}
            >
              <FileText
                className={`w-3.5 h-3.5 flex-shrink-0 ${
                  isActive ? 'text-blue-500' : 'text-gray-400'
                }`}
              />

              {/* 文件名 */}
              <span className="truncate">{file.name}</span>

              {/* 修改指示器 / 关闭按钮（悬停切换） */}
              <span className="relative w-4 h-4 flex-shrink-0 flex items-center justify-center">
                {file.isModified && (
                  <span className="absolute w-2 h-2 rounded-full bg-orange-400 group-hover:opacity-0 transition-opacity" />
                )}
                <button
                  onClick={(e) => handleClose(e, index)}
                  className={`
                    absolute inset-0 flex items-center justify-center rounded
                    hover:bg-gray-300 text-gray-400 hover:text-gray-700
                    transition-opacity
                    ${file.isModified ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  `}
                  title="关闭"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

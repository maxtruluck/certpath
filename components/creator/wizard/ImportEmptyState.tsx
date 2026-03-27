'use client'

export default function ImportEmptyState({
  onImport,
  onStartFromScratch,
}: {
  onImport: () => void
  onStartFromScratch: () => void
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex gap-5 max-w-xl w-full">
        {/* Import content -- primary */}
        <button
          onClick={onImport}
          className="flex-1 p-6 rounded-2xl border-2 border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-blue-600">
              <path d="M10 2v12M6 10l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 14v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[#2C2825] mb-1">Import content</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Upload files, paste text, or import from YouTube. AI will structure your content into lessons.
          </p>
        </button>

        {/* Start from scratch -- secondary */}
        <button
          onClick={onStartFromScratch}
          className="flex-1 p-6 rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-500">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[#2C2825] mb-1">Start from scratch</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Create modules and lessons manually. Build your course one lesson at a time.
          </p>
        </button>
      </div>
    </div>
  )
}

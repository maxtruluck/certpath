'use client'

export type ImportStep = 'extracting' | 'structuring' | 'inserting' | 'done' | 'error'

const STEPS: { key: ImportStep; label: string }[] = [
  { key: 'extracting', label: 'Extracting content...' },
  { key: 'structuring', label: 'Structuring your course...' },
  { key: 'inserting', label: 'Creating modules and lessons...' },
  { key: 'done', label: 'Done! Loading editor...' },
]

export default function ImportProcessingOverlay({
  currentStep,
  errorMessage,
  onCancel,
}: {
  currentStep: ImportStep
  errorMessage?: string
  onCancel: () => void
}) {
  const currentIdx = STEPS.findIndex(s => s.key === currentStep)
  const isError = currentStep === 'error'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 mx-4">
        <h3 className="text-lg font-bold text-[#2C2825] mb-6">
          {isError ? 'Import failed' : 'Importing your content'}
        </h3>

        {isError ? (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">{errorMessage || 'Something went wrong. Please try again.'}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {STEPS.map((step, idx) => {
              const isActive = idx === currentIdx
              const isComplete = idx < currentIdx
              const isPending = idx > currentIdx

              return (
                <div key={step.key} className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {isComplete ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <circle cx="9" cy="9" r="8" fill="#22C55E" />
                        <path d="M5.5 9L8 11.5L12.5 6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : isActive ? (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                    )}
                  </div>
                  {/* Label */}
                  <span className={`text-sm ${
                    isActive ? 'text-[#2C2825] font-medium' :
                    isComplete ? 'text-gray-400' :
                    'text-gray-300'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-2"
          >
            {isError ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

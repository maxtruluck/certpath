'use client'

import { useState, useRef } from 'react'

type Tab = 'upload' | 'paste' | 'youtube'

export default function ImportModal({
  courseId,
  courseTitle,
  category,
  onClose,
  onImportStart,
  onImportComplete,
  onImportError,
}: {
  courseId: string
  courseTitle: string
  category: string
  onClose: () => void
  onImportStart: () => void
  onImportComplete: (result: { modules_created: number; lessons_created: number }) => void
  onImportError: (error: string) => void
}) {
  const [activeTab, setActiveTab] = useState<Tab>('upload')
  const [files, setFiles] = useState<File[]>([])
  const [pasteText, setPasteText] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ACCEPTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ]
  const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md']

  const isValidFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext || '')
  }

  const handleFiles = (newFiles: FileList | File[]) => {
    const valid = Array.from(newFiles).filter(isValidFile)
    setFiles(prev => [...prev, ...valid])
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const canSubmit = () => {
    if (activeTab === 'upload') return files.length > 0
    if (activeTab === 'paste') return pasteText.trim().length > 0
    if (activeTab === 'youtube') return youtubeUrl.trim().length > 0
    return false
  }

  const handleSubmit = async () => {
    onImportStart()
    onClose()

    try {
      const formData = new FormData()
      formData.append('course_title', courseTitle)
      formData.append('category', category)

      if (activeTab === 'upload') {
        formData.append('import_type', 'file')
        for (const file of files) {
          formData.append('files', file)
        }
      } else if (activeTab === 'paste') {
        formData.append('import_type', 'paste')
        formData.append('text', pasteText)
      } else if (activeTab === 'youtube') {
        formData.append('import_type', 'youtube')
        formData.append('url', youtubeUrl)
      }

      const res = await fetch(`/api/creator/courses/${courseId}/import`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        onImportError(data.error || 'Import failed')
        return
      }

      onImportComplete(data)
    } catch {
      onImportError('Import failed. Please try again.')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'paste', label: 'Paste' },
    { key: 'youtube', label: 'YouTube' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2C2825]">Import content</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-1 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-6 py-5">
          {/* Upload tab */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                multiple
                className="hidden"
                onChange={e => { if (e.target.files) handleFiles(e.target.files) }}
              />
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setDragOver(false)
                  if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 text-gray-300">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="text-sm font-medium text-gray-600">Drop files here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, MD -- max 10MB per file</p>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-400 flex-shrink-0">
                          <path d="M3 1h5l4 4v8H3V1z" stroke="currentColor" strokeWidth="1" />
                        </svg>
                        <span className="text-xs text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-400">{formatSize(file.size)}</span>
                      </div>
                      <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500 p-0.5">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 2l8 8M2 10l8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paste tab */}
          {activeTab === 'paste' && (
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Paste your notes, outlines, transcripts, or any text..."
              rows={8}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              autoFocus
            />
          )}

          {/* YouTube tab */}
          {activeTab === 'youtube' && (
            <div>
              <input
                type="url"
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-2">Paste a YouTube video or playlist URL</p>
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">YouTube import coming soon. Use Upload or Paste for now.</p>
              </div>
            </div>
          )}
        </div>

        {/* Helper text */}
        <div className="px-6 pb-2">
          <p className="text-xs text-gray-400">
            AI will organize your content into modules, lessons, and sections. You'll review everything before publishing.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-2">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit() || activeTab === 'youtube'}
            className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {activeTab === 'youtube' ? 'Import from YouTube' : 'Import & Structure'}
          </button>
        </div>
      </div>
    </div>
  )
}

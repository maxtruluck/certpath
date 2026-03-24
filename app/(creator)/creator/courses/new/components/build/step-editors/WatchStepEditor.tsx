'use client'

interface WatchStepEditorProps {
  content: { url: string }
  onChange: (content: { url: string }) => void
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vim = url.match(/vimeo\.com\/(\d+)/)
  if (vim) return `https://player.vimeo.com/video/${vim[1]}`
  return null
}

export default function WatchStepEditor({ content, onChange }: WatchStepEditorProps) {
  const embedUrl = getEmbedUrl(content.url || '')

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">Video URL</label>
      <input
        type="text"
        value={content.url || ''}
        onChange={e => onChange({ url: e.target.value.trim() })}
        placeholder="https://youtube.com/watch?v=..."
        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        autoFocus
      />
      {embedUrl && (
        <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      )}
      {content.url && !embedUrl && (
        <p className="mt-2 text-xs text-amber-600">Enter a YouTube or Vimeo URL to see preview</p>
      )}
    </div>
  )
}

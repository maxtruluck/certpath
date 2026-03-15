'use client'

import { useState, useEffect, useCallback } from 'react'

interface AuditEntry {
  id: string
  action: string
  target_type: string
  target_id: string
  metadata: Record<string, any>
  created_at: string
  admin?: { display_name: string }
}

const actionLabels: Record<string, string> = {
  'creator.approve': 'Approved Creator',
  'creator.reject': 'Rejected Creator',
  'creator.suspend': 'Suspended Creator',
  'creator.unsuspend': 'Unsuspended Creator',
  'course.approve': 'Approved Course',
  'course.reject': 'Rejected Course',
  'course.archive': 'Archived Course',
}

const actionColors: Record<string, string> = {
  'creator.approve': 'text-green-600',
  'creator.reject': 'text-red-600',
  'creator.suspend': 'text-red-600',
  'creator.unsuspend': 'text-green-600',
  'course.approve': 'text-green-600',
  'course.reject': 'text-red-600',
  'course.archive': 'text-orange-600',
}

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const fetchAudit = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      const res = await fetch(`/api/admin/audit?${params}`)
      const data = await res.json()
      setEntries(data.entries || [])
      setTotal(data.total || 0)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchAudit() }, [fetchAudit])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-400">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">No audit entries yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {entries.map(entry => (
              <div key={entry.id} className="px-6 py-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {entry.admin?.display_name || 'Admin'}
                    </span>
                    <span className={`text-sm font-medium ${actionColors[entry.action] || 'text-gray-600'}`}>
                      {actionLabels[entry.action] || entry.action}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 capitalize">{entry.target_type}</span>
                    <span className="text-xs text-gray-300 font-mono">{entry.target_id.slice(0, 8)}...</span>
                    {entry.metadata?.previous_status && (
                      <span className="text-xs text-gray-400">
                        {entry.metadata.previous_status} &rarr; {entry.metadata.new_status}
                      </span>
                    )}
                  </div>
                  {entry.metadata?.reason && (
                    <p className="text-sm text-gray-500 mt-1">
                      Reason: {entry.metadata.reason}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 50 >= total}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

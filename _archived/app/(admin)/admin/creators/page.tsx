'use client'

import { useState, useEffect, useCallback } from 'react'

interface Creator {
  id: string
  user_id: string
  creator_name: string
  bio: string
  expertise_areas: string[]
  credentials: string
  status: string
  created_at: string
  profile?: { display_name: string; avatar_url: string | null; role: string }
}

const STATUS_TABS = ['all', 'pending', 'approved', 'suspended', 'rejected']

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  rejected: 'bg-gray-100 text-gray-800',
}

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchCreators = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: activeTab, page: String(page), limit: '20' })
      const res = await fetch(`/api/admin/creators?${params}`)
      const data = await res.json()
      setCreators(data.creators || [])
      setTotal(data.total || 0)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [activeTab, page])

  useEffect(() => { fetchCreators() }, [fetchCreators])

  const handleAction = async (creatorId: string, action: string, reason?: string) => {
    setActionLoading(creatorId)
    try {
      const body = reason ? JSON.stringify({ reason }) : undefined
      await fetch(`/api/admin/creators/${creatorId}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      await fetchCreators()
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  const promptAndAction = (creatorId: string, action: string) => {
    const reason = window.prompt(`Reason for ${action}:`)
    if (reason !== null && reason.trim()) {
      handleAction(creatorId, action, reason)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Creator Management</h1>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1) }}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Creator</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Expertise</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Applied</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : creators.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No creators found</td></tr>
            ) : creators.map(creator => (
              <tr key={creator.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{creator.creator_name}</p>
                  <p className="text-sm text-gray-500 truncate max-w-xs">{creator.bio}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {(creator.expertise_areas || []).slice(0, 3).map(area => (
                      <span key={area} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                        {area}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[creator.status] || 'bg-gray-100 text-gray-800'}`}>
                    {creator.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(creator.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {creator.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(creator.id, 'approve')}
                          disabled={actionLoading === creator.id}
                          className="text-xs font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => promptAndAction(creator.id, 'reject')}
                          disabled={actionLoading === creator.id}
                          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {creator.status === 'approved' && (
                      <button
                        onClick={() => promptAndAction(creator.id, 'suspend')}
                        disabled={actionLoading === creator.id}
                        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    )}
                    {creator.status === 'suspended' && (
                      <button
                        onClick={() => handleAction(creator.id, 'unsuspend')}
                        disabled={actionLoading === creator.id}
                        className="text-xs font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        Unsuspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
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
              disabled={page * 20 >= total}
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

'use client'

import { useState, useEffect, useCallback } from 'react'

interface Job {
  id: string
  status: string
  progress: number
  current_step: string | null
  error: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  course?: { id: string; title: string; slug: string }
  creator?: { id: string; creator_name: string }
}

const STATUS_TABS = ['all', 'pending', 'processing', 'complete', 'failed']

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  processing: 'bg-blue-100 text-blue-800',
  complete: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [expandedJob, setExpandedJob] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: activeTab, page: String(page), limit: '20' })
      const res = await fetch(`/api/admin/jobs?${params}`)
      const data = await res.json()
      setJobs(data.jobs || [])
      setTotal(data.total || 0)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [activeTab, page])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Processing Jobs</h1>

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
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Creator</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Progress</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No jobs found</td></tr>
            ) : jobs.map(job => (
              <>
                <tr
                  key={job.id}
                  className={`hover:bg-gray-50 ${job.error ? 'cursor-pointer' : ''}`}
                  onClick={() => job.error && setExpandedJob(expandedJob === job.id ? null : job.id)}
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{job.course?.title || '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {job.creator?.creator_name || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[job.status] || 'bg-gray-100 text-gray-800'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${job.status === 'failed' ? 'bg-red-500' : job.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{job.progress}%</span>
                    </div>
                    {job.current_step && job.status === 'processing' && (
                      <p className="text-xs text-gray-400 mt-1">{job.current_step}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                </tr>
                {expandedJob === job.id && job.error && (
                  <tr key={`${job.id}-error`}>
                    <td colSpan={5} className="px-6 py-4 bg-red-50">
                      <p className="text-sm font-medium text-red-700">Error:</p>
                      <p className="text-sm text-red-600 mt-1 font-mono whitespace-pre-wrap">{job.error}</p>
                    </td>
                  </tr>
                )}
              </>
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

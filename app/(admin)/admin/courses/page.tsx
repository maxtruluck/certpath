'use client'

import { useState, useEffect, useCallback } from 'react'

interface Course {
  id: string
  title: string
  slug: string
  status: string
  category: string
  difficulty: string
  updated_at: string
  question_count: number
  creator?: { id: string; creator_name: string }
}

const STATUS_TABS = ['all', 'draft', 'in_review', 'published', 'archived']

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  in_review: 'In Review',
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: activeTab, page: String(page), limit: '20' })
      const res = await fetch(`/api/admin/courses?${params}`)
      const data = await res.json()
      setCourses(data.courses || [])
      setTotal(data.total || 0)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [activeTab, page])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  const handleAction = async (courseId: string, action: string, reason?: string) => {
    setActionLoading(courseId)
    try {
      const body = reason ? JSON.stringify({ reason }) : undefined
      await fetch(`/api/admin/courses/${courseId}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      await fetchCourses()
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  const promptAndAction = (courseId: string, action: string) => {
    const reason = window.prompt(`Reason for ${action}:`)
    if (reason !== null && reason.trim()) {
      handleAction(courseId, action, reason)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1) }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {statusLabels[tab] || tab.charAt(0).toUpperCase() + tab.slice(1)}
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
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Questions</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Updated</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : courses.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No courses found</td></tr>
            ) : courses.map(course => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{course.title}</p>
                  <p className="text-xs text-gray-400 capitalize">{course.category} &middot; {course.difficulty}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {course.creator?.creator_name || '—'}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[course.status] || 'bg-gray-100 text-gray-800'}`}>
                    {statusLabels[course.status] || course.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{course.question_count}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(course.updated_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {course.status === 'in_review' && (
                      <>
                        <button
                          onClick={() => handleAction(course.id, 'approve')}
                          disabled={actionLoading === course.id}
                          className="text-xs font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => promptAndAction(course.id, 'reject')}
                          disabled={actionLoading === course.id}
                          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {course.status === 'published' && (
                      <button
                        onClick={() => handleAction(course.id, 'archive')}
                        disabled={actionLoading === course.id}
                        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Archive
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

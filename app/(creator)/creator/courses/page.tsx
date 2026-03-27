'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CourseItem {
  id: string
  title: string
  slug: string
  status: string
  category: string
  difficulty: string
  module_count: number
  lesson_count: number
  question_count: number
  student_count: number
  created_at: string
  updated_at: string
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-green-50 text-green-700',
    archived: 'bg-red-50 text-red-600',
  }
  const labels: Record<string, string> = {
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  )
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/creator/dashboard')
      .then(r => r.json())
      .then(d => {
        setCourses(d.courses || [])
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredCourses = filter === 'all' ? courses : courses.filter(c => c.status === filter)

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/creator/courses/new"
          className="px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Create New Course
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'published', label: 'Published' },
          { key: 'draft', label: 'Drafts' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f.key
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-100 border border-transparent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Course List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {filteredCourses.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 mb-4">No courses found.</p>
            <Link href="/creator/courses/new" className="text-blue-500 hover:text-blue-700 text-sm font-medium">
              Create your first course
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCourses.map(course => (
              <div key={course.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{course.title}</h3>
                    <StatusBadge status={course.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{course.question_count} questions</span>
                    <span>{course.module_count} modules</span>
                    <span>{course.lesson_count} lessons</span>
                    {course.student_count > 0 && <span>{course.student_count.toLocaleString()} students</span>}
                    <span className="text-gray-300">|</span>
                    <span>{course.category}</span>
                    <span>{course.difficulty}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/creator/courses/${course.id}/edit`}
                    className="text-sm text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </Link>
                  {course.status === 'published' && (
                    <Link
                      href={`/course/${course.slug}`}
                      className="text-sm text-gray-400 hover:text-gray-600 font-medium"
                    >
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

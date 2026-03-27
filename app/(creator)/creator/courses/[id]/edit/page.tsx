'use client'

import { use } from 'react'
import { redirect } from 'next/navigation'

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  // Redirect to the wizard with the edit query param
  // The wizard page handles loading the course data
  redirect(`/creator/courses/new?edit=${id}`)
}

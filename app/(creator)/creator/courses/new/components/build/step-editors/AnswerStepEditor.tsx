'use client'

import QuestionForm from '../QuestionForm'
import type { AnswerStepContent } from '../QuestionForm'

interface AnswerStepEditorProps {
  content: AnswerStepContent
  onChange: (content: AnswerStepContent) => void
}

export default function AnswerStepEditor({ content, onChange }: AnswerStepEditorProps) {
  return (
    <QuestionForm
      mode="edit"
      value={content}
      onChange={onChange}
    />
  )
}

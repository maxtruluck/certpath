export type StepType = 'read' | 'watch' | 'answer' | 'graph' | 'embed' | 'callout'

export interface Step {
  id: string
  lesson_id: string
  sort_order: number
  step_type: StepType
  title: string | null
  content: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface Lesson {
  id: string
  module_id: string
  course_id?: string
  title: string
  display_order: number
  created_at?: string
  updated_at?: string
  question_count: number
  word_count: number
  step_count: number
}

export interface Module {
  id: string
  title: string
  display_order: number
  lessons: Lesson[]
}

export interface Question {
  id: string
  question_text: string
  question_type: string
  options: { id: string; text: string }[]
  correct_option_ids: string[]
  explanation: string
  difficulty: number
  tags: string[]
  option_explanations?: Record<string, string> | null
  acceptable_answers?: string[] | null
  match_mode?: string
  correct_order?: string[] | null
  matching_pairs?: { left: string; right: string }[] | null
  lesson_id?: string | null
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function hasContent(lesson: Lesson): boolean {
  return lesson.step_count > 0 || lesson.question_count > 0
}

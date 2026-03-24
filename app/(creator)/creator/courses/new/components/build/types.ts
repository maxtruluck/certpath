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
  title: string
  body: string | null
  video_url: string | null
  display_order: number
  module_id: string
  question_count: number
  word_count: number
  step_count: number
}

export interface Module {
  id: string
  title: string
  display_order: number
  lessons: Lesson[]
  question_count: number
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

export function getContentType(lesson: Lesson): 'video' | 'text' | 'empty' {
  if (lesson.video_url && lesson.video_url.trim()) return 'video'
  if (lesson.body && lesson.body.trim().length > 0) return 'text'
  return 'empty'
}

export function hasContent(lesson: Lesson): boolean {
  return lesson.step_count > 0 || getContentType(lesson) !== 'empty' || lesson.question_count > 0
}

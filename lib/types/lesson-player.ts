// Shared types for the lesson player and step components

export type StepType = 'read' | 'watch' | 'answer' | 'embed' | 'callout'
export type CalloutVariant = 'tip' | 'warning' | 'key_concept' | 'exam_note'
export type EmbedSubType = 'math_graph' | 'image' | 'diagram'

export interface Question {
  id: string
  domain_id?: string
  topic_id?: string
  certification_id?: string
  course_id?: string
  question_text: string
  question_type: string
  options: { id: string; text: string }[]
  correct_option_ids: string[]
  explanation: string
  difficulty?: number
  tags?: string[]
  module_title?: string
  matching_items?: { lefts: string[]; rights: string[] }
  difficulty_label?: 'easy' | 'medium' | 'challenging'
  lesson_id?: string | null
}

export interface AnswerResult {
  is_correct: boolean
  correct_option_ids: string[]
  explanation: string
  option_explanation?: string | null
  linked_lesson?: { title: string; body: string } | null
  correct_order?: string[]
  matching_pairs?: { left: string; right: string }[]
  acceptable_answers?: string[]
}

export interface LessonStep {
  index: number
  stepType: StepType
  title: string
  content: ReadContent | WatchContent | AnswerContent | EmbedContent | CalloutContent
}

export interface ReadContent {
  markdown: string
  video_url?: string | null
}

export interface WatchContent {
  url: string
}

export interface AnswerContent {
  question: Question
}

export interface EmbedContent {
  sub_type: EmbedSubType
  graph_data?: import('@/lib/coordinate-diagram').DiagramData
  url?: string
  alt?: string
  caption?: string
  mermaid?: string
}

export interface CalloutContent {
  callout_style: CalloutVariant
  title: string
  markdown: string
}

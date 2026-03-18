// ─── Course Format Types & Config ────────────────────────────────

export type CourseFormat = 'certification' | 'academic' | 'software_tools' | 'skills' | 'compliance' | 'language_vocab' | 'blank'

export type BloomsLevel = 'remember' | 'understand' | 'apply' | 'analyze'

export interface CourseFormatGuidance {
  questionsPerLesson: { minimum: number; recommended: number }
  contentBlocksPerLesson: { minimum: number; recommended: number }
  suggestedBlockTypes: string[]
  suggestedQuestionTypes: string[]
  bloomsDistribution: Record<BloomsLevel, number> // target percentages
  tips: string[]
}

export interface SuggestedModule {
  title: string
  lessons: string[]
}

export interface CourseFormatConfig {
  label: string
  icon: string
  description: string
  defaults: { category: string; difficulty: string }
  suggestedStructure: SuggestedModule[]
  guidance: CourseFormatGuidance
}

export const COURSE_FORMATS: Record<CourseFormat, CourseFormatConfig> = {
  certification: {
    label: 'Certification Prep',
    icon: 'certification',
    description: 'Prepare learners for a professional certification exam with domain-aligned modules and exam-style questions.',
    defaults: { category: 'certification', difficulty: 'intermediate' },
    suggestedStructure: [
      { title: 'Module 1: Core Concepts', lessons: ['Fundamentals', 'Key Terminology', 'Core Principles'] },
      { title: 'Module 2: Implementation', lessons: ['Planning & Design', 'Deployment', 'Configuration'] },
      { title: 'Module 3: Operations & Management', lessons: ['Monitoring', 'Maintenance', 'Troubleshooting'] },
    ],
    guidance: {
      questionsPerLesson: { minimum: 10, recommended: 15 },
      contentBlocksPerLesson: { minimum: 2, recommended: 4 },
      suggestedBlockTypes: ['concept', 'definition', 'exam_tip', 'key_takeaway'],
      suggestedQuestionTypes: ['multiple_choice', 'multiple_select', 'true_false'],
      bloomsDistribution: { remember: 25, understand: 30, apply: 30, analyze: 15 },
      tips: [
        'Mirror the exam domains in your module structure',
        'Include exam tips for tricky concepts',
        'Mix question difficulty to match the real exam',
      ],
    },
  },
  academic: {
    label: 'Academic / Textbook',
    icon: 'academic',
    description: 'Structured learning with progressive chapters, theory-first content, and assessment-ready questions for classroom or self-study.',
    defaults: { category: 'academic', difficulty: 'beginner' },
    suggestedStructure: [
      { title: 'Chapter 1: Introduction', lessons: ['Overview', 'Learning Objectives', 'Background'] },
      { title: 'Chapter 2: Foundations', lessons: ['Theory', 'Key Concepts', 'Examples'] },
      { title: 'Chapter 3: Applications', lessons: ['Case Studies', 'Practice Problems', 'Review'] },
    ],
    guidance: {
      questionsPerLesson: { minimum: 8, recommended: 12 },
      contentBlocksPerLesson: { minimum: 3, recommended: 5 },
      suggestedBlockTypes: ['concept', 'definition', 'example', 'summary'],
      suggestedQuestionTypes: ['multiple_choice', 'fill_blank', 'ordering'],
      bloomsDistribution: { remember: 20, understand: 35, apply: 25, analyze: 20 },
      tips: [
        'Start each lesson with learning objectives',
        'Include worked examples before practice questions',
        'Build concepts progressively across chapters',
      ],
    },
  },
  software_tools: {
    label: 'Software & Tools',
    icon: 'software',
    description: 'Train users on enterprise software, AI tools, design platforms, and productivity apps with workflow-based lessons.',
    defaults: { category: 'software', difficulty: 'beginner' },
    suggestedStructure: [
      { title: 'Getting Started', lessons: ['Interface Overview', 'Account & Setup', 'Core Navigation'] },
      { title: 'Core Workflows', lessons: ['Workflow 1', 'Workflow 2', 'Workflow 3'] },
      { title: 'Advanced Features', lessons: ['Power Features', 'Integrations', 'Tips & Shortcuts'] },
    ],
    guidance: {
      questionsPerLesson: { minimum: 8, recommended: 12 },
      contentBlocksPerLesson: { minimum: 2, recommended: 4 },
      suggestedBlockTypes: ['concept', 'example', 'key_takeaway', 'note'],
      suggestedQuestionTypes: ['multiple_choice', 'ordering', 'true_false'],
      bloomsDistribution: { remember: 20, understand: 25, apply: 40, analyze: 15 },
      tips: [
        'Organize around real workflows, not feature lists',
        'Include screenshots or step-by-step walkthroughs',
        'Test practical application over memorization',
      ],
    },
  },
  skills: {
    label: 'Skills Training',
    icon: 'skills',
    description: 'Hands-on skill building with practical exercises, scenarios, and competency checks.',
    defaults: { category: 'professional', difficulty: 'intermediate' },
    suggestedStructure: [
      { title: 'Getting Started', lessons: ['Prerequisites', 'Setup & Tools', 'First Steps'] },
      { title: 'Core Skills', lessons: ['Skill 1', 'Skill 2', 'Skill 3'] },
      { title: 'Advanced Application', lessons: ['Real-World Scenarios', 'Best Practices', 'Assessment'] },
    ],
    guidance: {
      questionsPerLesson: { minimum: 8, recommended: 12 },
      contentBlocksPerLesson: { minimum: 2, recommended: 4 },
      suggestedBlockTypes: ['concept', 'example', 'code_block', 'key_takeaway'],
      suggestedQuestionTypes: ['multiple_choice', 'ordering', 'matching'],
      bloomsDistribution: { remember: 15, understand: 25, apply: 40, analyze: 20 },
      tips: [
        'Focus on practical, scenario-based questions',
        'Include code examples or step-by-step procedures',
        'Test application of skills, not just recall',
      ],
    },
  },
  compliance: {
    label: 'Compliance & Policy',
    icon: 'compliance',
    description: 'Corporate compliance, safety training, and policy courses with pass/fail assessments and required completion.',
    defaults: { category: 'compliance', difficulty: 'beginner' },
    suggestedStructure: [
      { title: 'Policy Overview', lessons: ['Purpose & Scope', 'Key Regulations', 'Your Responsibilities'] },
      { title: 'Procedures', lessons: ['Standard Operating Procedures', 'Reporting & Escalation', 'Documentation'] },
      { title: 'Assessment', lessons: ['Knowledge Check', 'Scenario Review', 'Final Assessment'] },
    ],
    guidance: {
      questionsPerLesson: { minimum: 5, recommended: 10 },
      contentBlocksPerLesson: { minimum: 2, recommended: 3 },
      suggestedBlockTypes: ['concept', 'definition', 'key_takeaway', 'note'],
      suggestedQuestionTypes: ['multiple_choice', 'true_false', 'multiple_select'],
      bloomsDistribution: { remember: 35, understand: 35, apply: 20, analyze: 10 },
      tips: [
        'Use clear, unambiguous language — this is policy',
        'Include real-world scenarios for each regulation',
        'Focus on what employees must know and do',
      ],
    },
  },
  language_vocab: {
    label: 'Language & Vocabulary',
    icon: 'language',
    description: 'Memorization-heavy courses for languages, medical terminology, legal terms, and other vocabulary-driven subjects.',
    defaults: { category: 'language', difficulty: 'beginner' },
    suggestedStructure: [
      { title: 'Foundations', lessons: ['Core Terms', 'Common Phrases', 'Pronunciation Guide'] },
      { title: 'Building Blocks', lessons: ['Category A', 'Category B', 'Category C'] },
      { title: 'Practice & Review', lessons: ['Flashcard Review', 'Context Practice', 'Assessment'] },
    ],
    guidance: {
      questionsPerLesson: { minimum: 15, recommended: 25 },
      contentBlocksPerLesson: { minimum: 1, recommended: 2 },
      suggestedBlockTypes: ['definition', 'example', 'note'],
      suggestedQuestionTypes: ['fill_blank', 'matching', 'multiple_choice', 'true_false'],
      bloomsDistribution: { remember: 50, understand: 30, apply: 15, analyze: 5 },
      tips: [
        'Lean heavily on spaced repetition — more questions, shorter content',
        'Group vocabulary by theme or category for better retention',
        'Use fill-in-the-blank and matching for active recall',
      ],
    },
  },
  blank: {
    label: 'Start from Scratch',
    icon: 'blank',
    description: 'Empty canvas — build your course structure and content from the ground up.',
    defaults: { category: 'general', difficulty: 'beginner' },
    suggestedStructure: [],
    guidance: {
      questionsPerLesson: { minimum: 10, recommended: 15 },
      contentBlocksPerLesson: { minimum: 1, recommended: 3 },
      suggestedBlockTypes: [],
      suggestedQuestionTypes: [],
      bloomsDistribution: { remember: 25, understand: 30, apply: 30, analyze: 15 },
      tips: [],
    },
  },
}

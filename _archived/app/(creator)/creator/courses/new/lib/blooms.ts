// ─── Bloom's Taxonomy Levels ─────────────────────────────────────

export type BloomsLevel = 'remember' | 'understand' | 'apply' | 'analyze'

export interface BloomsLevelConfig {
  value: BloomsLevel
  label: string
  color: string
  bgColor: string
  hint: string
  keywords: string[]
}

export const BLOOMS_LEVELS: BloomsLevelConfig[] = [
  {
    value: 'remember',
    label: 'Remember',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    hint: 'Recall facts, terms, or definitions',
    keywords: [
      'define', 'list', 'name', 'identify', 'recall', 'recognize', 'state',
      'what is', 'which of', 'who', 'when', 'where', 'true or false',
    ],
  },
  {
    value: 'understand',
    label: 'Understand',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    hint: 'Explain concepts or interpret meaning',
    keywords: [
      'explain', 'describe', 'summarize', 'interpret', 'classify', 'compare',
      'distinguish', 'paraphrase', 'what does', 'why', 'how does',
      'difference between', 'example of',
    ],
  },
  {
    value: 'apply',
    label: 'Apply',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    hint: 'Use knowledge in a new situation or scenario',
    keywords: [
      'apply', 'implement', 'use', 'execute', 'solve', 'demonstrate',
      'configure', 'deploy', 'given the scenario', 'how would you',
      'which action', 'what should', 'troubleshoot',
    ],
  },
  {
    value: 'analyze',
    label: 'Analyze',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
    hint: 'Break down or evaluate information',
    keywords: [
      'analyze', 'evaluate', 'assess', 'examine', 'differentiate', 'investigate',
      'what is the impact', 'what is the risk', 'which is the best',
      'prioritize', 'most likely', 'root cause', 'what conclusion',
    ],
  },
]

export const BLOOMS_COLORS: Record<BloomsLevel, string> = {
  remember: 'bg-blue-400',
  understand: 'bg-green-400',
  apply: 'bg-amber-400',
  analyze: 'bg-purple-400',
}

/**
 * Suggests a Bloom's level based on keyword scan of the question text.
 * Returns 'remember' as default if no keywords match.
 */
export function suggestBloomsLevel(text: string): BloomsLevel {
  const lower = text.toLowerCase()

  // Check in reverse order (analyze first) so higher-order matches win
  for (let i = BLOOMS_LEVELS.length - 1; i >= 0; i--) {
    const level = BLOOMS_LEVELS[i]
    for (const keyword of level.keywords) {
      if (lower.includes(keyword)) {
        return level.value
      }
    }
  }

  return 'remember'
}

// ─── Inline Creator Guidance Tips ─────────────────────────────────

export interface CreatorTipData {
  icon: string
  text: string
}

export const CREATOR_TIPS: Record<string, CreatorTipData> = {
  // Question type tips
  question_multiple_choice: {
    icon: 'tip',
    text: 'Write one clearly correct answer and 3 plausible distractors. Avoid "all of the above" — it reduces question value.',
  },
  question_multiple_select: {
    icon: 'tip',
    text: 'Tell learners how many answers to select, or use "select all that apply." Aim for 2-3 correct out of 4-5 options.',
  },
  question_true_false: {
    icon: 'tip',
    text: 'Avoid double negatives and trick wording. True/false works best for clear-cut facts, not nuanced topics.',
  },
  question_fill_blank: {
    icon: 'tip',
    text: 'Add multiple acceptable answers (e.g., "DNS" and "Domain Name System"). Use "contains" mode for longer answers.',
  },
  question_ordering: {
    icon: 'tip',
    text: 'Great for processes and sequences. Use 4-5 items — too many makes it frustrating. Make the correct order unambiguous.',
  },
  question_matching: {
    icon: 'tip',
    text: 'Pair related concepts (term ↔ definition, tool ↔ purpose). Use 4-5 pairs for the best learning experience.',
  },
  // Block type tips
  block_concept: {
    icon: 'tip',
    text: 'Explain the "what" and "why" before the "how." Learners retain more when they understand the purpose first.',
  },
  block_definition: {
    icon: 'tip',
    text: 'Keep definitions concise (1-2 sentences). Include an example or analogy to make abstract terms concrete.',
  },
  block_example: {
    icon: 'tip',
    text: 'Use real-world scenarios learners can relate to. Show both correct and incorrect examples when possible.',
  },
  block_exam_tip: {
    icon: 'tip',
    text: 'Highlight what the exam specifically tests. Call out common wrong answers and why they are traps.',
  },
  block_key_takeaway: {
    icon: 'tip',
    text: 'Summarize the 2-3 most important points. Learners often review these blocks right before an exam.',
  },
  block_code_block: {
    icon: 'tip',
    text: 'Include comments explaining key lines. Show the output or expected result when relevant.',
  },
}

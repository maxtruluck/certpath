'use client'

import MiniCard from './MiniCard'
import type { MarkdownSection } from './useMarkdownSections'

interface Question {
  id: string
  section_index: number
}

interface ConceptCard {
  name: string
  section_index: number
}

export default function LearnerPreviewSidebar({
  sections,
  questions,
  conceptCards,
}: {
  sections: MarkdownSection[]
  questions: Question[]
  conceptCards: ConceptCard[]
}) {
  const sectionCount = sections.length
  const conceptCount = conceptCards.length
  const questionCount = questions.length
  const totalCards = sectionCount + conceptCount + questionCount

  return (
    <div className="w-[160px] border-l border-gray-200 bg-gray-50/50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">Learner Sees</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Card stack order</p>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {sections.length === 0 ? (
          <p className="text-[10px] text-gray-400 text-center py-4 px-2">
            Add ## headings in your markdown to create section cards
          </p>
        ) : (
          sections.map((section, sIdx) => {
            const sectionConcepts = conceptCards.filter(c => c.section_index === section.index)
            const sectionQuestions = questions.filter(q => q.section_index === section.index)

            return (
              <div key={sIdx}>
                {/* Section header */}
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mt-2 mb-1 px-0.5">
                  Section {sIdx + 1}
                </p>
                {/* Section card */}
                <MiniCard type="section" label={section.title} />
                {/* Concept cards */}
                {sectionConcepts.map((c, cIdx) => (
                  <div key={`c-${cIdx}`} className="mt-1">
                    <MiniCard type="concept" label={c.name} />
                  </div>
                ))}
                {/* Question cards */}
                {sectionQuestions.map((q, qIdx) => (
                  <div key={q.id} className="mt-1">
                    <MiniCard type="question" label={`Question ${qIdx + 1}`} />
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-gray-200 bg-white">
        <p className="text-[10px] font-medium text-gray-500 mb-1">{totalCards} cards total</p>
        <div className="flex flex-wrap gap-1">
          {sectionCount > 0 && (
            <span className="px-1.5 py-0.5 text-[8px] font-medium rounded bg-blue-100 text-blue-700">
              {sectionCount} sec
            </span>
          )}
          {conceptCount > 0 && (
            <span className="px-1.5 py-0.5 text-[8px] font-medium rounded bg-purple-100 text-purple-700">
              {conceptCount} con
            </span>
          )}
          {questionCount > 0 && (
            <span className="px-1.5 py-0.5 text-[8px] font-medium rounded bg-teal-100 text-teal-700">
              {questionCount} q
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

type CardType = 'section' | 'concept' | 'question'

const cardStyles: Record<CardType, { bg: string; border: string; badge: string; badgeBg: string }> = {
  section: {
    bg: 'bg-[#EFF6FF]',
    border: 'border-[#BFDBFE]',
    badge: 'SECTION',
    badgeBg: 'bg-blue-100 text-blue-700',
  },
  concept: {
    bg: 'bg-[#F3E8FF]',
    border: 'border-[#D8B4FE]',
    badge: 'CONCEPT',
    badgeBg: 'bg-purple-100 text-purple-700',
  },
  question: {
    bg: 'bg-[#E0F7FA]',
    border: 'border-[#80CBC4]',
    badge: 'QUESTION',
    badgeBg: 'bg-teal-100 text-teal-700',
  },
}

export default function MiniCard({ type, label }: {
  type: CardType
  label: string
}) {
  const s = cardStyles[type]
  return (
    <div className={`rounded-md border px-2 py-1.5 ${s.bg} ${s.border}`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-medium text-gray-700 truncate leading-tight">{label}</span>
        <span className={`text-[8px] font-bold tracking-wider px-1 py-0.5 rounded ${s.badgeBg} flex-shrink-0`}>
          {s.badge}
        </span>
      </div>
    </div>
  )
}

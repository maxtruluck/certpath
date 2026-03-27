type PillVariant = 'concept' | 'question'

const styles: Record<PillVariant, { bg: string; text: string; border: string; icon: string }> = {
  concept: {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    icon: '\u25C6',
  },
  question: {
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    icon: '',
  },
}

export default function InlinePill({ variant, label }: {
  variant: PillVariant
  label: string
}) {
  const s = styles[variant]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon && <span>{s.icon}</span>}
      {label}
    </span>
  )
}

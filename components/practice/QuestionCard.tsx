'use client';

import { Badge } from '@/components/ui/Badge';

interface QuestionCardProps {
  questionText: string;
  domainName?: string;
  difficulty: number;
}

const difficultyLabels = ['', 'Easy', 'Easy', 'Medium', 'Hard', 'Expert'];
const difficultyVariants: Record<number, 'success' | 'warning' | 'danger' | 'accent'> = {
  1: 'success', 2: 'success', 3: 'warning', 4: 'danger', 5: 'danger',
};

export function QuestionCard({ questionText, domainName, difficulty }: QuestionCardProps) {
  return (
    <div className="animate-fade-up space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {domainName && <Badge variant="accent">{domainName}</Badge>}
        <Badge variant={difficultyVariants[difficulty] ?? 'warning'}>
          {difficultyLabels[difficulty]}
        </Badge>
      </div>
      <h2 className="text-lg font-extrabold leading-relaxed text-balance">{questionText}</h2>
    </div>
  );
}

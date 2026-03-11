'use client';

interface WeeklyGridProps {
  activities: { date: string; completed: boolean }[];
}

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeeklyGrid({ activities }: WeeklyGridProps) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const activitySet = new Set(activities.filter(a => a.completed).map(a => a.date));

  // Get last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="flex items-center gap-1.5 justify-between">
      {days.map((date, i) => {
        const isCompleted = activitySet.has(date);
        const isToday = date === todayStr;
        return (
          <div key={date} className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-[10px] font-bold text-cp-text-muted uppercase">{dayLabels[i]}</span>
            <div className={`w-full aspect-square max-w-[40px] rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-all ${
              isCompleted
                ? 'bg-cp-success text-white shadow-sm shadow-cp-success/20'
                : isToday
                ? 'bg-cp-green/15 text-cp-green border-2 border-cp-green/40'
                : 'bg-cp-bg-secondary border border-cp-border text-cp-text-muted'
            }`}>
              {isCompleted ? '✓' : new Date(date).getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

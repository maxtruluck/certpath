'use client';

interface OptionButtonProps {
  id: string;
  text: string;
  state: 'default' | 'selected' | 'correct' | 'incorrect';
  onClick: () => void;
  disabled?: boolean;
}

const stateClasses = {
  default: 'bg-white border-2 border-cp-border border-b-4 hover:border-cp-green/40 hover:bg-cp-bg-secondary active:border-b-2 active:translate-y-[2px]',
  selected: 'bg-cp-green/10 border-2 border-cp-green border-b-4 border-b-cp-green-dark text-cp-text ring-selected',
  correct: 'bg-cp-green/10 border-2 border-cp-green border-b-4 border-b-cp-green-dark text-cp-green animate-correct-pulse',
  incorrect: 'bg-cp-danger/10 border-2 border-cp-danger border-b-4 border-b-cp-danger/70 text-cp-danger animate-shake',
};

export function OptionButton({ id, text, state, onClick, disabled }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left p-4 rounded-2xl transition-all duration-100 disabled:cursor-default ${stateClasses[state]}`}
    >
      <div className="flex items-start gap-3">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-mono font-black shrink-0 transition-all ${
          state === 'correct'
            ? 'bg-cp-green text-white'
            : state === 'incorrect'
            ? 'bg-cp-danger text-white'
            : state === 'selected'
            ? 'bg-cp-green text-white'
            : 'bg-cp-bg-secondary text-cp-text-muted'
        }`}>
          {state === 'correct' ? '✓' : state === 'incorrect' ? '✗' : id.toUpperCase()}
        </span>
        <span className="text-sm leading-relaxed pt-1.5 font-bold">{text}</span>
      </div>
    </button>
  );
}

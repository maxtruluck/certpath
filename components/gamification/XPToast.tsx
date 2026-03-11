'use client';

import { useAppStore } from '@/lib/store';

export function XPToast() {
  const { showXpToast, xpToastAmount } = useAppStore();

  if (!showXpToast) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <div className="animate-float-up bg-cp-green text-white px-6 py-3 rounded-2xl font-mono font-black text-xl border-b-4 border-cp-green-dark shadow-2xl shadow-cp-green-glow">
        +{xpToastAmount} XP
      </div>
    </div>
  );
}

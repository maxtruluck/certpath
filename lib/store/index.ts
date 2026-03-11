'use client';

import { create } from 'zustand';

interface Question {
  id: string;
  domain_id: string;
  certification_id: string;
  question_text: string;
  question_type: string;
  options: { id: string; text: string }[];
  correct_option_ids: string[];
  explanation: string;
  difficulty: number;
  tags: string[];
}

interface SessionState {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, { selectedIds: string[]; isCorrect: boolean; timeMs: number }>;
  sessionStartTime: number | null;
  questionStartTime: number | null;
  isComplete: boolean;
}

interface UserState {
  displayName: string;
  currentStreak: number;
  totalXp: number;
  activeCertId: string | null;
}

interface AppStore {
  // Session
  session: SessionState;
  startSession: (questions: Question[]) => void;
  answerQuestion: (questionId: string, selectedIds: string[], isCorrect: boolean) => void;
  nextQuestion: () => void;
  completeSession: () => void;
  resetSession: () => void;

  // Session Review (persists after navigation)
  sessionReview: {
    questions: Question[];
    answers: Record<string, { selectedIds: string[]; isCorrect: boolean; timeMs: number }>;
  } | null;
  saveSessionForReview: () => void;
  clearSessionReview: () => void;

  // User
  user: UserState;
  setUser: (user: Partial<UserState>) => void;

  // UI
  showXpToast: boolean;
  xpToastAmount: number;
  triggerXpToast: (amount: number) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  session: {
    questions: [],
    currentIndex: 0,
    answers: {},
    sessionStartTime: null,
    questionStartTime: null,
    isComplete: false,
  },

  startSession: (questions) =>
    set({
      session: {
        questions,
        currentIndex: 0,
        answers: {},
        sessionStartTime: Date.now(),
        questionStartTime: Date.now(),
        isComplete: false,
      },
    }),

  answerQuestion: (questionId, selectedIds, isCorrect) => {
    const { session } = get();
    const timeMs = Date.now() - (session.questionStartTime ?? Date.now());
    set({
      session: {
        ...session,
        answers: {
          ...session.answers,
          [questionId]: { selectedIds, isCorrect, timeMs },
        },
      },
    });
  },

  nextQuestion: () => {
    const { session } = get();
    set({
      session: {
        ...session,
        currentIndex: session.currentIndex + 1,
        questionStartTime: Date.now(),
      },
    });
  },

  completeSession: () => {
    const { session } = get();
    set({ session: { ...session, isComplete: true } });
  },

  resetSession: () =>
    set({
      session: {
        questions: [],
        currentIndex: 0,
        answers: {},
        sessionStartTime: null,
        questionStartTime: null,
        isComplete: false,
      },
    }),

  sessionReview: null,

  saveSessionForReview: () => {
    const { session } = get();
    set({
      sessionReview: {
        questions: [...session.questions],
        answers: { ...session.answers },
      },
    });
  },

  clearSessionReview: () => set({ sessionReview: null }),

  user: {
    displayName: '',
    currentStreak: 0,
    totalXp: 0,
    activeCertId: null,
  },

  setUser: (user) =>
    set((state) => ({ user: { ...state.user, ...user } })),

  showXpToast: false,
  xpToastAmount: 0,
  triggerXpToast: (amount) => {
    set({ showXpToast: true, xpToastAmount: amount });
    setTimeout(() => set({ showXpToast: false }), 2000);
  },
}));

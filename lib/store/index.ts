'use client';

import { create } from 'zustand';

export interface SessionQuestion {
  id: string;
  topic_id: string;
  topic_title: string;
  question_text: string;
  question_type: 'multiple_choice' | 'multiple_select' | 'true_false';
  options: { id: string; text: string }[];
  difficulty: number;
}

export interface AnswerResult {
  is_correct: boolean;
  correct_option_ids: string[];
  explanation: string;
  fsrs: { rating: number; next_review_date: string; state: string };
}

export interface SessionReviewData {
  sessionId: string;
  courseSlug: string;
  correctCount: number;
  totalCount: number;
  accuracyPercent: number;
  readinessBefore: number;
  readinessAfter: number;
  readinessDelta: number;
  topicBreakdown: { topic_id: string; topic_title: string; correct: number; total: number; is_review: boolean }[];
  unlockedTopic: { id: string; title: string } | null;
  mistakes: { questionId: string; questionText: string; topicTitle: string; questionType: string; options: { id: string; text: string }[]; selectedIds: string[]; correctIds: string[]; explanation: string }[];
  xpEarned?: number;
  streak?: { current: number; longest: number };
  achievements?: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string;
    xp_reward: number;
  }>;
}

interface AppStore {
  // Session
  sessionId: string | null;
  courseId: string | null;
  questions: SessionQuestion[];
  currentIndex: number;
  answers: Record<string, { selectedIds: string[]; isCorrect: boolean; timeMs: number }>;
  sessionStartTime: number | null;
  questionStartTime: number | null;
  isComplete: boolean;

  // Actions
  startSession: (sessionId: string, courseId: string, questions: SessionQuestion[]) => void;
  answerQuestion: (questionId: string, selectedIds: string[], isCorrect: boolean) => void;
  nextQuestion: () => void;
  completeSession: () => void;
  resetSession: () => void;

  // Session review (persists after nav)
  sessionReview: SessionReviewData | null;
  saveSessionForReview: (data: SessionReviewData) => void;
  clearSessionReview: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  sessionId: null,
  courseId: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  sessionStartTime: null,
  questionStartTime: null,
  isComplete: false,

  startSession: (sessionId, courseId, questions) =>
    set({
      sessionId,
      courseId,
      questions,
      currentIndex: 0,
      answers: {},
      sessionStartTime: Date.now(),
      questionStartTime: Date.now(),
      isComplete: false,
    }),

  answerQuestion: (questionId, selectedIds, isCorrect) => {
    const state = get();
    const timeMs = state.questionStartTime
      ? Date.now() - state.questionStartTime
      : Date.now() - (state.sessionStartTime ?? Date.now());
    set({
      answers: {
        ...state.answers,
        [questionId]: { selectedIds, isCorrect, timeMs },
      },
    });
  },

  nextQuestion: () => {
    const state = get();
    set({
      currentIndex: state.currentIndex + 1,
      questionStartTime: Date.now(),
    });
  },

  completeSession: () => set({ isComplete: true }),

  resetSession: () =>
    set({
      sessionId: null,
      courseId: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      sessionStartTime: null,
      questionStartTime: null,
      isComplete: false,
    }),

  sessionReview: null,
  saveSessionForReview: (data) => set({ sessionReview: data }),
  clearSessionReview: () => set({ sessionReview: null }),
}));

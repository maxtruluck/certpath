import { create } from 'zustand';

// Card types matching the API response from /api/session/generate
export interface LessonSectionCard {
  card_type: 'lesson_section';
  section: {
    title: string;
    content: string;
    lesson_id: string;
    lesson_title: string;
    video_url: string | null;
  };
}

export interface ConceptCard {
  card_type: 'concept';
  concept: {
    id: string;
    title: string;
    content: string;
    lesson_id: string;
    lesson_title: string;
    module_id: string;
    module_title: string;
  };
}

export interface QuestionCard {
  card_type: 'question';
  question: {
    id: string;
    module_id?: string;
    course_id?: string;
    lesson_id: string | null;
    question_text: string;
    question_type: 'multiple_choice' | 'multiple_select' | 'true_false' | 'fill_blank' | 'ordering' | 'matching';
    options?: { id: string; text: string }[];
    difficulty: number;
    difficulty_label: 'easy' | 'medium' | 'challenging';
    module_title: string;
    // ordering: items are in options
    // matching: matching_items { lefts, rights }
    matching_items?: { lefts: string[]; rights: string[] };
  };
}

export type SessionCard = LessonSectionCard | ConceptCard | QuestionCard;

export interface AnswerResult {
  is_correct: boolean;
  correct_option_ids?: string[];
  correct_order?: string[];
  matching_pairs?: { left: string; right: string }[];
  acceptable_answers?: string[];
  explanation: string;
  option_explanation?: string;
  linked_lesson?: { title: string; body: string };
}

interface SessionStore {
  // Session state
  sessionId: string | null;
  courseId: string | null;
  lessonId: string | null;
  lessonTitle: string | null;
  cards: SessionCard[];
  currentIndex: number;
  totalItems: number;
  itemsCompleted: number;

  // Answer tracking
  answers: Record<string, { isCorrect: boolean; timeMs: number }>;
  lastAnswerResult: AnswerResult | null;
  questionStartTime: number | null;

  // Actions
  startSession: (data: {
    sessionId: string;
    courseId: string;
    lessonId: string | null;
    lessonTitle: string | null;
    cards: SessionCard[];
    totalItems: number;
    itemsCompleted: number;
  }) => void;
  advance: () => void;
  recordAnswer: (questionId: string, isCorrect: boolean, timeMs: number) => void;
  setLastAnswerResult: (result: AnswerResult | null) => void;
  resetSession: () => void;

  // Computed
  correctCount: () => number;
  totalAnswered: () => number;
  isSessionComplete: () => boolean;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionId: null,
  courseId: null,
  lessonId: null,
  lessonTitle: null,
  cards: [],
  currentIndex: 0,
  totalItems: 0,
  itemsCompleted: 0,
  answers: {},
  lastAnswerResult: null,
  questionStartTime: null,

  startSession: (data) =>
    set({
      sessionId: data.sessionId,
      courseId: data.courseId,
      lessonId: data.lessonId,
      lessonTitle: data.lessonTitle,
      cards: data.cards,
      currentIndex: 0,
      totalItems: data.totalItems,
      itemsCompleted: data.itemsCompleted,
      answers: {},
      lastAnswerResult: null,
      questionStartTime: Date.now(),
    }),

  advance: () => {
    const state = get();
    set({
      currentIndex: state.currentIndex + 1,
      lastAnswerResult: null,
      questionStartTime: Date.now(),
    });
  },

  recordAnswer: (questionId, isCorrect, timeMs) => {
    const state = get();
    set({
      answers: {
        ...state.answers,
        [questionId]: { isCorrect, timeMs },
      },
    });
  },

  setLastAnswerResult: (result) => set({ lastAnswerResult: result }),

  resetSession: () =>
    set({
      sessionId: null,
      courseId: null,
      lessonId: null,
      lessonTitle: null,
      cards: [],
      currentIndex: 0,
      totalItems: 0,
      itemsCompleted: 0,
      answers: {},
      lastAnswerResult: null,
      questionStartTime: null,
    }),

  correctCount: () => Object.values(get().answers).filter((a) => a.isCorrect).length,
  totalAnswered: () => Object.keys(get().answers).length,
  isSessionComplete: () => get().currentIndex >= get().cards.length,
}));

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CourseFormData {
  title: string
  description: string
  category: string
  difficulty: string
  is_free: boolean
  price_cents: number
  tags: string[]
  prerequisites: string
  learning_objectives: string[]
  card_color: string
  cover_image_url: string
  progression_type: string
}

export const INITIAL_FORM: CourseFormData = {
  title: '',
  description: '',
  category: 'Cybersecurity',
  difficulty: 'beginner',
  is_free: true,
  price_cents: 0,
  tags: [],
  prerequisites: '',
  learning_objectives: ['', ''],
  card_color: '#3b82f6',
  cover_image_url: '',
  progression_type: 'linear',
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface WizardState {
  courseId: string | null
  currentStep: 1 | 2 | 3 | 4
  form: CourseFormData
  activeLesson: string | null
  editorTab: 'content' | 'questions'
  isDirty: boolean
  saveStatus: SaveStatus
  lastSaved: Date | null

  // Actions
  setCourseId: (id: string) => void
  setStep: (step: 1 | 2 | 3 | 4) => void
  updateForm: (updates: Partial<CourseFormData>) => void
  selectLesson: (id: string | null) => void
  setEditorTab: (tab: 'content' | 'questions') => void
  setSaveStatus: (status: SaveStatus) => void
  markDirty: () => void
  markClean: () => void
  reset: () => void
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      courseId: null,
      currentStep: 1,
      form: INITIAL_FORM,
      activeLesson: null,
      editorTab: 'content',
      isDirty: false,
      saveStatus: 'idle',
      lastSaved: null,

      setCourseId: (id) => set({ courseId: id }),
      setStep: (step) => set({ currentStep: step }),
      updateForm: (updates) =>
        set((state) => ({
          form: { ...state.form, ...updates },
          isDirty: true,
        })),
      selectLesson: (id) => set({ activeLesson: id, editorTab: 'content' }),
      setEditorTab: (tab) => set({ editorTab: tab }),
      setSaveStatus: (status) =>
        set({
          saveStatus: status,
          lastSaved: status === 'saved' ? new Date() : undefined,
        }),
      markDirty: () => set({ isDirty: true }),
      markClean: () => set({ isDirty: false }),
      reset: () =>
        set({
          courseId: null,
          currentStep: 1,
          form: INITIAL_FORM,
          activeLesson: null,
          editorTab: 'content',
          isDirty: false,
          saveStatus: 'idle',
          lastSaved: null,
        }),
    }),
    {
      name: 'creator-wizard',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        courseId: state.courseId,
        currentStep: state.currentStep,
        form: state.form,
        activeLesson: state.activeLesson,
      }),
    }
  )
)

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';
import { colors, spacing, fontSize, radii } from '@/lib/theme';
import { ReadStep, WatchStep, AnswerStep, EmbedStep, CalloutStep } from '@/components/steps';
import ProgressBar from '@/components/ProgressBar';

// ── Types ──────────────────────────────────────────────────────

interface StepData {
  type: 'read' | 'watch' | 'answer' | 'embed' | 'callout';
  title: string;
  markdown?: string;
  watchUrl?: string;
  question?: any;
  embedContent?: any;
  calloutContent?: any;
}

interface LessonMeta {
  id: string;
  title: string;
  module_title: string;
  course_id: string;
  course_slug: string;
}

// ── Step badge config ──────────────────────────────────────────

const STEP_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  read:        { label: 'Read',        bg: '#E1F5EE', text: '#085041' },
  watch:       { label: 'Watch',       bg: '#EDE9FF', text: '#3B2F8E' },
  answer:      { label: 'Answer',      bg: '#FDEEE8', text: '#8B3518' },
  embed:       { label: 'Embed',       bg: '#E6F1FB', text: '#0C447C' },
  tip:         { label: 'Tip',         bg: '#FEF3CD', text: '#856404' },
  key_concept: { label: 'Key Concept', bg: '#FEF3CD', text: '#856404' },
  warning:     { label: 'Warning',     bg: '#FEF3CD', text: '#856404' },
  exam_note:   { label: 'Exam Note',   bg: '#FEF3CD', text: '#856404' },
};

// ── Page ───────────────────────────────────────────────────────

export default function LessonPlayerScreen() {
  const params = useLocalSearchParams<{ sessionId: string; lessonId?: string; courseSlug?: string }>();
  const router = useRouter();
  const lessonId = params.lessonId || params.sessionId;
  const courseSlug = params.courseSlug || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<StepData[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [completedStepsData, setCompletedStepsData] = useState<any[]>([]);
  const [exitConfirm, setExitConfirm] = useState(false);

  // Session metadata
  const [lesson, setLesson] = useState<LessonMeta | null>(null);

  // Stats
  const [questionsCorrect, setQuestionsCorrect] = useState(0);
  const [questionsTotal, setQuestionsTotal] = useState(0);

  // Answer submitted for current step
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  const scrollRef = useRef<ScrollView>(null);

  // Reset scroll and answer state on step change
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setAnswerSubmitted(false);
  }, [currentStepIndex]);

  // ── Load session ──────────────────────────────────────────────
  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch lesson content + steps from API
      const contentData = await apiFetch<{ lesson: LessonMeta; steps: StepData[] }>(
        `/api/lessons/${lessonId}/content`
      );

      setLesson(contentData.lesson);
      setSteps(contentData.steps);
      setQuestionsTotal(contentData.steps.filter((s: StepData) => s.type === 'answer').length);

      // Load progress
      try {
        const progressData = await apiFetch<{ progress: any }>(`/api/lessons/${lessonId}/progress`);
        const progress = progressData.progress;

        if (progress && progress.status !== 'completed') {
          const completedSet = new Set<number>();
          const stepCompletions = progress.step_completions || [];
          for (const sc of stepCompletions) {
            completedSet.add(sc.step_index);
          }
          setCompletedSteps(completedSet);
          setCompletedStepsData(stepCompletions);
          const savedIdx = progress.current_step_index || 0;
          let targetIndex = Math.min(savedIdx + 1, contentData.steps.length - 1);
          if (completedSet.has(targetIndex)) {
            let foundUncompleted = false;
            for (let i = 0; i < contentData.steps.length; i++) {
              if (!completedSet.has(i)) { targetIndex = i; foundUncompleted = true; break; }
            }
            if (!foundUncompleted) targetIndex = 0;
          }
          setCurrentStepIndex(targetIndex);
        } else if (progress?.status === 'completed') {
          const completedSet = new Set<number>();
          for (let i = 0; i < contentData.steps.length; i++) completedSet.add(i);
          setCompletedSteps(completedSet);
          setCompletedStepsData(progress.step_completions || []);
          setCurrentStepIndex(0);
        }
      } catch {
        // Progress fetch failed, start from beginning
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong loading this lesson');
      console.error('Lesson load error:', err);
    }
    setLoading(false);
  }, [lessonId]);

  useEffect(() => { loadSession(); }, [loadSession]);

  // ── Step completion ───────────────────────────────────────────
  async function markStepComplete(stepIndex: number, isCorrect?: boolean) {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepIndex);
    setCompletedSteps(newCompleted);

    try {
      await apiFetch('/api/lessons/' + lessonId + '/step-complete', {
        method: 'POST',
        body: JSON.stringify({ step_index: stepIndex, total_steps: steps.length, is_correct: isCorrect }),
      });
    } catch {
      // Silently fail - progress may not have saved
    }
  }

  async function handleNext() {
    if (!completedSteps.has(currentStepIndex)) {
      await markStepComplete(currentStepIndex);
    }
    if (isLastStep) {
      const allCompleted = new Set(completedSteps);
      allCompleted.add(currentStepIndex);
      // Navigate to completion with params
      router.replace({
        pathname: '/lesson/complete',
        params: {
          questionsCorrect: String(questionsCorrect),
          questionsTotal: String(questionsTotal),
          stepsCompleted: String(Math.min(allCompleted.size, steps.length)),
          stepsTotal: String(steps.length),
          lessonTitle: lesson?.title || '',
          courseSlug: lesson?.course_slug || courseSlug,
          courseId: lesson?.course_id || '',
        },
      });
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }

  async function handleAnswerComplete(isCorrect: boolean) {
    if (isCorrect) setQuestionsCorrect(prev => prev + 1);
    await markStepComplete(currentStepIndex, isCorrect);
    setAnswerSubmitted(true);
  }

  function handlePrevious() {
    if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
  }

  function handleExit() {
    router.back();
  }

  // ── Loading / Error ───────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || steps.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error || 'No content available'}</Text>
        <Pressable style={styles.errorButton} onPress={handleExit}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </Pressable>
        <Pressable style={styles.retryBtn} onPress={loadSession}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Step badge ────────────────────────────────────────────────
  const badgeKey = currentStep?.type === 'callout'
    ? (currentStep.calloutContent?.callout_style || 'tip')
    : currentStep?.type || 'read';
  const badge = STEP_BADGES[badgeKey] || STEP_BADGES.read;

  // Whether Next is enabled
  const isAnswerStep = currentStep?.type === 'answer';
  const isViewingCompleted = completedSteps.has(currentStepIndex);
  const nextEnabled = !isAnswerStep || answerSubmitted || isViewingCompleted;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.topBar}>
          <Pressable onPress={() => setExitConfirm(true)} hitSlop={12}>
            <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
          </Pressable>
          <Text style={styles.lessonTitle} numberOfLines={1}>
            {lesson?.title || ''}
          </Text>
          <Text style={styles.counter}>
            {Math.min(currentStepIndex + 1, steps.length)} / {steps.length}
          </Text>
        </View>

        {/* Progress dots */}
        <View style={styles.progressDots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: completedSteps.has(i) ? '#1D9E75' : i === currentStepIndex ? '#378ADD' : '#eee',
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* ─── Content ─── */}
      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Step type badge */}
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>

        {currentStep?.type === 'read' && (
          <ReadStep title={currentStep.title} content={currentStep.markdown || ''} />
        )}

        {currentStep?.type === 'watch' && (
          <WatchStep title={currentStep.title} videoUrl={currentStep.watchUrl || ''} />
        )}

        {currentStep?.type === 'answer' && currentStep.question && (() => {
          const stepCompletion = completedStepsData.find((c: any) => c.step_index === currentStepIndex);
          return (
            <AnswerStep
              key={currentStepIndex}
              question={currentStep.question}
              onComplete={handleAnswerComplete}
              readOnly={isViewingCompleted}
              previousResult={isViewingCompleted && stepCompletion ? {
                is_correct: stepCompletion.is_correct,
                correct_option_ids: currentStep.question.correct_option_ids || [],
                explanation: currentStep.question.explanation || '',
              } : undefined}
            />
          );
        })()}

        {currentStep?.type === 'embed' && currentStep.embedContent && (
          <EmbedStep title={currentStep.title} content={currentStep.embedContent} />
        )}

        {currentStep?.type === 'callout' && currentStep.calloutContent && (
          <CalloutStep
            variant={currentStep.calloutContent.callout_style || 'tip'}
            title={currentStep.calloutContent.title || currentStep.title}
            content={currentStep.calloutContent.markdown || ''}
          />
        )}
      </ScrollView>

      {/* ─── Footer ─── */}
      <View style={styles.footer}>
        {currentStepIndex > 0 ? (
          <Pressable style={styles.prevButton} onPress={handlePrevious}>
            <Text style={styles.prevButtonText}>Previous</Text>
          </Pressable>
        ) : (
          <View />
        )}

        <Pressable
          style={[styles.nextButton, !nextEnabled && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!nextEnabled}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? 'Complete' : 'Next'}
          </Text>
        </Pressable>
      </View>

      {/* Exit confirmation modal */}
      <Modal visible={exitConfirm} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setExitConfirm(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Leave lesson?</Text>
            <Text style={styles.modalBody}>Your progress will be saved. You can resume later.</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalKeep} onPress={() => setExitConfirm(false)}>
                <Text style={styles.modalKeepText}>Keep going</Text>
              </Pressable>
              <Pressable style={styles.modalLeave} onPress={handleExit}>
                <Text style={styles.modalLeaveText}>Leave</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  errorButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  retryBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  retryBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.bg,
  },

  // Header
  header: {
    paddingHorizontal: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    gap: spacing.sm,
  },
  lessonTitle: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  counter: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  dot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },

  // Content
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.xl,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: spacing.lg,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  prevButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
  },
  prevButtonText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  nextButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.text,
    borderRadius: radii.md,
  },
  nextButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  nextButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.bg,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    padding: spacing['2xl'],
    gap: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalKeep: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  modalKeepText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  modalLeave: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: '#EF4444',
    borderRadius: radii.md,
    alignItems: 'center',
  },
  modalLeaveText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: '#ffffff',
  },
});

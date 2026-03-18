import { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore, type SessionCard, type AnswerResult } from '@/lib/store';
import { apiFetch } from '@/lib/api';
import { colors, spacing, fontSize } from '@/lib/theme';
import ProgressBar from '@/components/ProgressBar';
import TeachingCard from '@/components/TeachingCard';
import QuestionCard from '@/components/QuestionCard';
import AnswerFeedback from '@/components/AnswerFeedback';
import Button from '@/components/Button';

export default function LessonSessionScreen() {
  const router = useRouter();
  const {
    sessionId,
    courseId,
    lessonId,
    lessonTitle,
    cards,
    currentIndex,
    totalItems,
    itemsCompleted,
    answers,
    lastAnswerResult,
    questionStartTime,
    advance,
    recordAnswer,
    setLastAnswerResult,
    correctCount,
    totalAnswered,
  } = useSessionStore();

  const [submitting, setSubmitting] = useState(false);

  // Animation
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const currentCard: SessionCard | undefined = cards[currentIndex];
  const isComplete = currentIndex >= cards.length;
  const progress = totalItems > 0 ? (itemsCompleted + currentIndex) / totalItems : 0;

  const animateToNext = useCallback(() => {
    translateX.value = withTiming(-400, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(advance)();
      translateX.value = 400;
      opacity.value = 0;
      translateX.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(1, { duration: 250 });
    });
  }, [advance]);

  const handleContinue = useCallback(() => {
    setLastAnswerResult(null);
    if (isComplete || currentIndex + 1 >= cards.length) {
      // Session complete
      handleComplete();
    } else {
      animateToNext();
    }
  }, [currentIndex, cards.length, isComplete]);

  const handleTeachingContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateToNext();
  }, [animateToNext]);

  const handleAnswerSubmit = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!currentCard || currentCard.card_type !== 'question' || !sessionId) return;
      const q = currentCard.question;
      setSubmitting(true);

      const timeMs = questionStartTime ? Date.now() - questionStartTime : 3000;

      try {
        const result = await apiFetch<AnswerResult>('/api/session/answer', {
          method: 'POST',
          body: JSON.stringify({
            session_id: sessionId,
            question_id: q.id,
            time_spent_ms: timeMs,
            ...payload,
          }),
        });

        recordAnswer(q.id, result.is_correct, timeMs);
        setLastAnswerResult(result);
      } catch (err) {
        console.error('Answer submit error:', err);
      } finally {
        setSubmitting(false);
      }
    },
    [currentCard, sessionId, questionStartTime],
  );

  const handleComplete = useCallback(async () => {
    try {
      await apiFetch('/api/session/complete', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          lesson_id: lessonId,
        }),
      });
    } catch (err) {
      console.error('Complete error:', err);
    }
    router.replace('/lesson/complete');
  }, [sessionId, lessonId]);

  const handleExit = useCallback(() => {
    router.back();
  }, []);

  if (!sessionId || cards.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>No session data</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
      </SafeAreaView>
    );
  }

  // If complete and no feedback showing, navigate
  if (isComplete && !lastAnswerResult) {
    handleComplete();
    return null;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={handleExit} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} height={4} />
        </View>
        <Text style={styles.counter}>
          {Math.min(currentIndex + 1, cards.length)}/{cards.length}
        </Text>
      </View>

      {/* Card content */}
      <Animated.View style={[styles.cardWrapper, animatedStyle]}>
        {currentCard?.card_type === 'lesson_section' || currentCard?.card_type === 'concept' ? (
          <>
            <TeachingCard card={currentCard} />
            <View style={styles.teachingFooter}>
              <Button title="Continue" onPress={handleTeachingContinue} />
            </View>
          </>
        ) : currentCard?.card_type === 'question' ? (
          <QuestionCard
            card={currentCard}
            onSubmit={handleAnswerSubmit}
            submitting={submitting}
          />
        ) : null}
      </Animated.View>

      {/* Answer feedback overlay */}
      {lastAnswerResult && (
        <View style={styles.feedbackOverlay}>
          <AnswerFeedback
            result={lastAnswerResult}
            onContinue={handleContinue}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  progressContainer: {
    flex: 1,
  },
  counter: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    minWidth: 40,
    textAlign: 'right',
  },
  cardWrapper: {
    flex: 1,
  },
  teachingFooter: {
    padding: spacing.xl,
    paddingBottom: spacing.md,
  },
  feedbackOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.danger,
  },
});

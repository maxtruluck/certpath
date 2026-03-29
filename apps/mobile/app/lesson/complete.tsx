import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, fontSize } from '@/lib/theme';
import Button from '@/components/Button';

export default function LessonCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    questionsCorrect?: string;
    questionsTotal?: string;
    stepsCompleted?: string;
    stepsTotal?: string;
    lessonTitle?: string;
    courseSlug?: string;
    courseId?: string;
  }>();

  const correct = parseInt(params.questionsCorrect || '0', 10);
  const total = parseInt(params.questionsTotal || '0', 10);
  const stepsCompleted = parseInt(params.stepsCompleted || '0', 10);
  const stepsTotal = parseInt(params.stepsTotal || '0', 10);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const lessonTitle = params.lessonTitle || '';
  const courseSlug = params.courseSlug || '';

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleBackToCourse = () => {
    if (courseSlug) {
      router.replace(`/course/${courseSlug}/path`);
    } else {
      router.dismissAll();
    }
  };

  const handleNextLesson = () => {
    // Go back to path screen which will show the updated state
    if (courseSlug) {
      router.replace(`/course/${courseSlug}/path`);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={40} color={colors.success} />
          </View>
          <Text style={styles.title}>Lesson Complete!</Text>
          {lessonTitle ? (
            <Text style={styles.lessonName}>{lessonTitle}</Text>
          ) : null}
        </View>

        <View style={styles.statsSection}>
          {/* Steps completed */}
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stepsCompleted}/{stepsTotal}</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
            {total > 0 && (
              <View style={styles.statBox}>
                <Text style={[styles.statValue, accuracy >= 80 ? styles.goodAccuracy : accuracy >= 50 ? styles.okAccuracy : styles.lowAccuracy]}>
                  {accuracy}%
                </Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            )}
          </View>

          {total > 0 && (
            <Text style={styles.scoreDetail}>
              {correct}/{total} questions correct
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title="Next Lesson"
            onPress={handleNextLesson}
          />
          <Button
            title="Back to Course"
            onPress={handleBackToCourse}
            variant="secondary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34,197,94,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  lessonName: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: spacing['3xl'],
    gap: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.md,
    padding: spacing.xl,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  scoreDetail: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  goodAccuracy: {
    color: colors.success,
  },
  okAccuracy: {
    color: colors.warning,
  },
  lowAccuracy: {
    color: colors.danger,
  },
  actions: {
    gap: spacing.md,
  },
});

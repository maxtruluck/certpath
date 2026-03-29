import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  AppState,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import { apiFetch } from '@/lib/api';
import { colors, radii, spacing, fontSize } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import MarkdownContent from '@/components/MarkdownContent';

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  long_description: string | null;
  category: string;
  difficulty: string;
  thumbnail_url: string | null;
  provider_name: string;
  price_cents: number | null;
  stats: {
    module_count: number;
    lesson_count: number;
    question_count: number;
  };
  cert_info: {
    passing_score: number | null;
    max_score: number | null;
    exam_duration_minutes: number | null;
    total_questions_on_exam: number | null;
    exam_fee_cents: number | null;
    provider_name: string | null;
    provider_url: string | null;
  };
  user_progress: {
    id: string;
    status: string;
    readiness_score: number;
    sessions_completed: number;
  } | null;
  creator: {
    id: string;
    creator_name: string;
    bio: string | null;
  } | null;
}

export default function CourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const fetchCourse = useCallback(() => {
    return apiFetch<CourseDetail>(`/api/courses/${slug}`)
      .then(setCourse)
      .catch((err) => console.error('Course detail error:', err));
  }, [slug]);

  useEffect(() => {
    fetchCourse().finally(() => setLoading(false));
  }, [fetchCourse]);

  // Re-fetch enrollment status when app returns to foreground (after web purchase)
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        fetchCourse();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [fetchCourse]);

  const handleEnroll = async () => {
    if (!course) return;

    // Paid course: open web checkout
    if (course.price_cents && course.price_cents > 0) {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL!;
      await Linking.openURL(
        `${apiUrl}/checkout?course=${course.slug}`,
      );
      // Re-fetch course to check enrollment status
      const updated = await apiFetch<CourseDetail>(`/api/courses/${slug}`);
      setCourse(updated);
      return;
    }

    // Free course
    setEnrolling(true);
    try {
      await apiFetch(`/api/courses/${slug}/enroll`, { method: 'POST' });
      const updated = await apiFetch<CourseDetail>(`/api/courses/${slug}`);
      setCourse(updated);
    } catch (err: any) {
      Alert.alert('Enrollment failed', err.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Course not found</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
      </SafeAreaView>
    );
  }

  const isEnrolled = !!course.user_progress;
  const isPaid = (course.price_cents || 0) > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.nav}>
        <Button title="Back" onPress={() => router.back()} variant="ghost" />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerSection}>
          {course.category && (
            <Text style={styles.category}>{course.category}</Text>
          )}
          <Text style={styles.title}>{course.title}</Text>
          {course.provider_name && (
            <Text style={styles.provider}>{course.provider_name}</Text>
          )}
          <Text style={styles.description}>{course.description}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatPill icon="book-outline" value={`${course.stats.lesson_count} lessons`} />
          <StatPill icon="help-circle-outline" value={`${course.stats.question_count} questions`} />
          <StatPill icon="layers-outline" value={`${course.stats.module_count} modules`} />
        </View>

        {course.cert_info?.passing_score && (
          <View style={styles.certInfo}>
            <Text style={styles.certInfoTitle}>Exam Information</Text>
            <View style={styles.certRow}>
              <Text style={styles.certLabel}>Passing Score</Text>
              <Text style={styles.certValue}>{course.cert_info.passing_score}/{course.cert_info.max_score || '?'}</Text>
            </View>
            {course.cert_info.exam_duration_minutes && (
              <View style={styles.certRow}>
                <Text style={styles.certLabel}>Duration</Text>
                <Text style={styles.certValue}>{course.cert_info.exam_duration_minutes} min</Text>
              </View>
            )}
            {course.cert_info.total_questions_on_exam && (
              <View style={styles.certRow}>
                <Text style={styles.certLabel}>Questions</Text>
                <Text style={styles.certValue}>{course.cert_info.total_questions_on_exam}</Text>
              </View>
            )}
          </View>
        )}

        {course.long_description && (
          <View style={styles.longDesc}>
            <MarkdownContent content={course.long_description} />
          </View>
        )}

        {course.creator && (
          <View style={styles.creatorBox}>
            <Text style={styles.creatorLabel}>Created by</Text>
            <Text style={styles.creatorName}>{course.creator.creator_name}</Text>
            {course.creator.bio && (
              <Text style={styles.creatorBio}>{course.creator.bio}</Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.ctaBar}>
        {isEnrolled ? (
          <Button
            title="Continue Learning"
            onPress={() => router.push(`/course/${slug}/path`)}
          />
        ) : isPaid ? (
          <Button
            title={`Buy - $${((course.price_cents || 0) / 100).toFixed(2)}`}
            onPress={handleEnroll}
            loading={enrolling}
          />
        ) : (
          <Button
            title="Enroll Free"
            onPress={handleEnroll}
            loading={enrolling}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function StatPill({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon as any} size={14} color={colors.textSecondary} />
      <Text style={styles.statPillText}>{value}</Text>
    </View>
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
  nav: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: spacing.xl,
  },
  category: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  provider: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  statPillText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  certInfo: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  certInfoTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  certLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  certValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  longDesc: {
    marginBottom: spacing.xl,
  },
  creatorBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  creatorLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  creatorName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  creatorBio: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.danger,
  },
});

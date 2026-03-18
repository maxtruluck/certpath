import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';
import { useSessionStore } from '@/lib/store';
import { colors, radii, spacing, fontSize } from '@/lib/theme';
import ProgressBar from '@/components/ProgressBar';
import Button from '@/components/Button';

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  display_order: number;
  state: 'locked' | 'available' | 'in_progress' | 'completed';
  question_count: number;
  word_count: number;
  items_completed: number;
  items_total: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  display_order: number;
  weight_percent: number;
  lessons: Lesson[];
}

interface PathData {
  course: { id: string; title: string };
  modules: Module[];
  primary_cta: {
    type: 'continue' | 'start' | 'caught_up';
    lesson_id: string | null;
    label: string;
  };
  progress: { completed: number; total: number };
}

export default function CoursePathScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [data, setData] = useState<PathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingLesson, setStartingLesson] = useState<string | null>(null);
  const startSession = useSessionStore((s) => s.startSession);

  const fetchPath = useCallback(async () => {
    try {
      const path = await apiFetch<PathData>(`/api/courses/${slug}/path`);
      setData(path);
    } catch (err) {
      console.error('Path fetch error:', err);
    }
  }, [slug]);

  useEffect(() => {
    fetchPath().finally(() => setLoading(false));
  }, [fetchPath]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPath();
    setRefreshing(false);
  }, [fetchPath]);

  const launchLesson = async (lessonId: string) => {
    if (!data) return;
    setStartingLesson(lessonId);
    try {
      const session = await apiFetch<{
        session_id: string;
        course_id: string;
        lesson_id: string;
        lesson_title: string;
        cards: any[];
        total_items: number;
        items_completed: number;
      }>(`/api/session/generate?course_id=${data.course.id}&lesson_id=${lessonId}`);

      startSession({
        sessionId: session.session_id,
        courseId: session.course_id,
        lessonId: session.lesson_id,
        lessonTitle: session.lesson_title,
        cards: session.cards,
        totalItems: session.total_items,
        itemsCompleted: session.items_completed,
      });

      router.push(`/lesson/${session.session_id}`);
    } catch (err: any) {
      console.error('Launch lesson error:', err);
    } finally {
      setStartingLesson(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Failed to load course path</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
      </SafeAreaView>
    );
  }

  const sections = data.modules.map((mod) => ({
    title: mod.title,
    description: mod.description,
    data: mod.lessons,
  }));

  const progressFraction =
    data.progress.total > 0 ? data.progress.completed / data.progress.total : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.nav}>
        <Button title="Back" onPress={() => router.back()} variant="ghost" />
      </View>

      <View style={styles.headerSection}>
        <Text style={styles.courseTitle}>{data.course.title}</Text>
        <View style={styles.progressRow}>
          <ProgressBar progress={progressFraction} height={6} />
          <Text style={styles.progressText}>
            {data.progress.completed}/{data.progress.total} lessons
          </Text>
        </View>

        {data.primary_cta.lesson_id && (
          <Button
            title={data.primary_cta.label}
            onPress={() => launchLesson(data.primary_cta.lesson_id!)}
            loading={startingLesson === data.primary_cta.lesson_id}
            style={styles.ctaButton}
          />
        )}
        {data.primary_cta.type === 'caught_up' && (
          <View style={styles.caughtUpBanner}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.caughtUpText}>All lessons completed!</Text>
          </View>
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.description ? (
              <Text style={styles.sectionDesc}>{section.description}</Text>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => (
          <LessonRow
            lesson={item}
            onPress={() => launchLesson(item.id)}
            loading={startingLesson === item.id}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

function LessonRow({
  lesson,
  onPress,
  loading,
}: {
  lesson: Lesson;
  onPress: () => void;
  loading: boolean;
}) {
  const isLocked = lesson.state === 'locked';
  const isCompleted = lesson.state === 'completed';
  const isInProgress = lesson.state === 'in_progress';

  const stateIcon = isCompleted
    ? 'checkmark-circle'
    : isInProgress
      ? 'play-circle'
      : isLocked
        ? 'lock-closed'
        : 'ellipse-outline';

  const stateColor = isCompleted
    ? colors.success
    : isInProgress
      ? colors.primary
      : isLocked
        ? colors.textMuted
        : colors.textSecondary;

  return (
    <Pressable
      style={[styles.lessonRow, isLocked && styles.lessonLocked]}
      onPress={onPress}
      disabled={isLocked || loading}
    >
      <Ionicons name={stateIcon as any} size={22} color={stateColor} />
      <View style={styles.lessonInfo}>
        <Text
          style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]}
          numberOfLines={2}
        >
          {lesson.title}
        </Text>
        <View style={styles.lessonMeta}>
          {lesson.question_count > 0 && (
            <Text style={styles.lessonMetaText}>{lesson.question_count} questions</Text>
          )}
        </View>
        {isInProgress && lesson.items_total > 0 && (
          <ProgressBar
            progress={lesson.items_completed / lesson.items_total}
            height={3}
            color={colors.primary}
          />
        )}
      </View>
      {loading && <ActivityIndicator size="small" color={colors.primary} />}
      {!isLocked && !loading && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </Pressable>
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
  headerSection: {
    padding: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  courseTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  progressRow: {
    gap: spacing.sm,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  ctaButton: {
    marginTop: spacing.xs,
  },
  caughtUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(34,197,94,0.08)',
    padding: spacing.md,
    borderRadius: radii.md,
  },
  caughtUpText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.success,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  sectionHeader: {
    paddingVertical: spacing.md,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  sectionDesc: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.md,
  },
  lessonLocked: {
    opacity: 0.5,
  },
  lessonInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  lessonTitle: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text,
  },
  lessonTitleLocked: {
    color: colors.textMuted,
  },
  lessonMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  lessonMetaText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing['3xl'] + spacing.md,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.danger,
  },
});

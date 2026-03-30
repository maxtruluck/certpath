import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import { colors, spacing, fontSize } from '@/lib/theme';
import HeroCourseCard from '@/components/HeroCourseCard';

const SCREEN_PAD = 16;

/* ─── Types ─── */

interface DashboardCourse {
  id: string;
  course_id: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    difficulty: string;
    thumbnail_url: string | null;
    provider_name: string;
  };
  readiness_score: number;
  questions_seen: number;
  questions_correct: number;
  questions_total: number;
  lessons_total: number;
  lessons_completed: number;
  sessions_completed: number;
  last_session_at: string | null;
  progress_percent: number;
  resume_point: {
    module_title: string;
    lesson_title: string;
    lesson_id: string;
    step_index: number;
    step_total: number;
  } | null;
}

interface BrowseCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
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
  tags?: string[];
  user_progress: {
    status: string;
    readiness_score: number;
    sessions_completed: number;
  } | null;
}

/* ─── Component ─── */

export default function HomeScreen() {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState<DashboardCourse[]>([]);
  const [browseCourses, setBrowseCourses] = useState<BrowseCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const dashRes = await apiFetch<{ active_courses: DashboardCourse[] }>('/api/dashboard');
      const courses = dashRes.active_courses || [];
      setEnrolled(courses);

      // Only fetch browse courses if user has no enrollments
      if (courses.length === 0) {
        const browseRes = await apiFetch<{ courses: BrowseCourse[] }>('/api/courses?limit=6');
        setBrowseCourses(browseRes.courses || []);
      }
    } catch (err) {
      console.error('Home fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const heroCourse = useMemo(() => {
    if (enrolled.length === 0) return null;
    const sorted = [...enrolled].sort((a, b) => {
      const aTime = a.last_session_at ? new Date(a.last_session_at).getTime() : 0;
      const bTime = b.last_session_at ? new Date(b.last_session_at).getTime() : 0;
      return bTime - aTime;
    });
    return sorted[0];
  }, [enrolled]);

  const otherEnrolled = useMemo(() => {
    if (!heroCourse) return [];
    return enrolled.filter((c) => c.id !== heroCourse.id);
  }, [enrolled, heroCourse]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>
          <Text style={styles.logoOpen}>open</Text>
          <Text style={styles.logoED}>ED</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {enrolled.length > 0 ? (
          <ReturningUserView
            heroCourse={heroCourse!}
            otherEnrolled={otherEnrolled}
            router={router}
          />
        ) : (
          <NewUserView
            courses={browseCourses}
            router={router}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Returning User ─── */

function ReturningUserView({
  heroCourse,
  otherEnrolled,
  router,
}: {
  heroCourse: DashboardCourse;
  otherEnrolled: DashboardCourse[];
  router: ReturnType<typeof useRouter>;
}) {
  const heroProgress = heroCourse.progress_percent ?? 0;

  const rp = heroCourse.resume_point;
  const heroSubtitle = rp
    ? `${rp.lesson_title} \u00B7 ${rp.step_index}/${rp.step_total} steps`
    : heroCourse.lessons_total > 0
      ? `${heroCourse.lessons_completed ?? 0}/${heroCourse.lessons_total} lessons complete`
      : `${heroProgress}% complete`;

  return (
    <>
      {/* Hero: Continue Learning */}
      <View style={styles.heroSection}>
        <HeroCourseCard
          title={heroCourse.course.title}
          subtitle={heroSubtitle}
          progressPercent={heroProgress}
          buttonLabel="Continue learning"
          onPress={() =>
            router.push(`/course/${heroCourse.course.slug}/path`)
          }
        />
      </View>

      {/* Your Courses: full-width vertical list */}
      {otherEnrolled.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR COURSES</Text>
          {otherEnrolled.map((item) => {
            const pct = item.progress_percent ?? 0;
            const lessonLabel = item.lessons_total > 0
              ? `${item.lessons_completed ?? 0}/${item.lessons_total} lessons`
              : null;
            return (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/course/${item.course.slug}/path`)}
                style={({ pressed }) => [
                  styles.courseRow,
                  pressed && styles.courseRowPressed,
                ]}
              >
                <View style={styles.courseRowTop}>
                  <Text style={styles.courseRowTitle} numberOfLines={1}>
                    {item.course.title}
                  </Text>
                  <Text style={styles.courseRowPercent}>{pct}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(Math.max(pct, 0), 100)}%` },
                    ]}
                  />
                </View>
                {lessonLabel && (
                  <Text style={styles.courseRowMeta}>{lessonLabel}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </>
  );
}

/* ─── New User ─── */

function NewUserView({
  courses,
  router,
}: {
  courses: BrowseCourse[];
  router: ReturnType<typeof useRouter>;
}) {
  const formatPrice = (cents: number | null) =>
    cents && cents > 0 ? `$${(cents / 100).toFixed(2)}` : 'Free';

  return (
    <>
      {/* Popular Courses */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>POPULAR COURSES</Text>
        {courses.length === 0 ? (
          <Text style={styles.emptyText}>No courses available yet.</Text>
        ) : (
          courses.map((course) => (
            <Pressable
              key={course.id}
              onPress={() => router.push(`/course/${course.slug}`)}
              style={({ pressed }) => [
                styles.courseRow,
                pressed && styles.courseRowPressed,
              ]}
            >
              <Text style={styles.courseRowTitle} numberOfLines={1}>
                {course.title}
              </Text>
              <View style={styles.browseRowMeta}>
                {course.stats.lesson_count > 0 && (
                  <Text style={styles.courseRowMeta}>
                    {course.stats.lesson_count} lessons
                  </Text>
                )}
                <Text style={styles.courseRowMeta}>{course.category}</Text>
                <Text style={styles.courseRowPrice}>
                  {formatPrice(course.price_cents)}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </>
  );
}

/* ─── Styles ─── */

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
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    fontSize: fontSize.xl,
  },
  logoOpen: {
    fontWeight: '600',
    color: colors.text,
  },
  logoED: {
    fontWeight: '800',
    color: colors.text,
  },
  heroSection: {
    paddingHorizontal: SCREEN_PAD,
    marginTop: 8,
  },
  section: {
    paddingHorizontal: SCREEN_PAD,
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  courseRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 8,
  },
  courseRowPressed: {
    backgroundColor: colors.surfaceLight,
  },
  courseRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseRowTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  courseRowPercent: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  courseRowMeta: {
    fontSize: fontSize.xs,
    color: '#999',
    marginTop: 6,
  },
  browseRowMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  courseRowPrice: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

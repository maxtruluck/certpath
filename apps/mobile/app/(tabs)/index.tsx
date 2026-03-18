import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import { colors, spacing, fontSize } from '@/lib/theme';
import { getCategoryStyle, getFeaturedGradient, CURATED_CATEGORIES } from '@/lib/category-styles';
import HeroCourseCard from '@/components/HeroCourseCard';
import CompactCourseCard from '@/components/CompactCourseCard';
import DiscoveryCourseCard from '@/components/DiscoveryCourseCard';
import FeaturedCourseCard from '@/components/FeaturedCourseCard';
import CategoryIcon from '@/components/CategoryIcon';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 8;
const SCREEN_PAD = 16;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - SCREEN_PAD * 2 - CARD_GAP) / 2;

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
  sessions_completed: number;
  last_session_at: string | null;
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
    topic_count: number;
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
  const [allCourses, setAllCourses] = useState<BrowseCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, browseRes] = await Promise.all([
        apiFetch<{ active_courses: DashboardCourse[] }>('/api/dashboard'),
        apiFetch<{ courses: BrowseCourse[] }>('/api/courses'),
      ]);
      setEnrolled(dashRes.active_courses || []);
      setAllCourses(browseRes.courses || []);
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

  const isReturningUser = enrolled.length > 0;

  const heroCourse = useMemo(() => {
    if (enrolled.length === 0) return null;
    const sorted = [...enrolled].sort((a, b) => {
      const aTime = a.last_session_at
        ? new Date(a.last_session_at).getTime()
        : 0;
      const bTime = b.last_session_at
        ? new Date(b.last_session_at).getTime()
        : 0;
      return bTime - aTime;
    });
    return sorted[0];
  }, [enrolled]);

  const otherEnrolled = useMemo(() => {
    if (!heroCourse) return [];
    return enrolled.filter((c) => c.id !== heroCourse.id);
  }, [enrolled, heroCourse]);

  const enrolledCourseIds = useMemo(
    () => new Set(enrolled.map((c) => c.course_id)),
    [enrolled],
  );

  const discoveryCourses = useMemo(
    () => allCourses.filter((c) => !enrolledCourseIds.has(c.id)).slice(0, 6),
    [allCourses, enrolledCourseIds],
  );

  const featuredCourses = useMemo(() => allCourses.slice(0, 6), [allCourses]);

  const categories = useMemo(() => {
    return CURATED_CATEGORIES.map((name) => {
      const style = getCategoryStyle(name);
      return { name, icon: style.icon, bgColor: style.bgColor, iconColor: style.textColor };
    });
  }, []);

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
        {isReturningUser ? (
          <ReturningUserView
            heroCourse={heroCourse!}
            otherEnrolled={otherEnrolled}
            discoveryCourses={discoveryCourses}
            router={router}
          />
        ) : (
          <NewUserView
            courses={allCourses.slice(0, 10)}
            featuredCourses={featuredCourses}
            categories={categories}
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
  discoveryCourses,
  router,
}: {
  heroCourse: DashboardCourse;
  otherEnrolled: DashboardCourse[];
  discoveryCourses: BrowseCourse[];
  router: ReturnType<typeof useRouter>;
}) {
  const heroProgress =
    heroCourse.questions_total > 0
      ? Math.round(
          (heroCourse.questions_seen / heroCourse.questions_total) * 100,
        )
      : 0;

  const heroSubtitle =
    heroCourse.lessons_total > 0
      ? `${heroProgress}% complete`
      : `${heroCourse.sessions_completed} sessions completed`;

  return (
    <>
      {/* Section A: Continue Learning Hero */}
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

      {/* Section B: Your Courses (horizontal) */}
      {otherEnrolled.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR COURSES</Text>
          <FlatList
            horizontal
            data={otherEnrolled}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => {
              const pct =
                item.questions_total > 0
                  ? Math.round(
                      (item.questions_seen / item.questions_total) * 100,
                    )
                  : 0;
              return (
                <CompactCourseCard
                  title={item.course.title}
                  progressPercent={pct}
                  onPress={() =>
                    router.push(`/course/${item.course.slug}/path`)
                  }
                />
              );
            }}
            ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          />
        </View>
      )}

      {/* Section C: Recommended (2-col grid) */}
      {discoveryCourses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECOMMENDED FOR YOU</Text>
          <View style={styles.grid}>
            {discoveryCourses.map((course) => (
              <DiscoveryCourseCard
                key={course.id}
                title={course.title}
                creatorName={course.provider_name}
                description={course.description}
                lessonCount={course.stats.topic_count}
                category={course.category}
                priceCents={course.price_cents}
                tags={course.tags}
                width={GRID_CARD_WIDTH}
                onPress={() => router.push(`/course/${course.slug}`)}
              />
            ))}
          </View>
        </View>
      )}
    </>
  );
}

/* ─── New User ─── */

function NewUserView({
  courses,
  featuredCourses,
  categories,
  router,
}: {
  courses: BrowseCourse[];
  featuredCourses: BrowseCourse[];
  categories: { name: string; icon: string; bgColor: string; iconColor: string }[];
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <>
      {/* Section A: Hero */}
      <View style={styles.heroSection}>
        <HeroCourseCard
          title="Start learning today"
          subtitle="Bite-sized interactive courses from expert creators"
          buttonLabel="Explore courses"
          onPress={() => router.push('/(tabs)/browse')}
        />
      </View>

      {/* Section B: Category Icons */}
      {categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CATEGORIES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {categories.map((cat) => (
              <CategoryIcon
                key={cat.name}
                name={cat.name}
                icon={cat.icon}
                bgColor={cat.bgColor}
                iconColor={cat.iconColor}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/browse',
                    params: { category: cat.name },
                  })
                }
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Section C: Featured (horizontal scroll) */}
      {featuredCourses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FEATURED</Text>
          <FlatList
            horizontal
            data={featuredCourses}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            snapToInterval={170}
            decelerationRate="fast"
            renderItem={({ item, index }) => (
              <FeaturedCourseCard
                title={item.title}
                creatorName={item.provider_name}
                lessonCount={item.stats.topic_count}
                priceCents={item.price_cents}
                thumbnailUrl={item.thumbnail_url}
                tags={item.tags}
                gradientColors={getFeaturedGradient(index)}
                onPress={() => router.push(`/course/${item.slug}`)}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          />
        </View>
      )}

      {/* Section D: New on openED (2-col grid) */}
      {courses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NEW ON OPENED</Text>
          <View style={styles.grid}>
            {courses.map((course) => (
              <DiscoveryCourseCard
                key={course.id}
                title={course.title}
                creatorName={course.provider_name}
                description={course.description}
                lessonCount={course.stats.topic_count}
                category={course.category}
                priceCents={course.price_cents}
                tags={course.tags}
                width={GRID_CARD_WIDTH}
                onPress={() => router.push(`/course/${course.slug}`)}
              />
            ))}
          </View>
        </View>
      )}
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
  horizontalList: {
    paddingRight: SCREEN_PAD,
  },
  categoryRow: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
});

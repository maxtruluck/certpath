import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import { colors, radii, spacing, fontSize } from '@/lib/theme';
import Button from '@/components/Button';

/* --- Types --- */

interface ProfileData {
  user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    role: string;
    created_at?: string;
  };
  stats: {
    courses_enrolled: number;
    courses_completed: number;
    total_questions_seen: number;
    total_questions_correct: number;
    accuracy_percent: number;
    total_sessions: number;
    total_reviews: number;
  };
}

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
  enrolled_at?: string;
}

/* --- Helpers --- */

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Not started';
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Last studied today';
  if (diffDays === 1) return 'Last studied 1d ago';
  if (diffDays < 7) return `Last studied ${diffDays}d ago`;
  if (diffDays < 14) return 'Last studied 1w ago';
  if (diffDays < 30) return `Last studied ${Math.floor(diffDays / 7)}w ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Last studied ${diffMonths}mo ago`;
}

function formatMemberSince(
  profile: ProfileData,
  courses: DashboardCourse[],
): string {
  let earliest: Date | null = null;

  if (profile.user.created_at) {
    earliest = new Date(profile.user.created_at);
  } else {
    const dates = courses
      .map((c) => c.enrolled_at)
      .filter(Boolean)
      .map((d) => new Date(d!).getTime());
    if (dates.length > 0) {
      earliest = new Date(Math.min(...dates));
    }
  }

  if (!earliest) return 'Learning on openED';
  const month = earliest.toLocaleString('en-US', { month: 'short' });
  const year = earliest.getFullYear();
  return `Learning on openED since ${month} ${year}`;
}

function getAccuracyColor(pct: number): string {
  if (pct > 70) return '#0F6E56';
  if (pct >= 40) return '#854F0B';
  return colors.textMuted;
}

/* --- Component --- */

const SCREEN_PAD = 16;

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, dashRes] = await Promise.all([
        apiFetch<ProfileData>('/api/profile'),
        apiFetch<{ active_courses: DashboardCourse[] }>('/api/dashboard'),
      ]);
      setProfile(profileRes);
      setCourses(dashRes.active_courses || []);
    } catch (err) {
      console.error('Profile fetch error:', err);
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

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Button title="Retry" onPress={fetchData} variant="secondary" />
      </SafeAreaView>
    );
  }

  const { user, stats } = profile;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Section A: Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.display_name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {user.display_name}
            </Text>
            <Text style={styles.memberSince} numberOfLines={1}>
              {formatMemberSince(profile, courses)}
            </Text>
          </View>
        </View>

        {/* Section B: Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: getAccuracyColor(stats.accuracy_percent) }]}>
              {stats.accuracy_percent}%
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.total_questions_seen}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.courses_enrolled}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
        </View>

        {/* Section C: My Courses */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY COURSES</Text>
          {courses.length > 0 ? (
            courses.map((item) => {
              const pct =
                item.questions_total > 0
                  ? Math.round(
                      (item.questions_seen / item.questions_total) * 100,
                    )
                  : 0;
              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.courseCard,
                    pressed && styles.courseCardPressed,
                  ]}
                  onPress={() =>
                    router.push(`/course/${item.course.slug}/path`)
                  }
                >
                  <View style={styles.courseCardLeft}>
                    <Text style={styles.courseTitle} numberOfLines={1}>
                      {item.course.title}
                    </Text>
                    <Text style={styles.courseMeta}>
                      {item.lessons_total} lessons {'\u00B7'}{' '}
                      {formatRelativeDate(item.last_session_at)}
                    </Text>
                    <View style={styles.courseProgressTrack}>
                      <View
                        style={[
                          styles.courseProgressFill,
                          { width: `${pct}%` },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.coursePercent}>{pct}%</Text>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyCoursesCard}>
              <Text style={styles.emptyCoursesTitle}>
                Start your learning journey
              </Text>
              <Text style={styles.emptyCoursesSubtitle}>
                Browse interactive courses from expert creators
              </Text>
              <Pressable
                style={styles.emptyCoursesButton}
                onPress={() => router.push('/(tabs)/browse')}
              >
                <Text style={styles.emptyCoursesButtonText}>Browse courses</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Section E: Learning Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LEARNING STATS</Text>
          <View style={styles.learningStatsCard}>
            <View style={styles.learningStatsRow}>
              <Text style={styles.learningStatsLabel}>Questions answered</Text>
              <Text style={styles.learningStatsValue}>{stats.total_questions_seen}</Text>
            </View>
            <View style={styles.learningStatsDivider} />
            <View style={styles.learningStatsRow}>
              <Text style={styles.learningStatsLabel}>Correct answers</Text>
              <Text style={styles.learningStatsValue}>{stats.total_questions_correct}</Text>
            </View>
            <View style={styles.learningStatsDivider} />
            <View style={styles.learningStatsRow}>
              <Text style={styles.learningStatsLabel}>Sessions completed</Text>
              <Text style={styles.learningStatsValue}>{stats.total_sessions}</Text>
            </View>
            <View style={styles.learningStatsDivider} />
            <View style={styles.learningStatsRow}>
              <Text style={styles.learningStatsLabel}>Courses enrolled</Text>
              <Text style={styles.learningStatsValue}>{stats.courses_enrolled}</Text>
            </View>
          </View>
        </View>

        {/* Section D: Account */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.accountCard}>
            <Pressable
              style={({ pressed }) => [
                styles.accountRow,
                pressed && styles.accountRowPressed,
              ]}
              onPress={() => {
                Alert.alert(
                  'Coming soon',
                  'Edit profile will be available in a future update.',
                );
              }}
            >
              <Text style={styles.accountRowText}>Edit profile</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
            <View style={styles.accountDivider} />
            <Pressable
              style={({ pressed }) => [
                styles.accountRow,
                pressed && styles.accountRowPressed,
              ]}
              onPress={handleSignOut}
            >
              <Text style={styles.accountRowText}>Sign out</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* --- Styles --- */

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
    paddingHorizontal: SCREEN_PAD,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    padding: SCREEN_PAD,
    paddingBottom: 40,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.danger,
  },

  // Section A: Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: SCREEN_PAD,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  memberSince: {
    fontSize: 11,
    color: colors.textMuted,
  },

  // Section B: Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: SCREEN_PAD,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
  },

  // Sections
  section: {
    marginBottom: SCREEN_PAD,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // Section C: Courses
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    gap: spacing.md,
  },
  courseCardPressed: {
    backgroundColor: colors.surfaceLight,
  },
  courseCardLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  courseTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  courseMeta: {
    fontSize: 9,
    color: colors.textMuted,
  },
  courseProgressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  courseProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  coursePercent: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    minWidth: 36,
    textAlign: 'right',
  },

  // Empty courses state
  emptyCoursesCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyCoursesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  emptyCoursesSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyCoursesButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  emptyCoursesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Learning Stats
  learningStatsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  learningStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  learningStatsLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  learningStatsValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  learningStatsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 14,
  },

  // Section D: Account
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  accountRowPressed: {
    backgroundColor: colors.surfaceLight,
  },
  accountRowText: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text,
  },
  accountDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
});

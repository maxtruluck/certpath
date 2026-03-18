import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '@/lib/api';
import { colors, radii, spacing, fontSize } from '@/lib/theme';
import { formatCategoryName, getCategoryStyle } from '@/lib/category-styles';
import DiscoveryCourseCard from '@/components/DiscoveryCourseCard';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_PAD = 16;
const CARD_GAP = 8;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - SCREEN_PAD * 2 - CARD_GAP) / 2;

type SortOption = 'newest' | 'popular' | 'price_low' | 'price_high' | 'free_first';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'popular', label: 'Popular' },
  { key: 'price_low', label: 'Price: Low' },
  { key: 'price_high', label: 'Price: High' },
  { key: 'free_first', label: 'Free First' },
];

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
  tags?: string[];
  stats: {
    module_count: number;
    topic_count: number;
    question_count: number;
  };
  user_progress: {
    status: string;
    readiness_score: number;
    sessions_completed: number;
  } | null;
}

export default function BrowseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [allCourses, setAllCourses] = useState<BrowseCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState(params.category || 'All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (params.category && params.category !== category) {
      setCategory(params.category);
    }
  }, [params.category]);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  const fetchCourses = useCallback(async () => {
    try {
      const data = await apiFetch<{ courses: BrowseCourse[] }>('/api/courses');
      setAllCourses(data.courses || []);
    } catch (err) {
      console.error('Browse fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchCourses().finally(() => setLoading(false));
  }, [fetchCourses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCourses();
    setRefreshing(false);
  }, [fetchCourses]);

  // Build dynamic category list with counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of allCourses) {
      if (c.category) {
        counts[c.category] = (counts[c.category] || 0) + 1;
      }
    }
    return counts;
  }, [allCourses]);

  const categoryFilters = useMemo(() => {
    const cats = Object.keys(categoryCounts).sort();
    return ['All', ...cats];
  }, [categoryCounts]);

  const isSearchActive = debouncedSearch.trim().length > 0;

  // Filter courses by search and/or category
  const filteredCourses = useMemo(() => {
    let result = allCourses;

    if (isSearchActive) {
      const q = debouncedSearch.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.provider_name?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q),
      );
    } else if (category !== 'All') {
      result = result.filter((c) => c.category === category);
    }

    return result;
  }, [allCourses, debouncedSearch, category, isSearchActive]);

  // Sort courses
  const courses = useMemo(() => {
    const sorted = [...filteredCourses];
    switch (sortBy) {
      case 'popular':
        sorted.sort((a, b) => (b.stats.question_count || 0) - (a.stats.question_count || 0));
        break;
      case 'price_low':
        sorted.sort((a, b) => (a.price_cents ?? 0) - (b.price_cents ?? 0));
        break;
      case 'price_high':
        sorted.sort((a, b) => (b.price_cents ?? 0) - (a.price_cents ?? 0));
        break;
      case 'free_first':
        sorted.sort((a, b) => {
          const aFree = (a.price_cents ?? 0) === 0 ? 0 : 1;
          const bFree = (b.price_cents ?? 0) === 0 ? 0 : 1;
          return aFree - bFree;
        });
        break;
      case 'newest':
      default:
        break;
    }
    return sorted;
  }, [filteredCourses, sortBy]);

  // Pair courses into rows of 2 for the grid
  const rows = [];
  for (let i = 0; i < courses.length; i += 2) {
    rows.push(courses.slice(i, i + 2));
  }

  const resultCountText = useMemo(() => {
    const count = courses.length;
    const label = count === 1 ? 'course' : 'courses';
    if (isSearchActive) return `${count} ${label}`;
    if (category !== 'All') return `${count} ${label} in ${formatCategoryName(category)}`;
    return `${count} ${label}`;
  }, [courses.length, category, isSearchActive]);

  // Get the category icon for empty state
  const emptyCategoryIcon = useMemo(() => {
    if (category === 'All') return 'search-outline';
    const style = getCategoryStyle(category);
    return (style.icon || 'folder-outline') as keyof typeof Ionicons.glyphMap;
  }, [category]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search courses..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      {/* Category filter pills - hidden when searching */}
      {!isSearchActive && (
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {categoryFilters.map((cat) => {
              const count = cat === 'All' ? allCourses.length : (categoryCounts[cat] || 0);
              const isActive = category === cat;
              return (
                <Pressable
                  key={cat}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isActive && styles.filterTextActive,
                    ]}
                  >
                    {cat === 'All' ? 'All' : formatCategoryName(cat)} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Results count + sort */}
      {!loading && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>{resultCountText}</Text>
          <Pressable
            style={styles.sortButton}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Ionicons name="swap-vertical" size={14} color={colors.textSecondary} />
            <Text style={styles.sortButtonText}>
              {SORT_OPTIONS.find((s) => s.key === sortBy)?.label}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Sort dropdown */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={[styles.sortMenuItem, sortBy === opt.key && styles.sortMenuItemActive]}
              onPress={() => {
                setSortBy(opt.key);
                setShowSortMenu(false);
              }}
            >
              <Text
                style={[
                  styles.sortMenuText,
                  sortBy === opt.key && styles.sortMenuTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name={isSearchActive ? 'search-outline' : (emptyCategoryIcon as any)}
            size={40}
            color={colors.textMuted}
            style={{ marginBottom: 12, opacity: 0.5 }}
          />
          <Text style={styles.emptyText}>
            {isSearchActive
              ? `No courses found for '${debouncedSearch.trim()}'`
              : category !== 'All'
                ? `No courses in ${formatCategoryName(category)} yet.\nCheck back soon!`
                : 'No courses found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, index) => String(index)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item: row }) => (
            <View style={styles.gridRow}>
              {row.map((course) => (
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
              {row.length === 1 && <View style={{ width: GRID_CARD_WIDTH }} />}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: CARD_GAP }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: SCREEN_PAD,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SCREEN_PAD,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.md,
    gap: spacing.sm,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  filterRow: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  filters: {
    paddingHorizontal: SCREEN_PAD,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PAD,
    paddingVertical: spacing.sm,
  },
  resultsText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: '#f1f5f9',
  },
  sortButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sortMenu: {
    position: 'absolute',
    right: SCREEN_PAD,
    top: 180,
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  sortMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sortMenuItemActive: {
    backgroundColor: '#f1f5f9',
  },
  sortMenuText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sortMenuTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PAD,
  },
  list: {
    padding: SCREEN_PAD,
    paddingTop: spacing.xs,
  },
  gridRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

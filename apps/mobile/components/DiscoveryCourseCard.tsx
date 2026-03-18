import { View, Text, Pressable, StyleSheet } from 'react-native';
import { getCategoryStyle, formatCategoryName } from '@/lib/category-styles';
import { getTagStyle } from '@/lib/tag-styles';

interface DiscoveryCourseCardProps {
  title: string;
  creatorName?: string;
  description?: string;
  lessonCount?: number;
  category?: string;
  priceCents?: number | null;
  tags?: string[];
  width?: number;
  onPress: () => void;
}

export default function DiscoveryCourseCard({
  title,
  creatorName,
  description,
  lessonCount,
  category,
  priceCents,
  tags,
  width,
  onPress,
}: DiscoveryCourseCardProps) {
  const catStyle = getCategoryStyle(category);
  const isFree = priceCents == null || priceCents === 0;
  const visibleTags = (tags || []).slice(0, 2);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: catStyle.cardBg },
        width != null && { width },
        pressed && styles.pressed,
      ]}
    >
      {/* Thin color bar */}
      <View style={[styles.topBar, { backgroundColor: catStyle.barColor }]} />

      {/* Body */}
      <View style={styles.body}>
        {/* Title row with price badge */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View
            style={[styles.priceBadge, isFree ? styles.freeBadge : styles.paidBadge]}
          >
            <Text
              style={[styles.priceText, isFree ? styles.freeText : styles.paidText]}
            >
              {isFree ? 'Free' : `$${((priceCents ?? 0) / 100).toFixed(2)}`}
            </Text>
          </View>
        </View>

        {creatorName ? (
          <Text style={styles.creator} numberOfLines={1}>
            by {creatorName}
          </Text>
        ) : null}

        {description ? (
          <Text style={styles.description} numberOfLines={1}>
            {description}
          </Text>
        ) : null}

        {/* Spacer pushes meta to bottom */}
        <View style={styles.spacer} />

        {/* Meta row */}
        <View style={styles.metaRow}>
          {lessonCount != null && lessonCount > 0 && (
            <Text style={styles.lessonText}>
              {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
            </Text>
          )}
          {category ? (
            <View style={[styles.badge, { backgroundColor: catStyle.badgeBg }]}>
              <Text
                style={[styles.badgeText, { color: catStyle.badgeText }]}
                numberOfLines={1}
              >
                {formatCategoryName(category)}
              </Text>
            </View>
          ) : null}
          {visibleTags.map((tag) => {
            const ts = getTagStyle(tag);
            return (
              <View key={tag} style={[styles.badge, { backgroundColor: ts.bgColor }]}>
                <Text style={[styles.badgeText, { color: ts.color }]} numberOfLines={1}>
                  {tag}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#e8e4dd',
    minHeight: 140,
  },
  pressed: {
    opacity: 0.92,
  },
  topBar: {
    height: 4,
    width: '100%',
  },
  body: {
    flex: 1,
    padding: 11,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 17,
  },
  priceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 1,
  },
  freeBadge: {
    backgroundColor: '#E1F5EE',
  },
  paidBadge: {
    backgroundColor: '#f1f5f9',
  },
  priceText: {
    fontSize: 9,
    fontWeight: '600',
  },
  freeText: {
    color: '#0F6E56',
  },
  paidText: {
    color: '#1e293b',
  },
  creator: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 3,
  },
  description: {
    fontSize: 10,
    color: '#b0abb5',
    marginTop: 2,
    lineHeight: 13,
  },
  spacer: {
    flex: 1,
    minHeight: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  lessonText: {
    fontSize: 9,
    color: '#94a3b8',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '500',
  },
});

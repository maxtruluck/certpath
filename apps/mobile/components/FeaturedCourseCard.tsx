import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { spacing } from '@/lib/theme';
import { getTagStyle } from '@/lib/tag-styles';

interface FeaturedCourseCardProps {
  title: string;
  creatorName?: string;
  lessonCount?: number;
  priceCents?: number | null;
  thumbnailUrl?: string | null;
  tags?: string[];
  gradientColors: [string, string];
  onPress: () => void;
}

export default function FeaturedCourseCard({
  title,
  creatorName,
  lessonCount,
  priceCents,
  thumbnailUrl,
  tags,
  gradientColors,
  onPress,
}: FeaturedCourseCardProps) {
  const isFree = priceCents == null || priceCents === 0;
  const visibleTags = (tags || []).slice(0, 2);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headerArea}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <>
            <View
              style={[styles.headerBase, { backgroundColor: gradientColors[0] }]}
            />
            <View
              style={[styles.headerOverlay, { backgroundColor: gradientColors[1] }]}
            />
          </>
        )}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>
            {isFree ? 'Free' : `$${((priceCents ?? 0) / 100).toFixed(2)}`}
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {creatorName || 'Unknown'}
          {lessonCount != null && lessonCount > 0
            ? ` \u00B7 ${lessonCount} lessons`
            : ''}
        </Text>
        {visibleTags.length > 0 && (
          <View style={styles.tagRow}>
            {visibleTags.map((tag) => {
              const ts = getTagStyle(tag);
              return (
                <View key={tag} style={[styles.tagBadge, { backgroundColor: ts.bgColor }]}>
                  <Text style={[styles.tagText, { color: ts.color }]}>{tag}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pressed: {
    opacity: 0.9,
  },
  headerArea: {
    height: 76,
    position: 'relative',
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  thumbnailImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  headerBase: {
    ...StyleSheet.absoluteFillObject,
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    opacity: 0.65,
  },
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#1e293b',
  },
  body: {
    padding: spacing.sm,
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 16,
  },
  meta: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  tagBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 7,
    fontWeight: '500',
  },
});

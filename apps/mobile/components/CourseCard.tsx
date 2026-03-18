import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { colors, radii, spacing, fontSize } from '@/lib/theme';

interface CourseCardProps {
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  thumbnailUrl?: string | null;
  providerName?: string;
  questionCount?: number;
  lessonCount?: number;
  priceCents?: number | null;
  // Enrolled course extras
  readinessScore?: number;
  sessionsCompleted?: number;
  onPress: () => void;
}

export default function CourseCard({
  title,
  description,
  category,
  difficulty,
  thumbnailUrl,
  providerName,
  questionCount,
  lessonCount,
  priceCents,
  readinessScore,
  sessionsCompleted,
  onPress,
}: CourseCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumb]}>
          <Text style={styles.placeholderText}>{title.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.content}>
        {category && <Text style={styles.category}>{category}</Text>}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {description && (
          <Text style={styles.description} numberOfLines={2}>{description}</Text>
        )}
        <View style={styles.meta}>
          {providerName && <Text style={styles.metaText}>{providerName}</Text>}
          {difficulty && <Text style={styles.metaText}>{difficulty}</Text>}
          {lessonCount != null && lessonCount > 0 && (
            <Text style={styles.metaText}>{lessonCount} lessons</Text>
          )}
          {questionCount != null && questionCount > 0 && (
            <Text style={styles.metaText}>{questionCount} questions</Text>
          )}
        </View>
        {readinessScore != null && (
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(readinessScore, 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{readinessScore}%</Text>
          </View>
        )}
        {priceCents != null && priceCents > 0 && (
          <Text style={styles.price}>${(priceCents / 100).toFixed(2)}</Text>
        )}
        {priceCents === 0 || priceCents == null ? (
          sessionsCompleted == null ? <Text style={styles.freeLabel}>Free</Text> : null
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    backgroundColor: colors.surfaceLight,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
  },
  placeholderThumb: {
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.primary,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  category: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
  progressText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  price: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  freeLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.accent,
  },
});

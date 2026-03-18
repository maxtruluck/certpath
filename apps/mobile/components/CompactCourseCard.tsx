import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radii, spacing, fontSize } from '@/lib/theme';

interface CompactCourseCardProps {
  title: string;
  progressPercent: number;
  onPress: () => void;
}

export default function CompactCourseCard({
  title,
  progressPercent,
  onPress,
}: CompactCourseCardProps) {
  const clamped = Math.min(Math.max(progressPercent, 0), 100);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <View style={styles.bottom}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${clamped}%` }]} />
        </View>
        <Text style={styles.percent}>{clamped}%</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-between',
    minHeight: 100,
  },
  pressed: {
    backgroundColor: colors.surfaceLight,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bottom: {
    gap: spacing.xs,
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
  percent: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
});

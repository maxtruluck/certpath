import { View, Text, Pressable, StyleSheet } from 'react-native';
import { radii, spacing, fontSize } from '@/lib/theme';

interface HeroCourseCardProps {
  title: string;
  subtitle: string;
  progressPercent?: number;
  buttonLabel: string;
  onPress: () => void;
}

export default function HeroCourseCard({
  title,
  subtitle,
  progressPercent,
  buttonLabel,
  onPress,
}: HeroCourseCardProps) {
  const clamped =
    progressPercent != null ? Math.min(Math.max(progressPercent, 0), 100) : null;

  return (
    <View style={styles.card}>
      {/* Gradient layers */}
      <View style={styles.gradLayer1} />
      <View style={styles.gradLayer2} />

      {/* Decorative circles */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>

        {clamped != null && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${clamped}%` }]} />
          </View>
        )}

        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 170,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  gradLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1e293b',
  },
  gradLayer2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  circleTopRight: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -15,
    left: -15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
  },
  content: {
    padding: 20,
    gap: spacing.sm,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#60a5fa',
    borderRadius: 2,
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  buttonPressed: {
    backgroundColor: '#e2e8f0',
  },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: '#1e293b',
  },
});

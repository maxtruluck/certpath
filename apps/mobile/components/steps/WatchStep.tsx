import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radii } from '@/lib/theme';

interface WatchStepProps {
  title: string;
  videoUrl: string;
}

export function WatchStep({ title, videoUrl }: WatchStepProps) {
  const handleOpen = () => {
    if (videoUrl) Linking.openURL(videoUrl);
  };

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Pressable style={styles.videoBox} onPress={handleOpen}>
        <Ionicons name="play-circle" size={48} color={colors.primary} />
        <Text style={styles.watchText}>Tap to watch video</Text>
        {videoUrl ? (
          <Text style={styles.urlText} numberOfLines={1}>{videoUrl}</Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  videoBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.md,
    paddingVertical: 40,
    alignItems: 'center',
    gap: spacing.sm,
  },
  watchText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  urlText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    paddingHorizontal: spacing.xl,
  },
});

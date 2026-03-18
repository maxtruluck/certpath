import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, radii } from '@/lib/theme';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export default function ProgressBar({
  progress,
  height = 4,
  color = colors.primary,
  backgroundColor = colors.surfaceLight,
}: ProgressBarProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${Math.min(Math.max(progress, 0), 1) * 100}%`, { duration: 300 }),
  }));

  return (
    <View style={[styles.track, { height, backgroundColor, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: color, borderRadius: height / 2 },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

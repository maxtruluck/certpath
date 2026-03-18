import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, radii, spacing, fontSize } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const variantStyles = variants[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variantStyles.container,
        pressed && variantStyles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#ffffff' : colors.primary}
          size="small"
        />
      ) : (
        <Text style={[styles.text, variantStyles.text]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

const variants: Record<Variant, { container: ViewStyle; pressed: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    pressed: { backgroundColor: colors.primaryDark },
    text: { color: '#ffffff' },
  },
  secondary: {
    container: { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
    pressed: { backgroundColor: colors.surfaceHover },
    text: { color: colors.text },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    pressed: { backgroundColor: colors.surfaceLight },
    text: { color: colors.primary },
  },
};

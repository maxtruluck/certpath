import { View, Text, StyleSheet } from 'react-native';
import MarkdownContent from '@/components/MarkdownContent';
import { colors, spacing, fontSize } from '@/lib/theme';

interface ReadStepProps {
  title: string;
  content: string;
}

export function ReadStep({ title, content }: ReadStepProps) {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <MarkdownContent content={content || '*No content*'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
  },
});

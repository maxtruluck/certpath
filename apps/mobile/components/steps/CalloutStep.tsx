import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MarkdownContent from '@/components/MarkdownContent';
import { colors, spacing, fontSize, radii } from '@/lib/theme';

type CalloutVariant = 'tip' | 'warning' | 'key_concept' | 'exam_note';

const CALLOUT_CONFIG: Record<string, { borderColor: string; bgColor: string; iconColor: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  tip:         { borderColor: '#2dd4bf', bgColor: '#f0fdfa', iconColor: '#0d9488', label: 'Tip',         icon: 'bulb-outline' },
  warning:     { borderColor: '#fbbf24', bgColor: '#fffbeb', iconColor: '#d97706', label: 'Warning',     icon: 'warning-outline' },
  key_concept: { borderColor: '#a78bfa', bgColor: '#f5f3ff', iconColor: '#7c3aed', label: 'Key Concept', icon: 'key-outline' },
  exam_note:   { borderColor: '#f87171', bgColor: '#fef2f2', iconColor: '#dc2626', label: 'Exam Note',   icon: 'document-text-outline' },
};

interface CalloutContent {
  callout_style: CalloutVariant;
  title: string;
  markdown: string;
}

interface CalloutStepProps {
  variant: CalloutVariant;
  title: string;
  content: string;
}

export function CalloutStep({ variant, title, content }: CalloutStepProps) {
  const config = CALLOUT_CONFIG[variant] || CALLOUT_CONFIG.tip;

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderLeftColor: config.borderColor, backgroundColor: config.bgColor }]}>
        <View style={styles.headerRow}>
          <Ionicons name={config.icon} size={18} color={config.iconColor} />
          <Text style={[styles.label, { color: config.iconColor }]}>{config.label}</Text>
        </View>
        {title && title.toLowerCase() !== config.label.toLowerCase() ? (
          <Text style={styles.title}>{title}</Text>
        ) : null}
        <MarkdownContent content={content || ''} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderLeftWidth: 4,
    borderRadius: radii.md,
    padding: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
});

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, radii, spacing, fontSize } from '@/lib/theme';
import MarkdownContent from './MarkdownContent';
import type { LessonSectionCard, ConceptCard } from '@/lib/store';

interface TeachingCardProps {
  card: LessonSectionCard | ConceptCard;
}

export default function TeachingCard({ card }: TeachingCardProps) {
  if (card.card_type === 'lesson_section') {
    const { section } = card;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.lessonLabel}>{section.lesson_title}</Text>
          {section.title ? (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          ) : null}
        </View>
        <View style={styles.body}>
          <MarkdownContent content={section.content} />
        </View>
      </ScrollView>
    );
  }

  // Concept card
  const { concept } = card;
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.conceptBadge}>
        <Text style={styles.conceptBadgeText}>Key Concept</Text>
      </View>
      <Text style={styles.conceptTitle}>{concept.title}</Text>
      <View style={styles.body}>
        <MarkdownContent content={concept.content} />
      </View>
      <Text style={styles.conceptMeta}>
        {concept.module_title} / {concept.lesson_title}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  header: {
    marginBottom: spacing.lg,
  },
  lessonLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    flex: 1,
  },
  conceptBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginBottom: spacing.md,
  },
  conceptBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  conceptTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  conceptMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
});

import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, radii } from '@/lib/theme';

interface EmbedContent {
  sub_type: string;
  url?: string;
  alt?: string;
  caption?: string;
  mermaid?: string;
  graph_data?: any;
}

interface EmbedStepProps {
  title: string;
  content: EmbedContent;
}

export function EmbedStep({ title, content }: EmbedStepProps) {
  const sub = content.sub_type;
  const label = sub === 'math_graph' ? 'Graph' : sub === 'image' ? 'Image' : 'Diagram';

  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
        {title && !['embed', 'diagram', 'graph', 'image'].includes(title.toLowerCase()) ? (
          <Text style={styles.titleText}>{title}</Text>
        ) : null}
      </View>

      {sub === 'image' && content.url ? (
        <View>
          <Image
            source={{ uri: content.url }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={content.alt || ''}
          />
          {content.caption ? (
            <Text style={styles.caption}>{content.caption}</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {sub === 'math_graph' ? 'Graph visualization' : sub === 'diagram' ? 'Diagram' : 'Embedded content'}
          </Text>
          <Text style={styles.placeholderSub}>
            Best viewed on web
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  badge: {
    backgroundColor: '#E6F1FB',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0C447C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: radii.md,
  },
  caption: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  placeholder: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.md,
    paddingVertical: 40,
    alignItems: 'center',
    gap: spacing.xs,
  },
  placeholderText: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  placeholderSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

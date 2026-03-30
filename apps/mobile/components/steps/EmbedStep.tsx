import { View, Text, Image, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, spacing, fontSize, radii } from '@/lib/theme';
import { CoordinateDiagram } from '../CoordinateDiagram';
import type { DiagramData } from '../CoordinateDiagram';

interface EmbedContent {
  sub_type: string;
  url?: string;
  alt?: string;
  caption?: string;
  mermaid?: string;
  graph_data?: DiagramData;
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
      ) : sub === 'math_graph' && content.graph_data ? (
        <CoordinateDiagram data={content.graph_data} />
      ) : sub === 'diagram' && content.mermaid ? (
        <View style={styles.diagramContainer}>
          <WebView
            originWhitelist={['*']}
            source={{ html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
                <style>
                  body { margin: 0; padding: 16px; display: flex; justify-content: center; background: transparent; }
                  .mermaid { font-size: 14px; }
                </style>
              </head>
              <body>
                <pre class="mermaid">${content.mermaid}</pre>
                <script>mermaid.initialize({ startOnLoad: true, theme: 'neutral' });</script>
              </body>
              </html>
            `}}
            style={{ height: 300, backgroundColor: 'transparent' }}
            scrollEnabled={false}
            javaScriptEnabled={true}
          />
          {content.caption ? <Text style={styles.caption}>{content.caption}</Text> : null}
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Embedded content</Text>
          <Text style={styles.placeholderSub}>Best viewed on web</Text>
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
  diagramContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E4DD',
    backgroundColor: '#ffffff',
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

import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { colors, fontSize } from '@/lib/theme';

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <Markdown style={markdownStyles}>
      {content}
    </Markdown>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    color: colors.text,
    fontSize: fontSize.base,
    lineHeight: 26,
  },
  heading1: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: {
    marginBottom: 12,
  },
  strong: {
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: colors.surfaceLight,
    color: colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: fontSize.sm,
  },
  fence: {
    backgroundColor: colors.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  code_block: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  list_item: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    marginVertical: 8,
    opacity: 0.8,
  },
});

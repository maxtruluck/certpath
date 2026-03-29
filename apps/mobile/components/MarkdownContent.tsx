import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { colors, fontSize } from '@/lib/theme';

interface MarkdownContentProps {
  content: string;
}

/**
 * Convert LaTeX expressions to readable plain text, then render
 * block math as fenced code blocks and inline math as inline code.
 */
function latexToPlainText(tex: string): string {
  let s = tex;
  // \text{...} -> content
  s = s.replace(/\\text\{([^}]*)\}/g, '$1');
  // \vec{x} -> x (vector arrow not available in plain text)
  s = s.replace(/\\vec\{([^}]*)\}/g, '$1');
  // \hat{x} -> x
  s = s.replace(/\\hat\{([^}]*)\}/g, '$1');
  // \bar{x} -> x
  s = s.replace(/\\bar\{([^}]*)\}/g, '$1');
  // \dot{x} -> x
  s = s.replace(/\\dot\{([^}]*)\}/g, '$1');
  // \frac{a}{b} -> a/b
  s = s.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2');
  // \sqrt{x} -> sqrt(x)
  s = s.replace(/\\sqrt\{([^}]*)\}/g, 'sqrt($1)');
  // subscript _{...} -> _content (remove braces)
  s = s.replace(/\_{([^}]*)}/g, '_$1');
  // superscript ^{...} -> ^content (remove braces)
  s = s.replace(/\^\{([^}]*)}/g, '^$1');
  // Named operators / symbols
  s = s.replace(/\\Longleftrightarrow/g, '<=>');
  s = s.replace(/\\Rightarrow/g, '=>');
  s = s.replace(/\\Leftarrow/g, '<=');
  s = s.replace(/\\rightarrow/g, '->');
  s = s.replace(/\\leftarrow/g, '<-');
  s = s.replace(/\\leftrightarrow/g, '<->');
  s = s.replace(/\\geq/g, '>=');
  s = s.replace(/\\leq/g, '<=');
  s = s.replace(/\\neq/g, '!=');
  s = s.replace(/\\approx/g, '~');
  s = s.replace(/\\times/g, '*');
  s = s.replace(/\\cdot/g, '*');
  s = s.replace(/\\pm/g, '+/-');
  s = s.replace(/\\infty/g, 'inf');
  s = s.replace(/\\pi/g, 'pi');
  s = s.replace(/\\theta/g, 'theta');
  s = s.replace(/\\alpha/g, 'alpha');
  s = s.replace(/\\beta/g, 'beta');
  s = s.replace(/\\gamma/g, 'gamma');
  s = s.replace(/\\delta/g, 'delta');
  s = s.replace(/\\Delta/g, 'Delta');
  s = s.replace(/\\omega/g, 'omega');
  s = s.replace(/\\mu/g, 'mu');
  s = s.replace(/\\sigma/g, 'sigma');
  s = s.replace(/\\sum/g, 'Sum');
  s = s.replace(/\\int/g, 'Integral');
  s = s.replace(/\\partial/g, 'd');
  // \quad -> space
  s = s.replace(/\\quad/g, '  ');
  s = s.replace(/\\qquad/g, '    ');
  // \, \; \! -> space or nothing
  s = s.replace(/\\[,;!]/g, ' ');
  // Remove remaining backslash commands we didn't handle
  s = s.replace(/\\[a-zA-Z]+/g, '');
  // Clean up extra braces
  s = s.replace(/[{}]/g, '');
  // Collapse multiple spaces
  s = s.replace(/  +/g, ' ');
  return s.trim();
}

function preprocessMath(md: string): string {
  // Block math: $$...$$ (may span multiple lines)
  let result = md.replace(/\$\$([\s\S]*?)\$\$/g, (_match, expr: string) => {
    const plain = latexToPlainText(expr);
    return '\n```\n' + plain + '\n```\n';
  });
  // Inline math: $...$ (single line, non-greedy)
  result = result.replace(/\$([^\n$]+?)\$/g, (_match, expr: string) => {
    const plain = latexToPlainText(expr);
    return '`' + plain + '`';
  });
  return result;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  const processed = useMemo(() => preprocessMath(content), [content]);

  return (
    <Markdown style={markdownStyles}>
      {processed}
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

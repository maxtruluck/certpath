import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { colors, fontSize } from '@/lib/theme';

interface MarkdownContentProps {
  content: string;
}

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '\u2070', '1': '\u00B9', '2': '\u00B2', '3': '\u00B3',
  '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077',
  '8': '\u2078', '9': '\u2079', '+': '\u207A', '-': '\u207B',
  '=': '\u207C', '(': '\u207D', ')': '\u207E', 'n': '\u207F',
  'i': '\u2071',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '\u2080', '1': '\u2081', '2': '\u2082', '3': '\u2083',
  '4': '\u2084', '5': '\u2085', '6': '\u2086', '7': '\u2087',
  '8': '\u2088', '9': '\u2089', '+': '\u208A', '-': '\u208B',
  '=': '\u208C', '(': '\u208D', ')': '\u208E',
  'a': '\u2090', 'e': '\u2091', 'o': '\u2092', 'x': '\u2093',
  'h': '\u2095', 'k': '\u2096', 'l': '\u2097', 'm': '\u2098',
  'n': '\u2099', 'p': '\u209A', 's': '\u209B', 't': '\u209C',
  'i': '\u1D62', 'r': '\u1D63', 'u': '\u1D64', 'v': '\u1D65',
  'f': '\u1DA0', // Use modifier letter small f as fallback
};

function toSuperscript(s: string): string {
  return s.split('').map(c => SUPERSCRIPT_MAP[c] ?? c).join('');
}

function toSubscript(s: string): string {
  return s.split('').map(c => SUBSCRIPT_MAP[c] ?? c).join('');
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
  // subscript _{...} -> Unicode subscript
  s = s.replace(/\_{([^}]*)}/g, (_m, g: string) => toSubscript(g));
  // superscript ^{...} -> Unicode superscript
  s = s.replace(/\^\{([^}]*)}/g, (_m, g: string) => toSuperscript(g));
  // Named operators / symbols
  s = s.replace(/\\Longleftrightarrow/g, '\u21D4');
  s = s.replace(/\\Rightarrow/g, '\u21D2');
  s = s.replace(/\\Leftarrow/g, '\u21D0');
  s = s.replace(/\\rightarrow/g, '\u2192');
  s = s.replace(/\\leftarrow/g, '\u2190');
  s = s.replace(/\\leftrightarrow/g, '\u2194');
  s = s.replace(/\\geq/g, '\u2265');
  s = s.replace(/\\leq/g, '\u2264');
  s = s.replace(/\\neq/g, '\u2260');
  s = s.replace(/\\approx/g, '\u2248');
  s = s.replace(/\\times/g, '\u00D7');
  s = s.replace(/\\cdot/g, '\u00B7');
  s = s.replace(/\\pm/g, '\u00B1');
  s = s.replace(/\\infty/g, '\u221E');
  s = s.replace(/\\pi/g, '\u03C0');
  s = s.replace(/\\theta/g, '\u03B8');
  s = s.replace(/\\alpha/g, '\u03B1');
  s = s.replace(/\\beta/g, '\u03B2');
  s = s.replace(/\\gamma/g, '\u03B3');
  s = s.replace(/\\delta/g, '\u03B4');
  s = s.replace(/\\Delta/g, '\u0394');
  s = s.replace(/\\omega/g, '\u03C9');
  s = s.replace(/\\Omega/g, '\u03A9');
  s = s.replace(/\\mu/g, '\u03BC');
  s = s.replace(/\\sigma/g, '\u03C3');
  s = s.replace(/\\Sigma/g, '\u03A3');
  s = s.replace(/\\lambda/g, '\u03BB');
  s = s.replace(/\\epsilon/g, '\u03B5');
  s = s.replace(/\\phi/g, '\u03C6');
  s = s.replace(/\\tau/g, '\u03C4');
  s = s.replace(/\\rho/g, '\u03C1');
  s = s.replace(/\\sum/g, '\u2211');
  s = s.replace(/\\int/g, '\u222B');
  s = s.replace(/\\partial/g, '\u2202');
  // \quad -> space
  s = s.replace(/\\quad/g, '  ');
  s = s.replace(/\\qquad/g, '    ');
  // \, \; \! -> space or nothing
  s = s.replace(/\\[,;!]/g, ' ');
  // Math functions - keep as readable text
  s = s.replace(/\\(sin|cos|tan|log|ln|exp|lim|max|min|sup|inf|det|deg|dim|gcd|ker|arg|sec|csc|cot|arcsin|arccos|arctan|sinh|cosh|tanh)/g, '$1');
  // Remove remaining backslash commands we didn't handle
  s = s.replace(/\\[a-zA-Z]+/g, '');
  // Clean up extra braces
  s = s.replace(/[{}]/g, '');
  // Bare superscript ^X (single char, no braces) -> Unicode
  s = s.replace(/\^([0-9a-zA-Z])/g, (_m, c: string) => toSuperscript(c));
  // Bare subscript _X (single char, no braces) -> Unicode
  s = s.replace(/_([0-9a-zA-Z])/g, (_m, c: string) => toSubscript(c));
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

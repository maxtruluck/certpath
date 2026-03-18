export const colors = {
  // Base
  bg: '#ffffff',
  bgSecondary: '#f8fafc',
  surface: '#ffffff',
  surfaceLight: '#f1f5f9',
  surfaceHover: '#e2e8f0',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  // Dark
  dark: '#0f172a',
  darker: '#020617',

  // Primary (Blue)
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  primaryGlow: 'rgba(59, 130, 246, 0.15)',

  // Accent (Green)
  accent: '#22C55E',
  accentLight: '#4ADE80',
  accentDark: '#16A34A',

  // Semantic
  success: '#22C55E',
  successLight: '#4ADE80',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  danger: '#EF4444',
  dangerLight: '#F87171',

  // Text
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',

  // Mastery
  masteryCompleted: '#1e40af',
  masteryInProgress: '#7c3aed',
  masteryAvailable: '#f59e0b',
  masteryLocked: '#d1d5db',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;

export const fonts = {
  sans: 'PlusJakartaSans',
  sansMedium: 'PlusJakartaSans-Medium',
  sansSemiBold: 'PlusJakartaSans-SemiBold',
  sansBold: 'PlusJakartaSans-Bold',
  mono: 'JetBrainsMono',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

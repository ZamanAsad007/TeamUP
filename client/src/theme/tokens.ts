export interface ColorScheme {
  // Brand & Theme v2 tokens (from TeamUp Design Doc)
  primary: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  accent: string;
  warning: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;

  // Compatibility tokens (M3 names mapped for backwards-compat)
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  onBackground: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

export const lightColorScheme: ColorScheme = {
  // Core palette from Design Doc
  primary: '#6366F1',
  primarySoft: '#EEF2FF',
  secondary: '#14B8A6',
  secondarySoft: '#CCFBF1',
  accent: '#F43F5E',
  warning: '#F59E0B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',

  // M3 Compatibility aliases
  onPrimary: '#FFFFFF',
  primaryContainer: '#EEF2FF',
  onPrimaryContainer: '#3730A3',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#CCFBF1',
  onSecondaryContainer: '#115E59',
  tertiary: '#F43F5E',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFE4E6',
  onTertiaryContainer: '#9F1239',
  onBackground: '#0F172A',
  onSurface: '#0F172A',
  surfaceVariant: '#F1F5F9',
  onSurfaceVariant: '#64748B',
  outline: '#94A3B8',
  outlineVariant: '#E2E8F0',
  error: '#EF4444',
  onError: '#FFFFFF',
  errorContainer: '#FEE2E2',
  onErrorContainer: '#991B1B',
  shadow: 'rgba(15, 23, 42, 0.06)',
  scrim: 'rgba(15, 23, 42, 0.4)',
  inverseSurface: '#0F172A',
  inverseOnSurface: '#F8FAFC',
  inversePrimary: '#818CF8',
};

export const darkColorScheme: ColorScheme = {
  // Core dark palette from Design Doc
  primary: '#6366F1',
  primarySoft: '#1E1B4B',
  secondary: '#14B8A6',
  secondarySoft: '#134E4A',
  accent: '#F43F5E',
  warning: '#F59E0B',
  background: '#0B1120',
  surface: '#111827',
  surfaceMuted: '#1E293B',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: '#334155',

  // M3 Compatibility aliases
  onPrimary: '#FFFFFF',
  primaryContainer: '#312E81',
  onPrimaryContainer: '#E0E7FF',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#042F2E',
  onSecondaryContainer: '#99F6E4',
  tertiary: '#F43F5E',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#881337',
  onTertiaryContainer: '#FECDD3',
  onBackground: '#F8FAFC',
  onSurface: '#F8FAFC',
  surfaceVariant: '#1E293B',
  onSurfaceVariant: '#94A3B8',
  outline: '#64748B',
  outlineVariant: '#334155',
  error: '#F87171',
  onError: '#450A0A',
  errorContainer: '#7F1D1D',
  onErrorContainer: '#FEE2E2',
  shadow: 'transparent',
  scrim: 'rgba(0, 0, 0, 0.6)',
  inverseSurface: '#F8FAFC',
  inverseOnSurface: '#0B1120',
  inversePrimary: '#4F46E5',
};

export const typography = {
  // TeamUp v2 typography specification
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  h3: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },

  // Compatibility aliases
  displayLarge: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  headlineMedium: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
  titleMedium: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  screenPadding: 16,
  minTouchTarget: 44,
};

export const borderRadius = {
  sm: 10,
  md: 14,
  lg: 18,
  bottomSheet: 24,
  pill: 9999,

  // Compatibility alias
  bento: 14,
};

export const elevation = {
  none: {},
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  sheet: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

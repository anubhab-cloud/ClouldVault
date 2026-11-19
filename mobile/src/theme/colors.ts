export const palette = {
  indigo50: '#EEF2FF',
  indigo100: '#E0E7FF',
  indigo500: '#6366F1',
  indigo600: '#4F46E5',
  indigo700: '#4338CA',

  charcoal950: '#0B0B0D',
  charcoal900: '#121214',
  charcoal800: '#1A1A1E',
  charcoal700: '#26262B',
  charcoal600: '#3A3A40',
  charcoal400: '#71717A',
  charcoal200: '#A1A1AA',
  charcoal100: '#E4E4E7',
  charcoal50: '#F4F4F5',

  white: '#FFFFFF',
  black: '#000000',

  emerald500: '#10B981',
  emerald600: '#059669',
  amber500: '#F59E0B',
  red500: '#EF4444',
  red600: '#DC2626',
  sky500: '#0EA5E9',
};

export const darkTheme = {
  isDark: true,
  colors: {
    background: palette.charcoal900,
    surface: palette.charcoal800,
    surfaceElevated: palette.charcoal700,
    surfaceSubtle: palette.charcoal950,
    border: palette.charcoal700,
    borderSubtle: palette.charcoal800,

    text: palette.charcoal50,
    textMuted: palette.charcoal200,
    textSubtle: palette.charcoal400,

    primary: palette.indigo500,
    primaryHover: palette.indigo600,
    primaryContent: palette.white,

    success: palette.emerald500,
    warning: palette.amber500,
    error: palette.red500,
    info: palette.sky500,

    overlay: 'rgba(0, 0, 0, 0.75)',
    cardOverlay: 'rgba(0, 0, 0, 0.45)',
  },
};

export const lightTheme = {
  isDark: false,
  colors: {
    background: '#F8F9FA',
    surface: palette.white,
    surfaceElevated: '#FFFFFF',
    surfaceSubtle: '#F1F3F5',
    border: '#E2E8F0',
    borderSubtle: '#EDF2F7',

    text: '#0F172A',
    textMuted: '#475569',
    textSubtle: '#94A3B8',

    primary: palette.indigo600,
    primaryHover: palette.indigo700,
    primaryContent: palette.white,

    success: palette.emerald600,
    warning: palette.amber500,
    error: palette.red600,
    info: palette.sky500,

    overlay: 'rgba(0, 0, 0, 0.5)',
    cardOverlay: 'rgba(0, 0, 0, 0.3)',
  },
};

export type Theme = typeof darkTheme;

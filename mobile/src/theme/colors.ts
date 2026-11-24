export const palette = {
  // Design system primary — indigo-blue
  indigo50: '#EEEFFE',
  indigo100: '#E0E1FF',
  indigo400: '#7B80F0',
  indigo500: '#5A5FE0',
  indigo600: '#4348CC',
  indigo700: '#3237B8',

  // Design system surface — lavender-grey (from the 3D redesign screenshots)
  pageBackground: '#ECEEF8', // the light blue-grey page background in all screens
  surfaceWhite: '#FFFFFF',
  surfaceGrey: '#F4F5FB',

  // Dark theme surfaces
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

  // Semantic
  emerald500: '#10B981',
  emerald600: '#059669',
  amber500: '#F59E0B',
  red400: '#F87171',
  red500: '#EF4444',
  red600: '#DC2626',
  sky500: '#0EA5E9',

  // For gradient "hero stacked card" thumbnails
  gradOrange: ['#E8855A', '#8B4FA0'] as const,
  gradBlue: ['#5BAEDB', '#3B6DC8'] as const,
  gradGold: ['#D4A45A', '#7A5B2E'] as const,
  gradLavender: ['#C77FDE', '#6B42C8'] as const,
  gradSlate: ['#C4C9DC', '#8A90B0'] as const,
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
    // Page and card backgrounds from the 3D redesign
    background: palette.pageBackground,
    surface: palette.surfaceWhite,
    surfaceElevated: palette.surfaceWhite,
    surfaceSubtle: palette.surfaceGrey,
    border: '#E0E2EF',
    borderSubtle: '#EAEDF8',

    text: '#0E0F1A',
    textMuted: '#4A4E6A',
    textSubtle: '#8A8FA8',

    primary: palette.indigo500,
    primaryHover: palette.indigo600,
    primaryContent: palette.white,

    success: palette.emerald600,
    successBg: '#D1FAE5',
    warning: palette.amber500,
    error: palette.red500,
    errorBg: '#FEE2E2',
    info: palette.sky500,

    overlay: 'rgba(14, 15, 26, 0.5)',
    cardOverlay: 'rgba(14, 15, 26, 0.3)',
  },
};

export type Theme = typeof darkTheme;

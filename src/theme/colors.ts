// Design tokens — mirrors the CSS variables from the web admin panel
// so both clients feel like the same product.

export const colors = {
  // Backgrounds
  bg: '#F4F6FB',
  bgDeep: '#ECEEF5',
  card: '#FFFFFF',
  cardHover: '#F8F9FC',

  // Sidebar / dark surfaces (matches web sidebar #11132A)
  sidebar: '#11132A',
  sidebarBorder: '#1E2140',
  sidebarActive: '#1B1E3D',

  // Typography
  ink: '#11132A',
  ink2: '#1B1E3D',
  muted: '#6B7093',
  mutedLight: '#9EA3BE',

  // Brand (teal — #0E7C86 matches web)
  brand: '#0E7C86',
  brandDark: '#0A5C63',
  brandLight: '#13929E',
  brandSoft: '#E4F3F4',
  brandSofter: '#F0F9FA',

  // Semantic
  danger: '#E5484D',
  dangerDark: '#C73237',
  dangerSoft: '#FEF0F0',

  success: '#16A34A',
  successDark: '#15803D',
  successSoft: '#F0FDF4',

  warn: '#D97706',
  warnDark: '#B45309',
  warnSoft: '#FFFBEB',

  info: '#2563EB',
  infoSoft: '#EFF6FF',

  // Borders & dividers
  border: '#E5E8F0',
  borderStrong: '#CDD0DF',
  divider: '#F1F3F9',

  // Tab bar
  tabBarBg: '#11132A',
  tabBarBorder: '#1E2140',
  tabBarActive: '#0E7C86',
  tabBarInactive: '#6B7093',

  // Status chips (used in attendance)
  presentBg: '#F0FDF4',
  presentFg: '#16A34A',
  absentBg: '#FEF0F0',
  absentFg: '#E5484D',
  lateBg: '#FFFBEB',
  lateFg: '#D97706',
  holidayBg: '#EFF6FF',
  holidayFg: '#2563EB',

  // Overlays
  overlay: 'rgba(17, 19, 42, 0.5)',
  overlayLight: 'rgba(17, 19, 42, 0.15)',

  // Shadows (use with elevation/shadow props)
  shadowColor: '#11132A',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

export const typography = {
  // Font sizes
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 15,
  xl: 17,
  xxl: 20,
  xxxl: 24,
  display: 28,
  hero: 34,
};

// Inter font family tokens — use these alongside fontSize in StyleSheet.
// The string values match the font names loaded by useFonts in App.tsx.
// Usage:  fontFamily: fonts.regular   (replaces fontWeight: '400')
//         fontFamily: fonts.medium    (replaces fontWeight: '500')
//         fontFamily: fonts.semibold  (replaces fontWeight: '600')
//         fontFamily: fonts.bold      (replaces fontWeight: '700')
//         fontFamily: fonts.extrabold (replaces fontWeight: '800')
export const fonts = {
  regular:   'Inter_400Regular',
  medium:    'Inter_500Medium',
  semibold:  'Inter_600SemiBold',
  bold:      'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

// Reusable shadow presets (apply as style spread)
export const shadows = {
  sm: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

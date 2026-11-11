/** Home dashboard palette. Do not replace the global app colors. */
export const homeTheme = {
  background: '#F8F5F0',
  surface: '#FFFCF8',
  text: '#321C16',
  textSecondary: '#8A7B70',
  date: '#967765',
  primary: '#875B45',
  primarySoft: '#95674F',
  accentLine: '#8A5A43',
  progress: '#A87659',
  progressTrack: '#EFE5DC',
  border: '#EEE5DC',
  softFill: '#F3EBE3',
  flame: '#C27A55',
  onPrimary: '#FFF9F3',
  shadow: 'rgba(50, 28, 22, 0.08)',
} as const;

export const homeSpace = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const homeRadius = {
  card: 22,
  button: 999,
  cover: 10,
  pill: 999,
} as const;

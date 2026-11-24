/** Shared Warm Ivory & Espresso tokens for settings and insights. */
export const readerTheme = {
  background: '#F5F1E9',
  surface: '#FFFCF7',
  soft: '#F3EDE5',
  primary: '#79513C',
  primaryDeep: '#583B2C',
  primarySoft: '#A77C60',
  text: '#35251D',
  textSecondary: '#796A60',
  textMuted: '#A3978C',
  border: '#E7DED2',
  progressTrack: '#E8DFD5',
  success: '#628C55',
  warning: '#B68A48',
  error: '#B65348',
  onPrimary: '#FFFCF7',
  shadow: 'rgba(53, 37, 29, 0.08)',
  trendUpBg: '#F3E6D8',
} as const;

export const readerSpace = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const readerRadius = {
  card: 20,
  control: 14,
  pill: 999,
  input: 14,
} as const;

export function readerLayout(width: number) {
  const compact = width < 360;
  const roomy = width >= 390;
  const pad = compact ? 12 : roomy ? 20 : 16;
  const cardPad = compact ? 14 : roomy ? 18 : 16;
  const gap = compact ? 10 : roomy ? 14 : 12;
  const goalRing = compact ? 96 : roomy ? 124 : 112;
  const insightRing = compact ? 118 : roomy ? 150 : 136;
  const dayMax = compact ? 34 : roomy ? 44 : 40;
  const buttonHeight = compact ? 50 : roomy ? 56 : 54;
  return { compact, roomy, pad, cardPad, gap, goalRing, insightRing, dayMax, buttonHeight, maxContent: 560 };
}

export const colors = {
  background: '#F4EFE6',
  surface: '#FBF7F1',
  surfaceMuted: '#EFE6D8',
  border: '#E4D7C6',
  text: '#3C2A1E',
  textSecondary: '#7A6452',
  textMuted: '#A3907D',
  accent: '#7C5340',
  accentPressed: '#684433',
  onAccent: '#FBF7F1',
  progressTrack: '#E6D9C8',
  progressFill: '#7C5340',
  positive: '#6D7B58',
  warning: '#8C5346',
  error: '#8C3A32',
  darkBrown: '#4A3025',
  wood: '#946B4F',
  woodLight: '#C69B74',
  shelf: '#946B4F',
  shelfEdge: '#4A3025',
  shelfHighlight: '#C69B74',
  overlay: 'rgba(60, 42, 30, 0.4)',
  coverText: '#FBF7F1',
} as const;

/** Quiet spine colors for the cozy shelf. Keep saturation low. */
export const spinePalette = [
  '#6D7B58',
  '#6E7F8A',
  '#C4785A',
  '#C4A06A',
  '#7A5C6B',
  '#6B4F3F',
] as const;

export type AppColor = (typeof colors)[keyof typeof colors];
export type SpinePaletteColor = (typeof spinePalette)[number];

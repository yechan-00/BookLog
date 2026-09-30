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
  shelf: '#C6A57A',
  shelfEdge: '#A8875C',
  overlay: 'rgba(60, 42, 30, 0.4)',
  coverText: '#FBF7F1',
} as const;

export type AppColor = (typeof colors)[keyof typeof colors];

import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/colors';
import { clampPercent } from '@/utils/format';

type ProgressBarProps = {
  current: number;
  total: number;
  trackColor?: string;
  fillColor?: string;
  height?: number;
};

export function ProgressBar({
  current,
  total,
  trackColor = colors.progressTrack,
  fillColor = colors.progressFill,
  height = 8,
}: ProgressBarProps) {
  const percent = clampPercent(current, total);

  return (
    <View
      style={[styles.track, { backgroundColor: trackColor, height }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});


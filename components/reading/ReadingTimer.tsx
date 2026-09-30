import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { formatClock } from '@/utils/format';

type ReadingTimerProps = {
  elapsedSeconds: number;
  caption?: string;
};

export function ReadingTimer({ elapsedSeconds, caption = '독서 시간' }: ReadingTimerProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.caption}>{caption}</Text>
      <Text style={styles.time} adjustsFontSizeToFit numberOfLines={1}>
        {formatClock(elapsedSeconds)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  time: {
    ...typography.timer,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});

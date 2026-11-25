import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/common/AppIcon';
import { colors } from '@/constants/colors';
import type { DayAchievement } from '@/utils/readingPeriod';

/** Calendar-only status colors (shape + hue; not used for insight rates). */
export const calendarGoalColors = {
  missed: '#B68B80',
  achieved: colors.accent,
  exceeded: '#C29A48',
  pending: '#A89B8E',
  unknown: colors.textMuted,
} as const;

type CalendarGoalStatusIconProps = {
  achievement: DayAchievement;
  size?: number;
};

/**
 * Book-shaped status for the calendar cell.
 * Shows nothing for rest / no-goal / future (caller still reserves layout height).
 */
export function CalendarGoalStatusIcon({ achievement, size = 16 }: CalendarGoalStatusIconProps) {
  if (
    achievement === 'none' ||
    achievement === 'off' ||
    achievement === 'upcoming'
  ) {
    return <View style={{ width: size, height: size }} />;
  }

  if (achievement === 'missed') {
    return (
      <AppIcon name="bookClosed" color={calendarGoalColors.missed} size={size} />
    );
  }

  if (achievement === 'pending') {
    return (
      <AppIcon name="bookClosed" color={calendarGoalColors.pending} size={size} />
    );
  }

  if (achievement === 'unknown') {
    return <AppIcon name="help" color={calendarGoalColors.unknown} size={size} />;
  }

  if (achievement === 'achieved') {
    return (
      <AppIcon name="bookOpen" color={calendarGoalColors.achieved} size={size} />
    );
  }

  if (achievement === 'exceeded') {
    return (
      <View style={[styles.exceededWrap, { width: size + 4, height: size + 2 }]}>
        <AppIcon name="bookOpen" color={calendarGoalColors.exceeded} size={size} />
        <View style={styles.sparkle}>
          <AppIcon name="sparkles" color={calendarGoalColors.exceeded} size={Math.round(size * 0.55)} />
        </View>
      </View>
    );
  }

  return <View style={{ width: size, height: size }} />;
}

const styles = StyleSheet.create({
  exceededWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
});

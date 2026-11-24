import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors } from '@/constants/colors';
import { typography } from '@/constants/theme';
import { getMonthGrid, shiftMonth } from '@/utils/calendar';
import { formatMonthTitle } from '@/utils/format';
import type { CalendarDayMark } from '@/utils/readingCalendar';
import { achievementLabel, type DayAchievement } from '@/utils/readingPeriod';

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

type MonthCalendarProps = {
  visibleMonth: Date;
  selectedDate: string;
  todayKey: string;
  marks: Readonly<Record<string, CalendarDayMark>>;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (nextMonth: Date) => void;
  onPressToday?: () => void;
};

export function MonthCalendar({
  visibleMonth,
  selectedDate,
  todayKey,
  marks,
  onSelectDate,
  onChangeMonth,
  onPressToday,
}: MonthCalendarProps) {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const cells = getMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth());
  const daySize = compact ? 30 : 32;

  return (
    <View style={styles.wrap}>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 달"
          onPress={() => onChangeMonth(shiftMonth(visibleMonth, -1))}
          hitSlop={8}
          style={styles.navHit}
        >
          <Text style={styles.nav}>이전</Text>
        </Pressable>
        <View style={styles.monthCenter}>
          <Text style={styles.month}>{formatMonthTitle(visibleMonth)}</Text>
          {onPressToday ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="오늘로 이동"
              onPress={onPressToday}
              hitSlop={8}
            >
              <Text style={styles.todayLink}>오늘</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 달"
          onPress={() => onChangeMonth(shiftMonth(visibleMonth, 1))}
          hitSlop={8}
          style={styles.navHit}
        >
          <Text style={styles.nav}>다음</Text>
        </Pressable>
      </View>
      <View style={styles.weekdays}>
        {weekdayLabels.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, index) => {
          if (!cell.dateKey) {
            return <View key={`empty-${index}`} style={styles.cell} />;
          }

          const mark = marks[cell.dateKey];
          const isSelected = cell.dateKey === selectedDate;
          const isToday = cell.dateKey === todayKey;
          const achievement = mark?.achievement ?? 'none';
          const hasReading = mark?.hasReading === true;
          const isFuture = cell.dateKey > todayKey;

          return (
            <Pressable
              key={cell.dateKey}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${cell.dateKey}, ${hasReading ? '독서 기록 있음' : '독서 기록 없음'}, ${achievementLabel(achievement)}`}
              onPress={() => onSelectDate(cell.dateKey as string)}
              style={styles.cell}
            >
              <View
                style={[
                  styles.day,
                  { width: daySize, height: daySize, borderRadius: daySize / 2 },
                  isSelected && styles.selectedDay,
                  !isSelected && isToday && styles.todayDay,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.selectedDayText,
                    isFuture && !isSelected && styles.futureDayText,
                  ]}
                >
                  {cell.date?.getDate()}
                </Text>
              </View>
              <View style={[styles.dot, markDotStyle(achievement, hasReading, isFuture)]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function markDotStyle(achievement: DayAchievement, hasReading: boolean, isFuture: boolean) {
  if (isFuture) {
    return null;
  }
  if (achievement === 'achieved') {
    return styles.dotAchieved;
  }
  if (achievement === 'missed') {
    return styles.dotMissed;
  }
  if (achievement === 'unknown') {
    return styles.dotUnknown;
  }
  if (hasReading) {
    return styles.dotVisible;
  }
  return null;
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthCenter: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  month: {
    ...typography.section,
    color: colors.text,
  },
  todayLink: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  navHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    ...typography.body,
    color: colors.accent,
  },
  weekdays: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.2857%',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
    minHeight: 44,
  },
  day: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDay: {
    backgroundColor: colors.accent,
  },
  todayDay: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
  dayText: {
    ...typography.body,
    color: colors.text,
  },
  selectedDayText: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  futureDayText: {
    color: colors.textMuted,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  dotVisible: {
    backgroundColor: colors.accent,
  },
  dotAchieved: {
    backgroundColor: colors.positive,
  },
  dotMissed: {
    backgroundColor: colors.error,
  },
  dotUnknown: {
    backgroundColor: colors.warning,
  },
});

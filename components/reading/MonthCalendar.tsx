import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { radius, typography } from '@/constants/theme';
import { getMonthGrid, shiftMonth } from '@/utils/calendar';
import { formatMonthTitle } from '@/utils/format';
import type { CalendarDayMark } from '@/utils/readingCalendar';
import { achievementLabel } from '@/utils/readingPeriod';

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

type MonthCalendarProps = {
  visibleMonth: Date;
  selectedDate: string;
  todayKey: string;
  marks: Readonly<Record<string, CalendarDayMark>>;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (nextMonth: Date) => void;
};

export function MonthCalendar({
  visibleMonth,
  selectedDate,
  todayKey,
  marks,
  onSelectDate,
  onChangeMonth,
}: MonthCalendarProps) {
  const cells = getMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth());

  return (
    <View style={styles.wrap}>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 달"
          onPress={() => onChangeMonth(shiftMonth(visibleMonth, -1))}
          hitSlop={8}
        >
          <Text style={styles.nav}>이전</Text>
        </Pressable>
        <Text style={styles.month}>{formatMonthTitle(visibleMonth)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 달"
          onPress={() => onChangeMonth(shiftMonth(visibleMonth, 1))}
          hitSlop={8}
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
          const achieved = mark?.achievement === 'achieved';
          const hasReading = mark?.hasReading === true;

          return (
            <Pressable
              key={cell.dateKey}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${cell.dateKey}, ${hasReading ? '독서 기록 있음' : '독서 기록 없음'}, ${achievementLabel(mark?.achievement ?? 'none')}`}
              onPress={() => onSelectDate(cell.dateKey as string)}
              style={styles.cell}
            >
              <View
                style={[
                  styles.day,
                  isSelected && styles.selectedDay,
                  !isSelected && isToday && styles.todayDay,
                ]}
              >
                <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                  {cell.date?.getDate()}
                </Text>
              </View>
              <View
                style={[
                  styles.dot,
                  !isSelected && achieved && styles.dotAchieved,
                  !isSelected && !achieved && hasReading && styles.dotVisible,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
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
  month: {
    ...typography.section,
    color: colors.text,
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
    width: '14.285%',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  day: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
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
});

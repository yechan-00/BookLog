import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { radius, typography } from '@/constants/theme';
import { getMonthGrid, shiftMonth } from '@/utils/calendar';
import { formatMonthTitle } from '@/utils/format';

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

type MonthCalendarProps = {
  visibleMonth: Date;
  selectedDate: string;
  todayKey: string;
  readingDates: ReadonlySet<string>;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (nextMonth: Date) => void;
};

export function MonthCalendar({
  visibleMonth,
  selectedDate,
  todayKey,
  readingDates,
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

          const isSelected = cell.dateKey === selectedDate;
          const isToday = cell.dateKey === todayKey;
          const hasReading = readingDates.has(cell.dateKey);

          return (
            <Pressable
              key={cell.dateKey}
              accessibilityRole="button"
              accessibilityLabel={cell.dateKey}
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
              <View style={[styles.dot, hasReading && !isSelected && styles.dotVisible]} />
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
});

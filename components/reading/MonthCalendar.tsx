import { useMemo, useState, type ReactNode } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CalendarCompletedBookCover } from '@/components/reading/CalendarCompletedBookCover';
import {
  CalendarGoalStatusIcon,
  calendarGoalColors,
} from '@/components/reading/CalendarGoalStatusIcon';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/theme';
import { getMonthGrid, shiftMonth } from '@/utils/calendar';
import type { CalendarCompletedBook } from '@/utils/calendarCompletions';
import { formatMonthTitle } from '@/utils/format';
import type { CalendarDayMark } from '@/utils/readingCalendar';
import { achievementLabel, type DayAchievement } from '@/utils/readingPeriod';

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

type MonthCalendarProps = {
  visibleMonth: Date;
  selectedDate: string;
  todayKey: string;
  marks: Readonly<Record<string, CalendarDayMark>>;
  completionsByDate: Readonly<Record<string, CalendarCompletedBook[]>>;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (nextMonth: Date) => void;
  onPressToday?: () => void;
};

function calendarMetrics(gridWidth: number, screenWidth: number) {
  const compact = screenWidth < 360;
  const wide = screenWidth >= 430;
  const cellWidth = gridWidth / 7;
  const dayNumberSize = compact ? 24 : wide ? 30 : 28;
  const coverWidth = Math.min(
    Math.round(cellWidth * 0.72),
    compact ? 28 : wide ? 40 : 34,
  );
  const coverHeight = Math.round(coverWidth * 1.42);
  const iconSize = compact ? 14 : wide ? 18 : 16;
  const iconSlot = iconSize + 4;
  const gap = compact ? 3 : wide ? 5 : 4;
  const cellHeight = dayNumberSize + coverHeight + iconSlot + gap * 3 + 4;

  return { dayNumberSize, coverWidth, coverHeight, iconSize, iconSlot, gap, cellHeight };
}

function accessibilityGoalPhrase(achievement: DayAchievement, isToday: boolean): string {
  switch (achievement) {
    case 'missed':
      return '목표 미달성';
    case 'achieved':
      return '목표 달성';
    case 'exceeded':
      return '목표 초과 달성';
    case 'pending':
      return isToday ? '오늘 목표 진행 중' : '목표 진행';
    case 'off':
      return '독서 휴식일';
    case 'none':
      return '설정된 목표 없음';
    case 'unknown':
      return '목표 달성 여부 집계 불가';
    case 'upcoming':
      return '미래 날짜';
    default:
      return achievementLabel(achievement);
  }
}

export function MonthCalendar({
  visibleMonth,
  selectedDate,
  todayKey,
  marks,
  completionsByDate,
  onSelectDate,
  onChangeMonth,
  onPressToday,
}: MonthCalendarProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(screenWidth - 64);
  const cells = getMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth());
  const metrics = useMemo(
    () => calendarMetrics(Math.max(gridWidth, 1), screenWidth),
    [gridWidth, screenWidth],
  );

  const onGridLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    if (next > 0 && Math.abs(next - gridWidth) > 0.5) {
      setGridWidth(next);
    }
  };

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

      <View style={styles.grid} onLayout={onGridLayout}>
        {cells.map((cell, index) => {
          if (!cell.dateKey) {
            return (
              <View
                key={`empty-${index}`}
                style={[styles.cell, { height: metrics.cellHeight }]}
              />
            );
          }

          const mark = marks[cell.dateKey];
          const isSelected = cell.dateKey === selectedDate;
          const isToday = cell.dateKey === todayKey;
          const achievement = mark?.achievement ?? 'none';
          const isFuture = cell.dateKey > todayKey;
          const completed = isFuture ? [] : (completionsByDate[cell.dateKey] ?? []);
          const primary = completed[0];
          const extraCount = Math.max(0, completed.length - 1);
          const goalPhrase = accessibilityGoalPhrase(achievement, isToday);
          const completedPhrase =
            completed.length > 0 ? `, 완독한 책 ${completed.length}권` : '';

          return (
            <Pressable
              key={cell.dateKey}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${cell.dateKey}, ${goalPhrase}${completedPhrase}`}
              onPress={() => onSelectDate(cell.dateKey as string)}
              style={[styles.cell, { height: metrics.cellHeight, gap: metrics.gap }]}
            >
              <View
                style={[
                  styles.day,
                  {
                    width: metrics.dayNumberSize,
                    height: metrics.dayNumberSize,
                    borderRadius: metrics.dayNumberSize / 2,
                  },
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

              <View
                style={{
                  width: metrics.coverWidth,
                  height: metrics.coverHeight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {primary ? (
                  <CalendarCompletedBookCover
                    book={primary}
                    width={metrics.coverWidth}
                    height={metrics.coverHeight}
                    extraCount={extraCount}
                  />
                ) : null}
              </View>

              <View style={{ height: metrics.iconSlot, alignItems: 'center', justifyContent: 'center' }}>
                {!isFuture ? (
                  <CalendarGoalStatusIcon achievement={achievement} size={metrics.iconSize} />
                ) : (
                  <View style={{ width: metrics.iconSize, height: metrics.iconSize }} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <CalendarLegend compact={screenWidth < 360} />
    </View>
  );
}

function CalendarLegend({ compact }: { compact: boolean }) {
  return (
    <View style={styles.legendBlock}>
      <View style={[styles.legendRow, compact && styles.legendRowWrap]}>
        <LegendItem
          icon={<CalendarGoalStatusIcon achievement="missed" size={14} />}
          label="미달성"
        />
        <LegendItem
          icon={<CalendarGoalStatusIcon achievement="achieved" size={14} />}
          label="달성"
        />
        <LegendItem
          icon={<CalendarGoalStatusIcon achievement="exceeded" size={14} />}
          label="과달성"
        />
      </View>
      <Text style={styles.legendHint}>책 표지는 완독한 날에 표시돼요.</Text>
    </View>
  );
}

function LegendItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View style={styles.legendItem}>
      {icon}
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
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
    paddingVertical: 2,
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
    fontSize: 14,
  },
  selectedDayText: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  futureDayText: {
    color: colors.textMuted,
  },
  legendBlock: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  legendRowWrap: {
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  legendHint: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export { calendarGoalColors };

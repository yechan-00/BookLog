import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/common/AppIcon';
import { HomeCard, HomeCardTitle } from '@/components/home/HomeCard';
import { homeTheme } from '@/constants/homeTheme';
import { formatDuration } from '@/utils/format';
import type { HomeWeekStats } from '@/utils/homeWeekStats';

type WeekStatusCardProps = {
  weekStats: HomeWeekStats;
};

const BAR_MAX = 64;

export function WeekStatusCard({ weekStats }: WeekStatusCardProps) {
  const { width } = useWindowDimensions();
  const stacked = width < 360;
  const hasReading = weekStats.totalSeconds > 0;
  const maxSeconds = Math.max(...weekStats.days.map((day) => day.durationSeconds), 0);
  const delta = weekStats.deltaSeconds;
  const deltaLabel =
    delta === null || weekStats.previousWeekSeconds === 0
      ? null
      : delta > 0
        ? `지난주보다 ${formatDuration(delta)} 더`
        : delta < 0
          ? `지난주보다 ${formatDuration(Math.abs(delta))} 덜`
          : '지난주와 같아요';

  return (
    <HomeCard>
      <HomeCardTitle title="이번 주 독서" />
      {!hasReading ? (
        <Text style={styles.empty} numberOfLines={1}>
          이번 주 기록이 없어요.
        </Text>
      ) : (
        <View style={[styles.body, stacked && styles.bodyStacked]}>
          <View style={[styles.summary, stacked && styles.summaryStacked]}>
            <View style={styles.iconWrap}>
              <AppIcon name="bookOpen" size={18} color={homeTheme.primary} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryLabel}>총 독서 시간</Text>
              <Text style={styles.summaryValue}>{formatDuration(weekStats.totalSeconds)}</Text>
              {deltaLabel ? (
                <Text style={styles.delta} numberOfLines={1}>
                  {deltaLabel}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={[styles.chart, stacked && styles.chartStacked]} accessibilityLabel="요일별 독서 시간">
            {weekStats.days.map((day) => {
              const height =
                maxSeconds <= 0 || day.isFuture || day.durationSeconds <= 0
                  ? 3
                  : Math.max(6, Math.round((day.durationSeconds / maxSeconds) * BAR_MAX));
              const isPeak = !day.isFuture && day.durationSeconds > 0 && day.durationSeconds === maxSeconds;
              return (
                <View key={day.dateKey} style={styles.barCol}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor: day.isFuture
                          ? 'transparent'
                          : isPeak
                            ? homeTheme.primary
                            : day.isToday
                              ? homeTheme.progress
                              : homeTheme.softFill,
                      },
                    ]}
                  />
                  <Text style={[styles.weekday, day.isToday && styles.weekdayToday]}>{day.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </HomeCard>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  bodyStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  summary: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  summaryStacked: {
    flex: undefined,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: homeTheme.softFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  summaryLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: homeTheme.textSecondary,
  },
  summaryValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: homeTheme.text,
    fontVariant: ['tabular-nums'],
  },
  delta: {
    fontSize: 11,
    lineHeight: 15,
    color: homeTheme.textSecondary,
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_MAX + 18,
    minWidth: 0,
    gap: 3,
  },
  chartStacked: {
    width: '100%',
    marginTop: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  bar: {
    width: '65%',
    maxWidth: 12,
    borderRadius: 999,
  },
  weekday: {
    fontSize: 10,
    lineHeight: 13,
    color: homeTheme.textSecondary,
    fontWeight: '600',
  },
  weekdayToday: {
    color: homeTheme.primary,
  },
  empty: {
    fontSize: 13,
    lineHeight: 18,
    color: homeTheme.textSecondary,
  },
});

import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { readerTheme } from '@/constants/readerTheme';
import type { DailyTrendPoint } from '@/utils/readingSummary';

type Metric = 'time' | 'pages';

type ReadingTrendChartProps = {
  days: readonly DailyTrendPoint[];
  metric: Metric;
  height?: number;
};

export function ReadingTrendChart({ days, metric, height = 170 }: ReadingTrendChartProps) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const values = useMemo(
    () =>
      days.map((day) => {
        if (metric === 'time') {
          return Math.round(day.durationSeconds / 60);
        }
        return day.pagesRead;
      }),
    [days, metric],
  );

  const numericValues = values.map((value) => value ?? 0);
  const maxValue = Math.max(1, ...numericValues);
  const chartHeight = height - 28;
  const selectedDay = days.find((day) => day.dateKey === selected) ?? null;
  const selectedValue = selectedDay
    ? metric === 'time'
      ? Math.round(selectedDay.durationSeconds / 60)
      : selectedDay.pagesRead
    : null;

  const labelIndexes = useMemo(() => pickLabelIndexes(days.length), [days.length]);

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={{ minHeight: height }}
    >
      {selectedDay ? (
        <Text style={styles.tooltip}>
          {selectedDay.dateKey.slice(5).replace('-', '/')} ·{' '}
          {metric === 'time'
            ? `${selectedValue ?? 0}분`
            : selectedValue === null
              ? '페이지 집계 불가'
              : `${selectedValue}p`}
        </Text>
      ) : (
        <Text style={styles.tooltip}>{metric === 'time' ? '단위: 분' : '단위: 페이지'}</Text>
      )}

      {width > 0 ? (
        <View style={[styles.plot, { height: chartHeight }]}>
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <View key={ratio} style={[styles.grid, { bottom: chartHeight * ratio - 1 }]} />
          ))}
          <View style={styles.bars}>
            {days.map((day, index) => {
              const raw = values[index];
              const value = raw ?? 0;
              const unknownPages = metric === 'pages' && raw === null && day.hasReading;
              const barHeight = unknownPages
                ? Math.max(2, chartHeight * 0.08)
                : Math.max(2, (value / maxValue) * (chartHeight - 8));
              const active = selected === day.dateKey;
              return (
                <Pressable
                  key={day.dateKey}
                  accessibilityRole="button"
                  accessibilityLabel={
                    unknownPages ? `${day.dateKey} 페이지 미상` : `${day.dateKey} ${value}`
                  }
                  onPress={() => setSelected(day.dateKey)}
                  style={styles.barHit}
                >
                  <View
                    style={[
                      styles.bar,
                      unknownPages && styles.barUnknown,
                      {
                        height: barHeight,
                        backgroundColor: active ? readerTheme.primaryDeep : readerTheme.primary,
                      },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.labels}>
        {days.map((day, index) =>
          labelIndexes.has(index) ? (
            <Text key={day.dateKey} style={styles.label}>
              {day.dateKey.slice(5).replace('-', '/')}
            </Text>
          ) : (
            <View key={day.dateKey} style={styles.labelSpacer} />
          ),
        )}
      </View>
    </View>
  );
}

function pickLabelIndexes(count: number): Set<number> {
  if (count <= 7) {
    return new Set(Array.from({ length: count }, (_, index) => index));
  }
  const picks = new Set<number>([0, count - 1]);
  const steps = 5;
  for (let index = 1; index < steps; index += 1) {
    picks.add(Math.round((index * (count - 1)) / steps));
  }
  return picks;
}

const styles = StyleSheet.create({
  tooltip: {
    fontSize: 12,
    lineHeight: 16,
    color: readerTheme.textSecondary,
    marginBottom: 8,
  },
  plot: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  grid: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderColor: readerTheme.border,
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barHit: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    maxWidth: 14,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: readerTheme.primary,
  },
  barUnknown: {
    opacity: 0.35,
  },
  labels: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
    color: readerTheme.textMuted,
  },
  labelSpacer: {
    flex: 1,
  },
});

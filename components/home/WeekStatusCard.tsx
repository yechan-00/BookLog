import { StyleSheet, Text, View } from 'react-native';

import { libraryTheme } from '@/constants/libraryTheme';
import { radius, spacing, typography } from '@/constants/theme';
import { achievementLabel, type DayAchievement } from '@/utils/readingPeriod';
import type { WeeklyAchievement } from '@/utils/weeklyAchievement';

type WeekStatusCardProps = {
  week: WeeklyAchievement;
  todayKey: string;
};

export function WeekStatusCard({ week, todayKey }: WeekStatusCardProps) {
  const summary =
    week.rate === null ? '판정할 목표 요일이 아직 없습니다' : `확정 ${week.achievedCount}/${week.decidedCount}일 · ${week.rate}%`;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>이번 주 독서</Text>
      <Text style={styles.summary}>{summary}</Text>
      <View style={styles.days}>
        {week.days.map((day) => {
          const isToday = day.dateKey === todayKey;
          return (
            <View key={day.dateKey} style={styles.day}>
              <Text style={[styles.weekday, isToday && styles.weekdayToday]}>{day.label}</Text>
              <View style={[styles.marker, markerStyle(day.achievement), isToday && styles.markerToday]}>
                <Text style={[styles.markerGlyph, glyphStyle(day.achievement)]}>{markerGlyph(day.achievement)}</Text>
              </View>
              <Text style={[styles.state, isToday && styles.stateToday]}>{achievementLabel(day.achievement)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.note}>미래 날짜와 목표 없는 날은 실패로 보지 않습니다.</Text>
    </View>
  );
}

function markerGlyph(achievement: DayAchievement): string {
  switch (achievement) {
    case 'achieved':
      return '✓';
    case 'missed':
      return '–';
    case 'pending':
      return '·';
    case 'upcoming':
      return '◦';
    case 'off':
      return '~';
    case 'unknown':
      return '?';
    default:
      return '·';
  }
}

function markerStyle(achievement: DayAchievement) {
  if (achievement === 'achieved') {
    return styles.markerAchieved;
  }
  if (achievement === 'missed') {
    return styles.markerMissed;
  }
  if (achievement === 'pending') {
    return styles.markerPending;
  }
  if (achievement === 'upcoming') {
    return styles.markerUpcoming;
  }
  return styles.markerQuiet;
}

function glyphStyle(achievement: DayAchievement) {
  if (achievement === 'achieved') {
    return styles.glyphOnDark;
  }
  if (achievement === 'pending') {
    return styles.glyphAccent;
  }
  return styles.glyphMuted;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: libraryTheme.surface,
    borderColor: libraryTheme.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.bodyStrong,
    color: libraryTheme.darkBrown,
  },
  summary: {
    ...typography.body,
    color: libraryTheme.textSecondary,
  },
  days: {
    flexDirection: 'row',
    gap: 2,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weekday: {
    ...typography.caption,
    color: libraryTheme.textSecondary,
    fontWeight: '600',
  },
  weekdayToday: {
    color: libraryTheme.primaryBrown,
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerToday: {
    borderWidth: 2,
    borderColor: libraryTheme.primaryBrown,
  },
  markerAchieved: {
    backgroundColor: libraryTheme.success,
    borderColor: libraryTheme.success,
  },
  markerMissed: {
    backgroundColor: libraryTheme.surface,
    borderColor: libraryTheme.border,
  },
  markerPending: {
    backgroundColor: libraryTheme.softBrown,
    borderColor: libraryTheme.primaryBrown,
  },
  markerUpcoming: {
    backgroundColor: libraryTheme.background,
    borderColor: libraryTheme.border,
    borderStyle: 'dashed',
  },
  markerQuiet: {
    backgroundColor: libraryTheme.background,
    borderColor: libraryTheme.border,
  },
  markerGlyph: {
    fontSize: 12,
    fontWeight: '700',
  },
  glyphOnDark: {
    color: libraryTheme.onPrimary,
  },
  glyphAccent: {
    color: libraryTheme.primaryBrown,
  },
  glyphMuted: {
    color: libraryTheme.textSecondary,
  },
  state: {
    fontSize: 10,
    lineHeight: 13,
    color: libraryTheme.textSecondary,
    textAlign: 'center',
  },
  stateToday: {
    color: libraryTheme.primaryBrown,
    fontWeight: '700',
  },
  note: {
    ...typography.caption,
    color: libraryTheme.textSecondary,
  },
});

import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { MonthCalendar } from '@/components/reading/MonthCalendar';
import { ReadingStatCard } from '@/components/reading/ReadingStatCard';
import { WeekAchievementCard } from '@/components/reading/WeekAchievementCard';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { useFocusData } from '@/hooks/useFocusData';
import { startOfToday, toDateKey } from '@/utils/date';
import { formatDuration, formatKoreanDateKey } from '@/utils/format';
import { buildMonthMarks } from '@/utils/readingCalendar';
import {
  achievementLabel,
  describeDay,
  type ReadingActivity,
} from '@/utils/readingPeriod';
import { loadReadingHistory } from '@/utils/readingSource';
import { readingStreak } from '@/utils/readingStreak';
import { weeklyAchievement } from '@/utils/weeklyAchievement';

export default function RecordsScreen() {
  const todayKey = toDateKey(startOfToday());
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(startOfToday().getFullYear(), startOfToday().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const loadHistory = useCallback(() => loadReadingHistory(), []);
  const source = useFocusData(loadHistory);
  const history = source.status === 'ready' ? source.data : null;
  const marks = useMemo(
    () =>
      buildMonthMarks(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        todayKey,
        history?.goals ?? [],
        history?.activities ?? [],
      ),
    [history, todayKey, visibleMonth],
  );
  const weekly = history ? weeklyAchievement(todayKey, history.goals, history.activities) : null;
  const streak = history ? readingStreak(todayKey, history.goals, history.activities) : null;
  const selectedDay = history ? describeDay(selectedDate, todayKey, history.goals, history.activities) : null;
  const selectedActivities = history?.activities.filter((activity) => activity.readOn === selectedDate) ?? [];

  return (
    <Screen topInset>
      <View style={styles.header}>
        <Text style={styles.title}>기록</Text>
        <Text style={styles.subtitle}>독서한 날을 달력에서 다시 열어 봅니다.</Text>
      </View>

      <View style={styles.calendarCard}>
        <MonthCalendar
          visibleMonth={visibleMonth}
          selectedDate={selectedDate}
          todayKey={todayKey}
          marks={marks}
          onSelectDate={setSelectedDate}
          onChangeMonth={setVisibleMonth}
        />
      </View>
      {source.status === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.note}>독서 기록을 불러오는 중이에요.</Text>
        </View>
      ) : null}
      {source.status === 'error' ? (
        <View style={styles.retry}>
          <Text style={styles.note}>{source.message}</Text>
          <PrimaryButton label="다시 시도" onPress={source.reload} />
        </View>
      ) : null}

      <SectionHeader title={formatKoreanDateKey(selectedDate)} />
      {source.status === 'loading' ? (
        <EmptyState title="이 날의 기록을 불러오는 중이에요" />
      ) : history === null || selectedDay === null ? (
        <EmptyState
          title={source.status === 'error' ? '이 날의 기록을 확인하지 못했습니다' : '이 날의 기록을 불러올 수 없습니다'}
          description={source.status === 'error' ? source.message : '잠시 후 다시 시도해 주세요.'}
        />
      ) : (
        <SelectedDay day={selectedDay} activities={selectedActivities} />
      )}

      <SectionHeader title="이번 주 달성률" />
      {weekly ? (
        <WeekAchievementCard result={weekly} />
      ) : (
        <EmptyState
          title={source.status === 'error' ? '이번 주 달성률을 확인하지 못했습니다' : source.status === 'loading' ? '이번 주 달성률을 불러오는 중이에요' : '이번 주 달성률을 불러올 수 없습니다'}
          description={source.status === 'error' ? source.message : '목표 이력과 날짜별 세션이 있어야 계산합니다.'}
        />
      )}

      <SectionHeader title="연속 독서일" />
      {streak ? (
        <View style={styles.streak}>
          <ReadingStatCard label="목표 요일 기준" value={`${streak.days}일`} />
          <Text style={styles.note}>목표 요일만 셉니다. 오늘은 하루가 끝나기 전에 끊지 않습니다.</Text>
        </View>
      ) : (
        <EmptyState
          title={source.status === 'error' ? '연속 독서일을 확인하지 못했습니다' : source.status === 'loading' ? '연속 독서일을 불러오는 중이에요' : '연속 독서일을 불러올 수 없습니다'}
          description={source.status === 'error' ? source.message : '목표 이력과 날짜별 세션이 있어야 계산합니다.'}
        />
      )}
    </Screen>
  );
}

function SelectedDay({
  day,
  activities,
}: {
  day: NonNullable<ReturnType<typeof describeDay>>;
  activities: ReadingActivity[];
}) {
  return (
    <View style={styles.dayCard}>
      <Text style={styles.dayStatus}>{achievementLabel(day.achievement)}</Text>
      <Text style={styles.note}>
        {formatDuration(day.durationSeconds)}
        {day.pagesRead === null ? ' · 페이지 확인 불가' : ` · ${day.pagesRead}페이지`}
      </Text>
      {activities.length === 0 ? (
        <Text style={styles.note}>이 날의 독서 기록이 없습니다.</Text>
      ) : (
        activities.map((activity, index) => (
          <View key={`${activity.readOn}-${activity.bookTitle ?? 'book'}-${index}`} style={styles.session}>
            <Text style={styles.sessionTitle}>{activity.bookTitle ?? '책 정보 없음'}</Text>
            <Text style={styles.note}>
              {formatDuration(activity.durationSeconds)}
              {activity.pagesRead === null ? ' · 페이지 확인 불가' : ` · ${activity.pagesRead}페이지`}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    ...typography.greeting,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  calendarCard: {
    ...card,
    padding: spacing.lg,
  },
  dayCard: {
    ...card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  dayStatus: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  session: {
    gap: 2,
  },
  sessionTitle: {
    ...typography.body,
    color: colors.text,
  },
  streak: {
    gap: spacing.sm,
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  loading: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  retry: {
    gap: spacing.sm,
  },
});

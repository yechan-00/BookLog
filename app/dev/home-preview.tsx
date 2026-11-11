import { Redirect, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CurrentReadingCard } from '@/components/home/CurrentReadingCard';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeSourceState } from '@/components/home/HomeSourceState';
import { StreakCard } from '@/components/home/StreakCard';
import { TodayGoalCard } from '@/components/home/TodayGoalCard';
import { WeekStatusCard } from '@/components/home/WeekStatusCard';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { libraryTheme } from '@/constants/libraryTheme';
import { radius, spacing, typography } from '@/constants/theme';
import type { LibraryBook } from '@/types/book';
import { addDays, startOfToday, startOfWeek, toDateKey } from '@/utils/date';
import type { ReadingHistory } from '@/utils/readingPeriod';
import { homeReadingSummary } from '@/utils/readingSummary';
import { spinePaletteColorFor } from '@/utils/spineStyle';

type PreviewScenario =
  | 'no-book'
  | 'reading-book'
  | 'time-goal'
  | 'page-goal'
  | 'goal-achieved'
  | 'loading'
  | 'error';

const SCENARIOS: { key: PreviewScenario; label: string }[] = [
  { key: 'no-book', label: '책 없음' },
  { key: 'reading-book', label: '읽는 중' },
  { key: 'time-goal', label: '시간 목표' },
  { key: 'page-goal', label: '페이지 목표' },
  { key: 'goal-achieved', label: '목표 달성' },
  { key: 'loading', label: '로딩' },
  { key: 'error', label: '오류' },
];

function sampleBook(): LibraryBook {
  return {
    id: 'preview-book',
    userBookId: 'preview-user-book',
    title: '아주 긴 한글 제목도 카드에서 자연스럽게 보여야 하는 책',
    author: '북로그',
    coverColor: spinePaletteColorFor('preview-user-book'),
    spineColor: spinePaletteColorFor('preview-user-book'),
    totalPages: 280,
    currentPage: 96,
    status: 'reading',
    rating: null,
    startedAt: toDateKey(addDays(startOfToday(), -5)),
    completedAt: null,
    lastReadAt: toDateKey(startOfToday()),
  };
}

function weekdays(): number[] {
  return [1, 2, 3, 4, 5, 6, 0];
}

function historyFor(scenario: PreviewScenario): ReadingHistory {
  const today = startOfToday();
  const todayKey = toDateKey(today);
  const weekStart = startOfWeek(today);
  const goals =
    scenario === 'no-book'
      ? []
      : [
          {
            type: scenario === 'page-goal' ? ('pages' as const) : ('time' as const),
            targetValue: scenario === 'page-goal' ? 20 : 30,
            daysOfWeek: weekdays(),
            startsOn: toDateKey(addDays(weekStart, -14)),
            endsOn: null,
          },
        ];

  if (scenario === 'no-book') {
    return { goals, activities: [] };
  }

  const monday = toDateKey(weekStart);
  const tuesday = toDateKey(addDays(weekStart, 1));

  if (scenario === 'goal-achieved') {
    return {
      goals,
      activities: [
        { readOn: monday, durationSeconds: 40 * 60, pagesRead: 25, bookTitle: '샘플' },
        { readOn: tuesday, durationSeconds: 35 * 60, pagesRead: 22, bookTitle: '샘플' },
        { readOn: todayKey, durationSeconds: 35 * 60, pagesRead: 22, bookTitle: '샘플' },
      ],
    };
  }

  if (scenario === 'page-goal') {
    return {
      goals,
      activities: [{ readOn: todayKey, durationSeconds: 18 * 60, pagesRead: 15, bookTitle: '샘플' }],
    };
  }

  return {
    goals,
    activities: [{ readOn: todayKey, durationSeconds: 20 * 60, pagesRead: 12, bookTitle: '샘플' }],
  };
}

export default function HomePreviewScreen() {
  const [scenario, setScenario] = useState<PreviewScenario>('time-goal');
  const today = startOfToday();
  const todayKey = toDateKey(today);
  const history = historyFor(scenario);
  const summary = homeReadingSummary(todayKey, history);
  const book = scenario === 'no-book' || scenario === 'loading' || scenario === 'error' ? null : sampleBook();

  if (!__DEV__) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Screen topInset backgroundColor={libraryTheme.background}>
      <Stack.Screen options={{ title: '홈 미리보기' }} />
      <Text style={styles.warning}>실제 홈 데이터가 아닙니다. 디자인 확인용 샘플입니다.</Text>
      <View style={styles.counts}>
        {SCENARIOS.map((item) => {
          const selected = item.key === scenario;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setScenario(item.key)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <HomeHeader today={today} />

      <SectionHeader title="지금 읽는 책" />
      {scenario === 'loading' ? (
        <HomeSourceState kind="loading" />
      ) : scenario === 'error' ? (
        <HomeSourceState kind="error" description="미리보기용 오류 상태입니다." />
      ) : book ? (
        <CurrentReadingCard book={book} />
      ) : (
        <HomeSourceState
          kind="empty"
          title="첫 번째 독서를 시작해 볼까요?"
          description="서재에 책을 등록하면 이곳에 이어 읽기가 나타납니다."
          actionLabel="책 등록하기"
        />
      )}

      <SectionHeader title="오늘의 목표" />
      {scenario === 'loading' ? (
        <HomeSourceState kind="loading" />
      ) : scenario === 'error' ? (
        <HomeSourceState kind="error" description="미리보기용 오류 상태입니다." />
      ) : (
        <TodayGoalCard goal={summary.goal} />
      )}

      <SectionHeader title="이번 주 독서" />
      {scenario === 'loading' ? (
        <HomeSourceState kind="loading" />
      ) : scenario === 'error' ? (
        <HomeSourceState kind="error" description="미리보기용 오류 상태입니다." />
      ) : (
        <WeekStatusCard week={summary.week} todayKey={todayKey} />
      )}

      <SectionHeader title="연속 독서" />
      {scenario === 'loading' ? (
        <HomeSourceState kind="loading" />
      ) : scenario === 'error' ? (
        <HomeSourceState kind="error" description="미리보기용 오류 상태입니다." />
      ) : (
        <StreakCard streak={summary.streak} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  warning: {
    ...typography.caption,
    color: libraryTheme.primaryBrown,
  },
  counts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: libraryTheme.border,
    backgroundColor: libraryTheme.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: libraryTheme.primaryBrown,
    borderColor: libraryTheme.primaryBrown,
  },
  chipLabel: {
    ...typography.caption,
    color: libraryTheme.primaryBrown,
    fontWeight: '700',
  },
  chipLabelSelected: {
    color: libraryTheme.onPrimary,
  },
});

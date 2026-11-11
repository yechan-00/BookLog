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
import { homeRadius, homeSpace, homeTheme } from '@/constants/homeTheme';
import type { LibraryBook } from '@/types/book';
import { addDays, startOfToday, startOfWeek, toDateKey } from '@/utils/date';
import { homeWeekStats } from '@/utils/homeWeekStats';
import type { ReadingHistory } from '@/utils/readingPeriod';
import { homeReadingSummary } from '@/utils/readingSummary';
import { spinePaletteColorFor } from '@/utils/spineStyle';

type PreviewScenario =
  | 'reading-book'
  | 'no-book'
  | 'long-title'
  | 'long-name'
  | 'no-cover'
  | 'time-goal'
  | 'page-goal'
  | 'goal-achieved'
  | 'streak-zero'
  | 'streak-14'
  | 'week-empty'
  | 'week-filled'
  | 'loading'
  | 'error';

const SCENARIOS: { key: PreviewScenario; label: string }[] = [
  { key: 'reading-book', label: '책 있음' },
  { key: 'no-book', label: '책 없음' },
  { key: 'long-title', label: '긴 제목' },
  { key: 'long-name', label: '긴 이름' },
  { key: 'no-cover', label: '표지 없음' },
  { key: 'time-goal', label: '시간 목표' },
  { key: 'page-goal', label: '페이지 목표' },
  { key: 'goal-achieved', label: '목표 달성' },
  { key: 'streak-zero', label: '연속 0일' },
  { key: 'streak-14', label: '연속 14일' },
  { key: 'week-empty', label: '주간 없음' },
  { key: 'week-filled', label: '주간 있음' },
  { key: 'loading', label: '로딩' },
  { key: 'error', label: '오류' },
];

function weekdays(): number[] {
  return [1, 2, 3, 4, 5, 6, 0];
}

function sampleBook(scenario: PreviewScenario): LibraryBook {
  const longTitle = scenario === 'long-title';
  const noCover = scenario === 'no-cover';
  return {
    id: 'preview-book',
    userBookId: 'preview-user-book',
    title: longTitle
      ? '아주 긴 한글 제목도 카드에서 자연스럽게 줄바꿈되어야 하는 책'
      : '아주 작은 습관의 힘',
    author: '제임스 클리어',
    coverColor: spinePaletteColorFor('preview-user-book'),
    spineColor: spinePaletteColorFor('preview-user-book'),
    coverImageUrl: noCover ? undefined : 'https://example.invalid/cover.jpg',
    totalPages: 280,
    currentPage: 210,
    status: 'reading',
    rating: null,
    startedAt: toDateKey(addDays(startOfToday(), -12)),
    completedAt: null,
    lastReadAt: toDateKey(startOfToday()),
  };
}

function historyFor(scenario: PreviewScenario): ReadingHistory {
  const today = startOfToday();
  const todayKey = toDateKey(today);
  const weekStart = startOfWeek(today);
  const isPage = scenario === 'page-goal';
  const noGoal = scenario === 'week-empty' || scenario === 'streak-zero' || scenario === 'no-book';
  const goals = noGoal
    ? []
    : [
        {
          type: isPage ? ('pages' as const) : ('time' as const),
          targetValue: isPage ? 20 : 60,
          daysOfWeek: weekdays(),
          startsOn: toDateKey(addDays(weekStart, -40)),
          endsOn: null,
        },
      ];

  if (scenario === 'week-empty' || scenario === 'no-book' || scenario === 'streak-zero') {
    return { goals, activities: [] };
  }

  if (scenario === 'streak-14' || scenario === 'week-filled' || scenario === 'goal-achieved') {
    const activities = Array.from({ length: 14 }, (_, index) => {
      const dateKey = toDateKey(addDays(today, -index));
      return {
        readOn: dateKey,
        durationSeconds: (70 - (index % 3) * 5) * 60,
        pagesRead: 22,
        bookTitle: '샘플',
      };
    });
    return { goals, activities };
  }

  if (scenario === 'page-goal') {
    return {
      goals,
      activities: [{ readOn: todayKey, durationSeconds: 18 * 60, pagesRead: 15, bookTitle: '샘플' }],
    };
  }

  return {
    goals,
    activities: [
      { readOn: toDateKey(addDays(weekStart, 0)), durationSeconds: 40 * 60, pagesRead: 12, bookTitle: '샘플' },
      { readOn: toDateKey(addDays(weekStart, 1)), durationSeconds: 55 * 60, pagesRead: 16, bookTitle: '샘플' },
      { readOn: toDateKey(addDays(weekStart, 2)), durationSeconds: 25 * 60, pagesRead: 10, bookTitle: '샘플' },
      {
        readOn: todayKey,
        durationSeconds: 45 * 60,
        pagesRead: 14,
        bookTitle: '샘플',
      },
    ],
  };
}

export default function HomePreviewScreen() {
  const [scenario, setScenario] = useState<PreviewScenario>('reading-book');
  const today = startOfToday();
  const todayKey = toDateKey(today);
  const history = historyFor(scenario);
  const summary = homeReadingSummary(todayKey, history);
  const weekStats = homeWeekStats(todayKey, history.activities);
  const showBook = scenario !== 'no-book' && scenario !== 'loading' && scenario !== 'error';
  const book = showBook ? sampleBook(scenario) : null;
  const previewNickname =
    scenario === 'long-name' ? '김민서독서가' : scenario === 'no-book' ? null : '민서';

  if (!__DEV__) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Screen topInset backgroundColor={homeTheme.background} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: '홈 미리보기' }} />
      <Text style={styles.warning}>실제 홈 데이터가 아닙니다. 디자인 확인용 샘플입니다.</Text>
      <View style={styles.chips}>
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

      <HomeHeader today={today} previewNickname={previewNickname} />

      {scenario === 'loading' ? (
        <HomeSourceState kind="loading" />
      ) : scenario === 'error' ? (
        <HomeSourceState kind="error" description="미리보기용 오류 상태입니다." />
      ) : book ? (
        <CurrentReadingCard book={book} />
      ) : (
        <HomeSourceState
          kind="empty"
          title="아직 읽고 있는 책이 없어요."
          description="서재에 책을 등록하면 이곳에 이어 읽기가 나타납니다."
          actionLabel="책 등록하기"
        />
      )}

      <View style={styles.midRow}>
        {scenario === 'loading' ? (
          <>
            <View style={styles.midItem}>
              <HomeSourceState kind="loading" />
            </View>
            <View style={styles.midItem}>
              <HomeSourceState kind="loading" />
            </View>
          </>
        ) : scenario === 'error' ? (
          <View style={styles.midFull}>
            <HomeSourceState kind="error" description="미리보기용 오류 상태입니다." />
          </View>
        ) : (
          <>
            <View style={styles.midItem}>
              <TodayGoalCard goal={summary.goal} />
            </View>
            <View style={styles.midItem}>
              <StreakCard streak={summary.streak} weekDays={weekStats.days} />
            </View>
          </>
        )}
      </View>

      {scenario === 'loading' ? (
        <HomeSourceState kind="loading" />
      ) : scenario === 'error' ? null : (
        <WeekStatusCard weekStats={weekStats} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  warning: {
    fontSize: 12,
    lineHeight: 16,
    color: homeTheme.primary,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: homeSpace.sm,
  },
  chip: {
    minHeight: 34,
    borderRadius: homeRadius.pill,
    borderWidth: 1,
    borderColor: homeTheme.border,
    backgroundColor: homeTheme.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: homeTheme.primary,
    borderColor: homeTheme.primary,
  },
  chipLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: homeTheme.primary,
    fontWeight: '700',
  },
  chipLabelSelected: {
    color: homeTheme.onPrimary,
  },
  midRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  midItem: {
    flex: 1,
    minWidth: 0,
  },
  midFull: {
    flex: 1,
  },
});

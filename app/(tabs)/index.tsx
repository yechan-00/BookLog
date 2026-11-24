import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { CurrentReadingCard } from '@/components/home/CurrentReadingCard';
import { BookshelfPreviewCard } from '@/components/home/BookshelfPreviewCard';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeSourceState } from '@/components/home/HomeSourceState';
import { StreakCard } from '@/components/home/StreakCard';
import { TodayGoalCard } from '@/components/home/TodayGoalCard';
import { WeekStatusCard } from '@/components/home/WeekStatusCard';
import { Screen } from '@/components/common/Screen';
import { homeTheme } from '@/constants/homeTheme';
import { useFocusData } from '@/hooks/useFocusData';
import type { ShelfBook } from '@/components/books/Bookshelf';
import { startOfToday, toDateKey } from '@/utils/date';
import { homeWeekStats } from '@/utils/homeWeekStats';
import { homeReadingSummary } from '@/utils/readingSummary';
import { loadCurrentBook, loadLibraryBooks, loadReadingHistory } from '@/utils/readingSource';
import { bookshelfDashboard } from '@/utils/bookshelfView';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const stackMid = width < 340;
  const today = startOfToday();
  const todayKey = toDateKey(today);
  const loadHistory = useCallback(() => loadReadingHistory(), []);
  const loadBook = useCallback(() => loadCurrentBook(), []);
  const loadShelf = useCallback(() => loadLibraryBooks(), []);
  const historySource = useFocusData(loadHistory);
  const bookSource = useFocusData(loadBook);
  const shelfSource = useFocusData(loadShelf);
  const summary = historySource.status === 'ready' ? homeReadingSummary(todayKey, historySource.data) : null;
  const weekStats =
    historySource.status === 'ready' ? homeWeekStats(todayKey, historySource.data.activities) : null;
  const book = bookSource.status === 'ready' ? bookSource.data : null;
  const shelfDashboard =
    shelfSource.status === 'ready' ? bookshelfDashboard(shelfSource.data, todayKey, []) : null;
  const previewBooks: ShelfBook[] = useMemo(
    () =>
      (shelfDashboard?.completedSpines ?? []).map((spine) => ({
        id: spine.userBookId,
        userBookId: spine.userBookId,
        title: spine.title,
        color: spine.spineColor,
        width: spine.displayWidth,
      })),
    [shelfDashboard],
  );

  return (
    <Screen topInset backgroundColor={homeTheme.background} contentContainerStyle={styles.content}>
      <HomeHeader today={today} />

      {bookSource.status === 'loading' ? (
        <HomeSourceState kind="loading" />
      ) : bookSource.status === 'error' ? (
        <HomeSourceState kind="error" title="독서 정보를 불러오지 못했어요." description={bookSource.message} />
      ) : book ? (
        <CurrentReadingCard book={book} />
      ) : (
        <HomeSourceState
          kind="empty"
          title="아직 읽고 있는 책이 없어요."
          description="서재에 책을 등록하면 이곳에 이어 읽기가 나타납니다."
          actionLabel="책 등록하기"
          onAction={() => router.push('/book/search')}
        />
      )}

      <View style={[styles.midRow, stackMid && styles.midStacked]}>
        {historySource.status === 'loading' ? (
          <>
            <View style={[styles.midItem, stackMid && styles.midItemStacked]}>
              <HomeSourceState kind="loading" title="목표를 불러오는 중이에요" />
            </View>
            <View style={[styles.midItem, stackMid && styles.midItemStacked]}>
              <HomeSourceState kind="loading" title="연속 기록을 불러오는 중이에요" />
            </View>
          </>
        ) : historySource.status === 'error' ? (
          <View style={styles.midFull}>
            <HomeSourceState
              kind="error"
              title="독서 정보를 불러오지 못했어요."
              description={historySource.message}
            />
          </View>
        ) : summary && weekStats ? (
          <>
            <View style={[styles.midItem, stackMid && styles.midItemStacked]}>
              <TodayGoalCard goal={summary.goal} />
            </View>
            <View style={[styles.midItem, stackMid && styles.midItemStacked]}>
              <StreakCard streak={summary.streak} weekDays={weekStats.days} />
            </View>
          </>
        ) : null}
      </View>

      {historySource.status === 'loading' ? (
        <HomeSourceState kind="loading" title="주간 기록을 불러오는 중이에요" />
      ) : historySource.status === 'error' ? null : weekStats ? (
        <WeekStatusCard weekStats={weekStats} />
      ) : null}

      <BookshelfPreviewCard
        books={previewBooks}
        completedCount={shelfDashboard?.completedCount ?? 0}
        dustyCount={shelfDashboard?.dustyCount ?? 0}
        loading={shelfSource.status === 'loading'}
        errorMessage={shelfSource.status === 'error' ? shelfSource.message : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 24,
  },
  midRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  midStacked: {
    flexDirection: 'column',
  },
  midItem: {
    flex: 1,
    minWidth: 0,
  },
  midItemStacked: {
    flex: undefined,
    width: '100%',
  },
  midFull: {
    flex: 1,
  },
});

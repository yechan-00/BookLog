import { router } from 'expo-router';
import { useCallback } from 'react';

import { CurrentReadingCard } from '@/components/home/CurrentReadingCard';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeSourceState } from '@/components/home/HomeSourceState';
import { StreakCard } from '@/components/home/StreakCard';
import { TodayGoalCard } from '@/components/home/TodayGoalCard';
import { WeekStatusCard } from '@/components/home/WeekStatusCard';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { libraryTheme } from '@/constants/libraryTheme';
import { useFocusData } from '@/hooks/useFocusData';
import { startOfToday, toDateKey } from '@/utils/date';
import { homeReadingSummary } from '@/utils/readingSummary';
import { loadCurrentBook, loadReadingHistory } from '@/utils/readingSource';

export default function HomeScreen() {
  const today = startOfToday();
  const todayKey = toDateKey(today);
  const loadHistory = useCallback(() => loadReadingHistory(), []);
  const loadBook = useCallback(() => loadCurrentBook(), []);
  const historySource = useFocusData(loadHistory);
  const bookSource = useFocusData(loadBook);
  const summary = historySource.status === 'ready' ? homeReadingSummary(todayKey, historySource.data) : null;
  const book = bookSource.status === 'ready' ? bookSource.data : null;

  return (
    <Screen topInset backgroundColor={libraryTheme.background}>
      <HomeHeader today={today} onOpenPreview={() => router.push('/dev/home-preview')} />

      <SectionHeader title="지금 읽는 책" />
      {bookSource.status === 'loading' ? (
        <HomeSourceState kind="loading" />
      ) : bookSource.status === 'error' ? (
        <HomeSourceState kind="error" title="독서 정보를 불러오지 못했어요." description={bookSource.message} />
      ) : book ? (
        <CurrentReadingCard book={book} />
      ) : (
        <HomeSourceState
          kind="empty"
          title="첫 번째 독서를 시작해 볼까요?"
          description="서재에 책을 등록하면 이곳에 이어 읽기가 나타납니다."
          actionLabel="책 등록하기"
          onAction={() => router.push('/book/search')}
        />
      )}

      <SectionHeader title="오늘의 목표" />
      {historySource.status === 'loading' ? (
        <HomeSourceState kind="loading" />
      ) : historySource.status === 'error' ? (
        <HomeSourceState kind="error" title="독서 정보를 불러오지 못했어요." description={historySource.message} />
      ) : summary ? (
        <TodayGoalCard goal={summary.goal} />
      ) : null}

      <SectionHeader title="이번 주 독서" />
      {historySource.status === 'loading' ? (
        <HomeSourceState kind="loading" />
      ) : historySource.status === 'error' ? (
        <HomeSourceState kind="error" title="독서 정보를 불러오지 못했어요." description={historySource.message} />
      ) : summary ? (
        <WeekStatusCard week={summary.week} todayKey={todayKey} />
      ) : null}

      <SectionHeader title="연속 독서" />
      {historySource.status === 'loading' ? (
        <HomeSourceState kind="loading" />
      ) : historySource.status === 'error' ? (
        <HomeSourceState kind="error" title="독서 정보를 불러오지 못했어요." description={historySource.message} />
      ) : summary ? (
        <StreakCard streak={summary.streak} />
      ) : null}
    </Screen>
  );
}

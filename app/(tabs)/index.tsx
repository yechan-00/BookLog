import { router } from 'expo-router';

import { CurrentReadingCard } from '@/components/home/CurrentReadingCard';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeSourceState } from '@/components/home/HomeSourceState';
import { StreakCard } from '@/components/home/StreakCard';
import { TodayGoalCard } from '@/components/home/TodayGoalCard';
import { WeekStatusCard } from '@/components/home/WeekStatusCard';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { libraryTheme } from '@/constants/libraryTheme';
import { startOfToday, toDateKey } from '@/utils/date';
import { homeReadingSummary } from '@/utils/readingSummary';
import { loadCurrentBook, loadReadingHistory, type LoadStatus } from '@/utils/readingSource';

export default function HomeScreen() {
  const today = startOfToday();
  const todayKey = toDateKey(today);
  const historySource = loadReadingHistory();
  const bookSource = loadCurrentBook();
  const summary = historySource.status === 'ready' ? homeReadingSummary(todayKey, historySource.value) : null;
  const book = bookSource.status === 'ready' ? bookSource.value : null;

  return (
    <Screen topInset backgroundColor={libraryTheme.background}>
      <HomeHeader today={today} onOpenPreview={() => router.push('/dev/home-preview')} />

      <SectionHeader title="지금 읽는 책" />
      {book ? (
        <CurrentReadingCard book={book} />
      ) : (
        <BookSourceState source={bookSource} />
      )}

      <SectionHeader title="오늘의 목표" />
      {summary ? (
        <TodayGoalCard goal={summary.goal} />
      ) : (
        <HistorySourceState
          source={historySource}
          unavailableTitle="오늘의 목표를 불러올 수 없습니다"
          failedTitle="독서 정보를 불러오지 못했어요."
        />
      )}

      <SectionHeader title="이번 주 독서" />
      {summary ? (
        <WeekStatusCard week={summary.week} todayKey={todayKey} />
      ) : (
        <HistorySourceState
          source={historySource}
          unavailableTitle="이번 주 독서를 불러올 수 없습니다"
          failedTitle="독서 정보를 불러오지 못했어요."
        />
      )}

      <SectionHeader title="연속 독서" />
      {summary ? (
        <StreakCard streak={summary.streak} />
      ) : (
        <HistorySourceState
          source={historySource}
          unavailableTitle="연속 독서를 불러올 수 없습니다"
          failedTitle="독서 정보를 불러오지 못했어요."
        />
      )}
    </Screen>
  );
}

function BookSourceState({ source }: { source: LoadStatus<unknown> }) {
  if (source.status === 'error') {
    return <HomeSourceState kind="error" title="독서 정보를 불러오지 못했어요." description={source.message} />;
  }

  if (source.status === 'ready') {
    return (
      <HomeSourceState
        kind="empty"
        title="첫 번째 독서를 시작해 볼까요?"
        description="서재에 책을 등록하면 이곳에 이어 읽기가 나타납니다."
        actionLabel="책 등록하기"
        onAction={() => router.push('/book/search')}
      />
    );
  }

  return (
    <HomeSourceState
      kind="unavailable"
      title="현재 읽는 책을 불러올 수 없습니다"
      description="서재 조회 API가 없습니다. 예시 책은 표시하지 않습니다."
    />
  );
}

function HistorySourceState({
  source,
  unavailableTitle,
  failedTitle,
}: {
  source: LoadStatus<unknown>;
  unavailableTitle: string;
  failedTitle: string;
}) {
  if (source.status === 'error') {
    return <HomeSourceState kind="error" title={failedTitle} description={source.message} />;
  }

  return (
    <HomeSourceState
      kind="unavailable"
      title={unavailableTitle}
      description="세션·목표 이력 조회 API가 없습니다. 예시 수치는 표시하지 않습니다."
    />
  );
}

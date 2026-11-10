import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCover } from '@/components/books/BookCover';
import { Bookshelf } from '@/components/books/Bookshelf';
import { AppIcon } from '@/components/common/AppIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ReadingStatCard } from '@/components/reading/ReadingStatCard';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import type { LibraryBook } from '@/types/book';
import { startOfToday, toDateKey } from '@/utils/date';
import { clampPercent, formatDuration, formatKoreanDate, formatPercent } from '@/utils/format';
import type { TodayGoalProgress } from '@/utils/readingSummary';
import { homeReadingSummary } from '@/utils/readingSummary';
import { loadCurrentBook, loadLibraryBooks, loadReadingHistory, type LoadStatus } from '@/utils/readingSource';
import { shelfGrowth, TEMP_SPINE_WIDTH_BANDS } from '@/utils/shelfGrowth';

export default function HomeScreen() {
  const todayKey = toDateKey(startOfToday());
  const historySource = loadReadingHistory();
  const bookSource = loadCurrentBook();
  const summary = historySource.status === 'ready' ? homeReadingSummary(todayKey, historySource.value) : null;
  const book = bookSource.status === 'ready' ? bookSource.value : null;
  const librarySource = loadLibraryBooks();
  const library = librarySource.status === 'ready' ? librarySource.value : [];
  const shelf = shelfGrowth(
    library.map((item) => ({
      userBookId: item.userBookId,
      bookId: item.id,
      title: item.title,
      status: item.status,
      totalPages: item.totalPages,
      spineColor: item.spineColor,
    })),
    TEMP_SPINE_WIDTH_BANDS,
  );

  return (
    <Screen topInset>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>안녕하세요</Text>
          <Text style={styles.date}>{formatKoreanDate(startOfToday())}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="설정"
          hitSlop={8}
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}
        >
          <AppIcon name="settings" color={colors.text} />
        </Pressable>
      </View>

      <SectionHeader title="지금 읽는 책" />
      {book ? (
        <CurrentBook book={book} />
      ) : (
        <EmptyState title={bookTitle(bookSource)} description={bookDescription(bookSource)} />
      )}

      <SectionHeader title="오늘의 목표" />
      {summary ? (
        <TodayGoal goal={summary.goal} />
      ) : (
        <EmptyState title={historyTitle(historySource, '오늘의 목표를 불러올 수 없습니다', '오늘의 목표를 확인하지 못했습니다')} description={historyDescription(historySource)} />
      )}

      <SectionHeader title="오늘의 독서" />
      {summary ? (
        summary.reading.sessionCount === 0 ? (
          <EmptyState title="오늘 독서 기록이 없습니다" description="세션이 저장되면 시간과 페이지가 표시됩니다." />
        ) : (
          <View style={styles.stats}>
            <ReadingStatCard label="읽은 시간" value={formatDuration(summary.reading.durationSeconds)} style={styles.stat} />
            <ReadingStatCard
              label="읽은 페이지"
              value={summary.reading.pagesRead === null ? '집계 불가' : `${summary.reading.pagesRead}p`}
              style={styles.stat}
            />
            <ReadingStatCard label="세션" value={`${summary.reading.sessionCount}회`} style={styles.stat} />
          </View>
        )
      ) : (
        <EmptyState title={historyTitle(historySource, '오늘의 독서를 불러올 수 없습니다', '오늘의 독서를 확인하지 못했습니다')} description={historyDescription(historySource)} />
      )}

      <SectionHeader title="연속 독서 · 이번 주" />
      {summary ? (
        <View style={styles.stats}>
          <ReadingStatCard label="연속 독서일" value={`${summary.streak.days}일`} style={styles.stat} />
          <ReadingStatCard
            label="확정 달성률"
            value={summary.week.rate === null ? '—' : `${summary.week.rate}%`}
            style={styles.stat}
          />
        </View>
      ) : (
        <EmptyState title={historyTitle(historySource, '요약을 불러올 수 없습니다', '요약을 확인하지 못했습니다')} description={historyDescription(historySource)} />
      )}

      <SectionHeader title="책꽂이" />
      {librarySource.status !== 'ready' ? (
        <EmptyState
          title={librarySource.status === 'error' ? '책꽂이를 확인하지 못했습니다' : '책꽂이를 불러올 수 없습니다'}
          description={librarySource.status === 'error' ? librarySource.message : '서재 조회 API가 없습니다. 예시 책은 표시하지 않습니다.'}
        />
      ) : shelf.completedCount === 0 ? (
        <EmptyState title="책꽂이가 아직 비어 있어요" description="완독한 책이 여기에 한 권씩 놓입니다." />
      ) : (
        <Bookshelf
          books={shelf.spines.map((spine) => ({
            id: spine.userBookId,
            bookId: spine.bookId,
            title: spine.title,
            color: spine.spineColor,
            width: spine.width,
          }))}
          onPressBook={(bookId) => router.push(`/book/${bookId}`)}
        />
      )}
    </Screen>
  );
}

function CurrentBook({ book }: { book: LibraryBook }) {
  return (
    <View style={styles.bookCard}>
      <Pressable accessibilityRole="button" onPress={() => router.push(`/book/${book.id}`)} style={styles.bookRow}>
        <BookCover title={book.title} color={book.coverColor} width={72} imageUrl={book.coverImageUrl} />
        <View style={styles.bookBody}>
          <Text numberOfLines={2} style={styles.bookTitle}>
            {book.title}
          </Text>
          <Text style={styles.author}>{book.author}</Text>
          <Text style={styles.pages}>
            {book.currentPage} / {book.totalPages}페이지 · {clampPercent(book.currentPage, book.totalPages)}%
          </Text>
          <ProgressBar current={book.currentPage} total={book.totalPages} />
        </View>
      </Pressable>
      <PrimaryButton
        label="독서 시작"
        onPress={() => router.push({ pathname: '/reading/session', params: { bookId: book.id } })}
      />
    </View>
  );
}

function TodayGoal({ goal }: { goal: TodayGoalProgress }) {
  if (goal.state === 'no_goal') {
    return <EmptyState title="오늘의 목표가 없습니다" description="적용 중인 목표가 없는 날입니다." />;
  }

  if (goal.state === 'rest') {
    return (
      <View style={styles.goalCard}>
        <Text style={styles.goalTitle}>오늘은 쉬는 날입니다</Text>
        <Text style={styles.goalNote}>목표 요일이 아닙니다. 독서 시작은 지금 읽는 책이 있을 때 그대로 할 수 있습니다.</Text>
      </View>
    );
  }

  if (goal.state === 'unknown' || goal.percent === null) {
    return <EmptyState title="목표 진행을 계산할 수 없습니다" description="목표량이나 페이지 기록이 없어 0으로 채우지 않았습니다." />;
  }

  const achieved = goal.state === 'achieved';
  return (
    <View style={styles.goalCard}>
      <Text style={styles.goalTitle}>{goal.goalType === 'time' ? '시간 목표' : '페이지 목표'}</Text>
      <Text style={styles.goalNote}>{goalDetail(goal)}</Text>
      <ProgressBar current={goal.percent} total={100} />
      <Text style={styles.goalNote}>진행률 {formatPercent(goal.percent, 100)}</Text>
      <Text style={[styles.goalNote, achieved && styles.achieved]}>
        {achieved ? '오늘 목표를 채웠습니다. 독서는 계속할 수 있습니다.' : '오늘 목표는 진행 중입니다.'}
      </Text>
    </View>
  );
}

function goalDetail(goal: TodayGoalProgress): string {
  if (goal.goalType === 'time' && goal.targetSeconds !== null && goal.remainingSeconds !== null) {
    return `목표 ${formatDuration(goal.targetSeconds)} · 읽은 ${formatDuration(goal.readSeconds)} · 남은 ${formatDuration(goal.remainingSeconds)}`;
  }

  if (goal.targetPages !== null && goal.readPages !== null && goal.remainingPages !== null) {
    return `목표 ${goal.targetPages}페이지 · 읽은 ${goal.readPages}페이지 · 남은 ${goal.remainingPages}페이지`;
  }

  return '목표 진행을 계산할 수 없습니다';
}

function bookTitle(source: LoadStatus<LibraryBook | null>): string {
  if (source.status === 'error') {
    return '현재 읽는 책을 확인하지 못했습니다';
  }
  if (source.status === 'ready') {
    return '읽고 있는 책이 없어요';
  }
  return '현재 읽는 책을 불러올 수 없습니다';
}

function bookDescription(source: LoadStatus<LibraryBook | null>): string {
  if (source.status === 'error') {
    return source.message;
  }
  if (source.status === 'ready') {
    return '서재에서 책을 고르면 이곳에 나타납니다.';
  }
  return '서재 조회 API가 없습니다. 예시 책은 표시하지 않습니다.';
}

function historyTitle(source: LoadStatus<unknown>, unavailable: string, failed: string): string {
  return source.status === 'error' ? failed : unavailable;
}

function historyDescription(source: LoadStatus<unknown>): string {
  if (source.status === 'error') {
    return source.message;
  }
  return '세션·목표 이력 조회 API가 없습니다. 예시 수치는 표시하지 않습니다.';
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    gap: 4,
    flex: 1,
  },
  greeting: {
    ...typography.greeting,
    color: colors.text,
  },
  date: {
    ...typography.body,
    color: colors.textSecondary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookCard: {
    ...card,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  bookRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bookBody: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  bookTitle: {
    ...typography.title,
    color: colors.text,
  },
  author: {
    ...typography.body,
    color: colors.textSecondary,
  },
  pages: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  goalCard: {
    ...card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  goalTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  goalNote: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  achieved: {
    color: colors.positive,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
});

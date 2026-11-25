import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { BookCover } from '@/components/books/BookCover';
import { AppIcon } from '@/components/common/AppIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { SheetModal } from '@/components/common/SheetModal';
import { MonthCalendar } from '@/components/reading/MonthCalendar';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { useFocusData } from '@/hooks/useFocusData';
import type { CalendarCompletedBook } from '@/utils/calendarCompletions';
import {
  completionsForDate,
  groupCompletionsByDate,
} from '@/utils/calendarCompletions';
import { startOfToday, toDateKey } from '@/utils/date';
import {
  formatDuration,
  formatKoreanDateKey,
  formatLocalClock,
} from '@/utils/format';
import { buildMonthMarks } from '@/utils/readingCalendar';
import {
  type DayAchievement,
  type DayReadingState,
  type ReadingActivity,
} from '@/utils/readingPeriod';
import { loadLibraryBooks, loadReadingHistory } from '@/utils/readingSource';
import {
  daySessionSummary,
  selectionForVisibleMonth,
} from '@/utils/recordsMonth';

export default function RecordsScreen() {
  const todayKey = toDateKey(startOfToday());
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(startOfToday().getFullYear(), startOfToday().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [detailSession, setDetailSession] = useState<ReadingActivity | null>(null);

  const loadHistory = useCallback(() => loadReadingHistory(), []);
  const loadBooks = useCallback(() => loadLibraryBooks(), []);
  const source = useFocusData(loadHistory);
  const booksSource = useFocusData(loadBooks);

  const history = source.status === 'ready' ? source.data : null;
  const booksFailed = booksSource.status === 'error';

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

  const completionsByDate = useMemo(
    () => groupCompletionsByDate(booksSource.status === 'ready' ? booksSource.data : []),
    [booksSource],
  );
  const selected = history
    ? daySessionSummary(selectedDate, todayKey, history.goals, history.activities)
    : null;

  const selectedCompletions = useMemo(
    () => completionsForDate(completionsByDate, selectedDate),
    [completionsByDate, selectedDate],
  );

  const changeMonth = (next: Date) => {
    setVisibleMonth(next);
    setSelectedDate(
      selectionForVisibleMonth(
        selectedDate,
        next.getFullYear(),
        next.getMonth(),
        todayKey,
      ),
    );
  };

  const goToday = () => {
    const month = new Date(startOfToday().getFullYear(), startOfToday().getMonth(), 1);
    setVisibleMonth(month);
    setSelectedDate(todayKey);
  };

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
          completionsByDate={completionsByDate}
          onSelectDate={setSelectedDate}
          onChangeMonth={changeMonth}
          onPressToday={goToday}
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

      {booksFailed ? (
        <Text style={styles.note}>완독 표지를 불러오지 못했어요. 독서 기록은 그대로 볼 수 있어요.</Text>
      ) : null}

      <SectionHeader title={formatKoreanDateKey(selectedDate)} />
      {source.status === 'loading' ? (
        <EmptyState title="이 날의 기록을 불러오는 중이에요" />
      ) : history === null || selected === null ? (
        <EmptyState
          title={
            source.status === 'error' ? '이 날의 기록을 확인하지 못했습니다' : '이 날의 기록을 불러올 수 없습니다'
          }
          description={source.status === 'error' ? source.message : '잠시 후 다시 시도해 주세요.'}
        />
      ) : (
        <SelectedDay
          day={selected.day}
          sessions={selected.sessions}
          completions={selectedCompletions}
          onOpenSession={setDetailSession}
          onOpenBook={(userBookId) => router.push(`/book/${userBookId}`)}
        />
      )}

      <SheetModal
        visible={detailSession !== null}
        title="독서 세션"
        onClose={() => setDetailSession(null)}
      >
        {detailSession ? <SessionDetailBody session={detailSession} /> : null}
      </SheetModal>
    </Screen>
  );
}

function selectedDayGoalLabel(day: DayReadingState): string {
  const achievement: DayAchievement = day.achievement;
  switch (achievement) {
    case 'missed':
      return '목표 미달성';
    case 'achieved':
      return '목표 달성';
    case 'exceeded':
      return '목표 초과 달성';
    case 'pending':
      return day.isToday ? '오늘 목표 진행 중' : '목표 진행';
    case 'off':
      return '독서 휴식일';
    case 'none':
      return '설정된 목표 없음';
    case 'unknown':
      return '목표 달성 여부 집계 불가';
    case 'upcoming':
      return '미래 날짜';
    default:
      return '기록 없음';
  }
}

function SelectedDay({
  day,
  sessions,
  completions,
  onOpenSession,
  onOpenBook,
}: {
  day: DayReadingState;
  sessions: ReadingActivity[];
  completions: CalendarCompletedBook[];
  onOpenSession: (session: ReadingActivity) => void;
  onOpenBook: (userBookId: string) => void;
}) {
  return (
    <View style={styles.dayStack}>
      <View style={styles.dayCard}>
        <Text style={styles.dayStatus}>{selectedDayGoalLabel(day)}</Text>
        <Text style={styles.note}>
          {formatDuration(day.durationSeconds)}
          {day.pagesRead === null
            ? day.hasReading
              ? ' · 페이지 확인 불가'
              : ''
            : ` · ${day.pagesRead}페이지`}
          {sessions.length > 0 ? ` · 세션 ${sessions.length}회` : ''}
        </Text>
      </View>

      {completions.length > 0 ? (
        <View style={styles.completedBlock}>
          <Text style={styles.completedTitle}>이날 완독한 책</Text>
          {completions.map((book) => (
            <Pressable
              key={book.userBookId}
              accessibilityRole="button"
              accessibilityLabel={`${book.title} 상세 보기`}
              onPress={() => onOpenBook(book.userBookId)}
              style={({ pressed }) => [styles.completedRow, pressed && styles.pressed]}
            >
              <BookCover
                title={book.title}
                color={book.coverColor || colors.surfaceMuted}
                imageUrl={book.coverImageUrl}
                width={48}
              />
              <View style={styles.sessionBody}>
                <Text style={styles.sessionTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                {book.author ? (
                  <Text style={styles.note} numberOfLines={1}>
                    {book.author}
                  </Text>
                ) : null}
                <Text style={styles.note}>완독</Text>
              </View>
              <AppIcon name="chevronRight" color={colors.accent} size={18} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.dayCard}>
        {sessions.length === 0 ? (
          <Text style={styles.note}>이날의 독서 기록이 없어요.</Text>
        ) : (
          sessions.map((session, index) => {
            const key = session.sessionId ?? `${session.readOn}-${session.bookTitle ?? 'book'}-${index}`;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={`${session.bookTitle ?? '책'} 세션 상세`}
                onPress={() => onOpenSession(session)}
                style={({ pressed }) => [
                  styles.sessionRow,
                  index > 0 && styles.sessionRowBorder,
                  pressed && styles.pressed,
                ]}
              >
                <BookCover
                  title={session.bookTitle ?? '책'}
                  color={session.coverColor ?? colors.surfaceMuted}
                  imageUrl={session.coverImageUrl ?? undefined}
                  width={44}
                />
                <View style={styles.sessionBody}>
                  <Text style={styles.sessionTitle} numberOfLines={2}>
                    {session.bookTitle ?? '책 정보 없음'}
                  </Text>
                  {session.author ? (
                    <Text style={styles.note} numberOfLines={1}>
                      {session.author}
                    </Text>
                  ) : null}
                  <Text style={styles.note}>
                    {formatDuration(session.durationSeconds)}
                    {session.pagesRead === null
                      ? ' · 페이지 미기록'
                      : ` · ${session.pagesRead}페이지`}
                  </Text>
                </View>
                {session.userBookId ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="책 상세 보기"
                    hitSlop={8}
                    onPress={() => onOpenBook(session.userBookId as string)}
                    style={styles.bookLink}
                  >
                    <Text style={styles.bookLinkText}>책</Text>
                  </Pressable>
                ) : null}
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

function SessionDetailBody({ session }: { session: ReadingActivity }) {
  const startClock = formatLocalClock(session.startedAt);
  const endClock = formatLocalClock(session.endedAt);

  return (
    <View style={styles.detailBody}>
      <View style={styles.detailHero}>
        <BookCover
          title={session.bookTitle ?? '책'}
          color={session.coverColor ?? colors.surfaceMuted}
          imageUrl={session.coverImageUrl ?? undefined}
          width={64}
        />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={styles.sessionTitle}>{session.bookTitle ?? '책 정보 없음'}</Text>
          {session.author ? <Text style={styles.note}>{session.author}</Text> : null}
        </View>
      </View>
      <DetailLine label="독서 시간" value={formatDuration(session.durationSeconds)} />
      <DetailLine
        label="읽은 페이지"
        value={session.pagesRead === null ? '미기록' : `${session.pagesRead}페이지`}
      />
      {session.startPage !== undefined ? (
        <DetailLine
          label="시작·종료 페이지"
          value={
            session.endPage === null || session.endPage === undefined
              ? `${session.startPage}p ~`
              : `${session.startPage}p ~ ${session.endPage}p`
          }
        />
      ) : null}
      {startClock || endClock ? (
        <DetailLine
          label="시작·종료 시각"
          value={[startClock || '미기록', endClock || '미기록'].join(' → ')}
        />
      ) : null}
      {session.focusExitCount !== undefined ? (
        <DetailLine label="집중 이탈" value={`${session.focusExitCount}회`} />
      ) : null}
      {session.userBookId ? (
        <PrimaryButton
          label="책 상세 보기"
          onPress={() => {
            router.push(`/book/${session.userBookId}`);
          }}
        />
      ) : null}
    </View>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
  dayStack: {
    gap: spacing.md,
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
  completedBlock: {
    ...card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  completedTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  sessionRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  sessionBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sessionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  bookLink: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookLinkText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  detailBody: {
    gap: spacing.md,
  },
  detailHero: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  detailLine: {
    gap: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.bodyStrong,
    color: colors.text,
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

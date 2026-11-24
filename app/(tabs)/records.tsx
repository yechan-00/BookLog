import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { BookCover } from '@/components/books/BookCover';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { SheetModal } from '@/components/common/SheetModal';
import { MonthCalendar } from '@/components/reading/MonthCalendar';
import { ReadingStatCard } from '@/components/reading/ReadingStatCard';
import { WeekAchievementCard } from '@/components/reading/WeekAchievementCard';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { useFocusData } from '@/hooks/useFocusData';
import { startOfToday, toDateKey } from '@/utils/date';
import {
  formatDuration,
  formatKoreanDateKey,
  formatLocalClock,
  formatMonthTitle,
} from '@/utils/format';
import { buildMonthMarks } from '@/utils/readingCalendar';
import {
  achievementLabel,
  type ReadingActivity,
} from '@/utils/readingPeriod';
import { loadLibraryBooks, loadReadingHistory } from '@/utils/readingSource';
import { readingStreak } from '@/utils/readingStreak';
import {
  daySessionSummary,
  formatMonthEmptyMessage,
  monthHasAnyReading,
  monthReadingStats,
  selectionForVisibleMonth,
} from '@/utils/recordsMonth';
import { weeklyAchievement } from '@/utils/weeklyAchievement';

export default function RecordsScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 360;
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

  const monthly = useMemo(() => {
    if (!history) {
      return null;
    }
    const books = booksSource.status === 'ready' ? booksSource.data : [];
    return monthReadingStats(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      todayKey,
      history.goals,
      history.activities,
      books,
    );
  }, [booksSource, history, todayKey, visibleMonth]);

  const weekly = history ? weeklyAchievement(todayKey, history.goals, history.activities) : null;
  const streak = history ? readingStreak(todayKey, history.goals, history.activities) : null;

  const selected = history
    ? daySessionSummary(selectedDate, todayKey, history.goals, history.activities)
    : null;

  const monthEmpty =
    history !== null &&
    !monthHasAnyReading(visibleMonth.getFullYear(), visibleMonth.getMonth(), history.activities);

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

      <SectionHeader title={`${formatMonthTitle(visibleMonth)} 통계`} />
      {source.status === 'loading' ? (
        <EmptyState title="월별 통계를 불러오는 중이에요" />
      ) : source.status === 'error' ? (
        <EmptyState title="월별 통계를 확인하지 못했습니다" description={source.message} />
      ) : monthly ? (
        monthEmpty ? (
          <EmptyState
            title={formatMonthEmptyMessage(
              visibleMonth.getFullYear(),
              visibleMonth.getMonth(),
              todayKey,
            )}
          />
        ) : (
          <MonthStatsCard stats={monthly} compact={compact} />
        )
      ) : (
        <EmptyState title="월별 통계를 불러올 수 없습니다" />
      )}

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
          onOpenSession={setDetailSession}
          onOpenBook={(userBookId) => router.push(`/book/${userBookId}`)}
        />
      )}

      <SectionHeader title="이번 주 달성률" />
      <Text style={styles.periodHint}>이번 주(월~일) · 오늘 기준</Text>
      {weekly ? (
        <WeekAchievementCard result={weekly} />
      ) : (
        <EmptyState
          title={
            source.status === 'error'
              ? '이번 주 달성률을 확인하지 못했습니다'
              : source.status === 'loading'
                ? '이번 주 달성률을 불러오는 중이에요'
                : '이번 주 달성률을 불러올 수 없습니다'
          }
          description={source.status === 'error' ? source.message : '목표 이력과 날짜별 세션이 있어야 계산합니다.'}
        />
      )}

      <SectionHeader title="연속 목표 달성일" />
      <Text style={styles.periodHint}>오늘 기준 · 표시 중인 달과 무관</Text>
      {streak ? (
        <View style={styles.streak}>
          <ReadingStatCard label="목표 요일 기준" value={`${streak.days}일`} />
          <Text style={styles.note}>목표 요일만 셉니다. 오늘은 하루가 끝나기 전에 끊지 않습니다.</Text>
        </View>
      ) : (
        <EmptyState
          title={
            source.status === 'error'
              ? '연속 달성일을 확인하지 못했습니다'
              : source.status === 'loading'
                ? '연속 달성일을 불러오는 중이에요'
                : '연속 달성일을 불러올 수 없습니다'
          }
          description={source.status === 'error' ? source.message : '목표 이력과 날짜별 세션이 있어야 계산합니다.'}
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

function MonthStatsCard({
  stats,
  compact,
}: {
  stats: NonNullable<ReturnType<typeof monthReadingStats>>;
  compact: boolean;
}) {
  const pagesLabel =
    stats.sessionCount === 0
      ? '—'
      : stats.unknownPageSessionCount === stats.sessionCount
        ? '미기록'
        : stats.unknownPageSessionCount > 0
          ? `${stats.knownPagesSum}p · 일부 미기록`
          : `${stats.knownPagesSum}p`;

  const rateLabel =
    stats.achievement.rate === null
      ? '—'
      : `${stats.achievement.rate}% (${stats.achievement.achievedCount}/${stats.achievement.decidedCount})`;

  const completedLabel =
    stats.completedBookCount === null ? '집계 불가' : `${stats.completedBookCount}권`;

  return (
    <View style={[styles.monthStats, compact && styles.monthStatsCompact]}>
      <StatChip label="총 독서 시간" value={formatDuration(stats.totalDurationSeconds)} />
      <StatChip label="독서한 날" value={`${stats.readingDayCount}일`} />
      <StatChip label="세션" value={`${stats.sessionCount}회`} />
      <StatChip label="읽은 페이지" value={pagesLabel} />
      <StatChip label="목표 달성" value={rateLabel} />
      <StatChip label="완독" value={completedLabel} />
    </View>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function SelectedDay({
  day,
  sessions,
  onOpenSession,
  onOpenBook,
}: {
  day: NonNullable<ReturnType<typeof daySessionSummary>>['day'];
  sessions: ReadingActivity[];
  onOpenSession: (session: ReadingActivity) => void;
  onOpenBook: (userBookId: string) => void;
}) {
  return (
    <View style={styles.dayCard}>
      <Text style={styles.dayStatus}>
        {day.achievement === 'none' || day.achievement === 'off'
          ? achievementLabel(day.achievement)
          : `목표 ${achievementLabel(day.achievement)}`}
      </Text>
      <Text style={styles.note}>
        {formatDuration(day.durationSeconds)}
        {day.pagesRead === null
          ? day.hasReading
            ? ' · 페이지 확인 불가'
            : ''
          : ` · ${day.pagesRead}페이지`}
        {sessions.length > 0 ? ` · 세션 ${sessions.length}회` : ''}
      </Text>

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
              style={({ pressed }) => [styles.sessionRow, pressed && styles.pressed]}
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
  monthStats: {
    ...card,
    padding: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  monthStatsCompact: {
    gap: spacing.sm,
  },
  statChip: {
    width: '47%',
    flexGrow: 1,
    gap: 2,
    minWidth: 0,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.bodyStrong,
    color: colors.text,
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
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
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
  streak: {
    gap: spacing.sm,
  },
  periodHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.sm,
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

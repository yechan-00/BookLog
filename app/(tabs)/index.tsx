import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCover } from '@/components/books/BookCover';
import { AppIcon } from '@/components/common/AppIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { GoalCard } from '@/components/goals/GoalCard';
import { ReadingSessionCard } from '@/components/reading/ReadingSessionCard';
import { ReadingStatCard } from '@/components/reading/ReadingStatCard';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { getHomeSnapshot } from '@/data/selectors';
import { clampPercent, formatDuration, formatKoreanDate } from '@/utils/format';
import { startOfToday } from '@/utils/date';

export default function HomeScreen() {
  const snapshot = getHomeSnapshot();
  const book = snapshot.currentBook;

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
        <View style={styles.bookCard}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/book/${book.id}`)}
            style={styles.bookRow}
          >
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
            onPress={() =>
              router.push({ pathname: '/reading/session', params: { bookId: book.id } })
            }
          />
        </View>
      ) : (
        <EmptyState title="읽고 있는 책이 없어요" description="서재에서 책을 고르면 이곳에 나타납니다." />
      )}

      <SectionHeader title="오늘의 목표" />
      <GoalCard
        title={snapshot.goalTitle}
        current={snapshot.goalCurrent}
        target={snapshot.goalTarget}
        unit="페이지"
        achieved={snapshot.goalAchieved}
      />

      <SectionHeader title="오늘의 독서" />
      <View style={styles.stats}>
        <ReadingStatCard
          label="독서시간"
          value={formatDuration(snapshot.todayDurationSeconds)}
          style={styles.stat}
        />
        <ReadingStatCard label="읽은 페이지" value={`${snapshot.todayPages}p`} style={styles.stat} />
        <ReadingStatCard label="연속 독서" value={`${snapshot.streakDays}일`} style={styles.stat} />
      </View>

      <SectionHeader title="최근 기록" />
      {snapshot.recentSessions.length === 0 ? (
        <EmptyState title="아직 독서 기록이 없어요" />
      ) : (
        snapshot.recentSessions.map((session) => (
          <ReadingSessionCard
            key={session.id}
            session={session}
            onPress={() => router.push(`/book/${session.bookId}`)}
          />
        ))
      )}
    </Screen>
  );
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

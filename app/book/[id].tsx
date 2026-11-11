import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BookCover } from '@/components/books/BookCover';
import { StatusBadge } from '@/components/books/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StarRating } from '@/components/common/StarRating';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { useFocusData } from '@/hooks/useFocusData';
import { fetchBookDetail } from '@/lib/api/books';
import { startReading } from '@/lib/reading/startReading';
import type { BookDetail } from '@/types/book';
import { readParam } from '@/utils/book';
import { clampPercent, formatDuration, formatKoreanDateKey } from '@/utils/format';

export default function BookDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const userBookId = readParam(params.id);

  const load = useCallback(
    () => (userBookId ? fetchBookDetail(userBookId) : Promise.reject(new Error('책 정보가 없습니다.'))),
    [userBookId],
  );
  const state = useFocusData(load);

  if (state.status !== 'ready') {
    return (
      <>
        <Stack.Screen options={{ title: '책 상세' }} />
        <Screen includeBottomInset>
          {state.status === 'loading' ? (
            <EmptyState title="불러오는 중이에요" />
          ) : (
            <>
              <EmptyState title="책을 불러오지 못했어요" description={state.message} />
              <PrimaryButton label="다시 시도" onPress={state.reload} />
            </>
          )}
        </Screen>
      </>
    );
  }

  return <BookDetailContent detail={state.data} />;
}

function BookDetailContent({ detail }: { detail: BookDetail }) {
  const { book, sessions, indexes, review, totalDurationSeconds } = detail;
  // A shelved book starts as 'wishlist' and becomes 'reading' when its first session is saved.
  const canRead = book.status !== 'completed';
  const oneLineReviews = sessions
    .map((session) => ({ id: session.id, text: session.oneLineReview }))
    .filter((item): item is { id: string; text: string } => Boolean(item.text));

  return (
    <>
      <Stack.Screen options={{ title: book.title }} />
      <Screen includeBottomInset>
        <View style={styles.hero}>
          <BookCover title={book.title} color={book.coverColor} width={92} imageUrl={book.coverImageUrl} />
          <View style={styles.heroBody}>
            <StatusBadge status={book.status} />
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>{book.author}</Text>
          </View>
        </View>

        {book.status !== 'wishlist' ? (
          <View style={styles.panel}>
            <Text style={styles.meta}>
              {book.currentPage} / {book.totalPages}페이지 · {clampPercent(book.currentPage, book.totalPages)}%
            </Text>
            <ProgressBar current={book.currentPage} total={book.totalPages} />
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.meta}>읽고 싶은 책으로 남겨 두었어요.</Text>
            <Text style={styles.meta}>{book.totalPages}페이지</Text>
          </View>
        )}

        <View style={styles.facts}>
          <Fact label="시작" value={book.startedAt ? formatKoreanDateKey(book.startedAt) : '아직 없음'} />
          <Fact
            label="마지막 독서"
            value={book.lastReadAt ? formatKoreanDateKey(book.lastReadAt) : '아직 없음'}
          />
          <Fact
            label="완독일"
            value={book.completedAt ? formatKoreanDateKey(book.completedAt) : '아직 없음'}
          />
        </View>

        {canRead ? (
          <View style={styles.actions}>
            <PrimaryButton label="독서 시작" onPress={() => startReading(book.userBookId, book.currentPage)} />
            {/* TODO(READ-05): 완독하기 버튼은 완독 처리를 실데이터로 연결할 때 다시 추가한다. 지금 화면은 mock 기반이다. */}
          </View>
        ) : null}

        {book.status === 'completed' ? (
          <>
            <SectionHeader title="완독 기록" />
            <View style={styles.panel}>
              <Fact
                label="독서 기간"
                value={
                  book.startedAt && book.completedAt
                    ? `${formatKoreanDateKey(book.startedAt)} – ${formatKoreanDateKey(book.completedAt)}`
                    : '기록 없음'
                }
              />
              <Fact label="총 독서시간" value={formatDuration(totalDurationSeconds)} />
              <Fact label="총 페이지" value={`${book.currentPage}페이지`} />
              <View style={styles.block}>
                <Text style={styles.factLabel}>별점</Text>
                <StarRating value={review?.rating ?? 0} />
              </View>
              <View style={styles.block}>
                <Text style={styles.factLabel}>총평</Text>
                <Text style={styles.body}>{review?.review || '총평이 아직 없어요.'}</Text>
              </View>
            </View>
          </>
        ) : null}

        <SectionHeader title="한줄평" />
        {oneLineReviews.length === 0 ? (
          <EmptyState title="남긴 한줄평이 없어요" />
        ) : (
          oneLineReviews.map((item) => (
            <View key={item.id} style={styles.panel}>
              <Text style={styles.body}>{item.text}</Text>
            </View>
          ))
        )}

        <SectionHeader title="인덱스" />
        {indexes.length === 0 ? (
          <EmptyState title="저장한 인덱스가 없어요" description="독서 중에 기억하고 싶은 페이지와 제목을 남길 수 있습니다." />
        ) : (
          indexes.map((index) => (
            <View key={index.id} style={styles.panel}>
              <Text style={styles.factLabel}>p.{index.page}</Text>
              <Text style={styles.quote}>{index.title}</Text>
              {index.quote ? <Text style={styles.meta}>{index.quote}</Text> : null}
            </View>
          ))
        )}
      </Screen>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  heroBody: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  author: {
    ...typography.body,
    color: colors.textSecondary,
  },
  panel: {
    ...card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  facts: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fact: {
    ...card,
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  factLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  factValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  actions: {
    gap: spacing.sm,
  },
  block: {
    gap: 6,
  },
  body: {
    ...typography.body,
    color: colors.text,
  },
  quote: {
    ...typography.bodyStrong,
    color: colors.text,
  },
});

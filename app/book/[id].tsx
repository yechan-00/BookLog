import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

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
import { fetchBookDetail, updateUserBookStatus } from '@/lib/api/books';
import { beginReadingSession } from '@/lib/reading/activeSession';
import type { BookDetail, BookStatus } from '@/types/book';
import { bookStatusLabel, readParam } from '@/utils/book';
import { planBookStatusChange, statusChangeOptions } from '@/utils/bookStatus';
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

  return <BookDetailContent detail={state.data} onReload={state.reload} />;
}

function startReading(userBookId: string, currentPage: number) {
  const result = beginReadingSession(userBookId, currentPage);

  if (result.kind === 'busy') {
    Alert.alert('이미 진행 중인 독서가 있어요', '진행 중인 독서를 먼저 마쳐 주세요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '진행 중인 독서로 이동',
        onPress: () =>
          router.push({ pathname: '/reading/session', params: { userBookId: result.userBookId } }),
      },
    ]);
    return;
  }

  router.push({ pathname: '/reading/session', params: { userBookId } });
}

function BookDetailContent({
  detail,
  onReload,
}: {
  detail: BookDetail;
  onReload: () => void;
}) {
  const { book, sessions, indexes, review, totalDurationSeconds } = detail;
  // A shelved book starts as 'wishlist' and becomes 'reading' when its first session is saved.
  const canRead = book.status !== 'completed';
  const [statusBusy, setStatusBusy] = useState(false);
  const statusRequestRef = useRef(0);
  const oneLineReviews = sessions
    .map((session) => ({ id: session.id, text: session.oneLineReview }))
    .filter((item): item is { id: string; text: string } => Boolean(item.text));

  const openStatusPicker = () => {
    if (statusBusy) {
      return;
    }

    const buttons = statusChangeOptions(book.status).flatMap((status) => {
      const plan = planBookStatusChange(book.status, status);
      if (plan.kind === 'complete_flow') {
        return [
          {
            text: '완독 처리…',
            onPress: () =>
              router.push({ pathname: '/book/complete', params: { userBookId: book.userBookId } }),
          },
        ];
      }
      if (plan.kind !== 'update') {
        return [];
      }
      return [
        {
          text: bookStatusLabel[plan.next],
          onPress: () => {
            void applyStatus(plan.next);
          },
        },
      ];
    });

    Alert.alert('독서 상태', undefined, [...buttons, { text: '취소', style: 'cancel' }]);
  };

  const applyStatus = async (next: Exclude<BookStatus, 'completed'>) => {
    if (statusBusy) {
      return;
    }

    const requestId = ++statusRequestRef.current;
    setStatusBusy(true);
    try {
      await updateUserBookStatus(book.userBookId, next);
      if (requestId !== statusRequestRef.current) {
        return;
      }
      onReload();
    } catch (error) {
      if (requestId !== statusRequestRef.current) {
        return;
      }
      Alert.alert(
        '상태를 바꾸지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      if (requestId === statusRequestRef.current) {
        setStatusBusy(false);
      }
    }
  };

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
            <PrimaryButton
              label="상태 변경"
              variant="secondary"
              onPress={openStatusPicker}
              disabled={statusBusy}
              loading={statusBusy}
            />
            <PrimaryButton
              label="완독하기"
              variant="secondary"
              onPress={() =>
                router.push({ pathname: '/book/complete', params: { userBookId: book.userBookId } })
              }
              disabled={statusBusy}
            />
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

import { router, Stack, useLocalSearchParams } from 'expo-router';
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
import { getBookSummary } from '@/data/selectors';
import { readParam } from '@/utils/book';
import { clampPercent, formatDuration, formatKoreanDateKey } from '@/utils/format';

export default function BookDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const bookId = readParam(params.id);
  const summary = bookId ? getBookSummary(bookId) : null;

  if (!summary) {
    return (
      <>
        <Stack.Screen options={{ title: '책 상세' }} />
        <Screen includeBottomInset>
          <EmptyState title="책을 찾지 못했어요" />
        </Screen>
      </>
    );
  }

  const { book, sessions, notes, indexes, review, totalDurationSeconds } = summary;
  const canRead = book.status === 'reading' || book.status === 'paused';
  const oneLineReviews = sessions
    .map((session) => session.oneLineReview)
    .filter((reviewText): reviewText is string => Boolean(reviewText));

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
            <PrimaryButton
              label="독서 시작"
              onPress={() => router.push({ pathname: '/reading/session', params: { bookId: book.id } })}
            />
            {book.status === 'reading' ? (
              <PrimaryButton
                label="완독하기"
                variant="secondary"
                onPress={() => router.push({ pathname: '/book/complete', params: { bookId: book.id } })}
              />
            ) : null}
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
                <StarRating value={review?.rating ?? book.rating ?? 0} />
              </View>
              <View style={styles.block}>
                <Text style={styles.factLabel}>총평</Text>
                <Text style={styles.body}>{review?.review ?? '총평이 아직 없어요.'}</Text>
              </View>
            </View>
          </>
        ) : null}

        <SectionHeader title="한줄평" />
        {oneLineReviews.length === 0 ? (
          <EmptyState title="남긴 한줄평이 없어요" />
        ) : (
          oneLineReviews.map((text) => (
            <View key={text} style={styles.panel}>
              <Text style={styles.body}>{text}</Text>
            </View>
          ))
        )}

        <SectionHeader title="노트" />
        {notes.length === 0 ? (
          <EmptyState title="노트가 없어요" />
        ) : (
          notes.map((note) => (
            <View key={note.id} style={styles.panel}>
              {note.page ? <Text style={styles.factLabel}>{note.page}페이지</Text> : null}
              <Text style={styles.body}>{note.content}</Text>
            </View>
          ))
        )}

        <SectionHeader title="인덱스" />
        {indexes.length === 0 ? (
          <EmptyState title="저장한 문장이 없어요" description="독서 중에 기억하고 싶은 문장을 남길 수 있습니다." />
        ) : (
          indexes.map((index) => (
            <View key={index.id} style={styles.panel}>
              <Text style={styles.factLabel}>p.{index.page}</Text>
              <Text style={styles.quote}>{index.quote}</Text>
              {index.memo ? <Text style={styles.meta}>메모 · {index.memo}</Text> : null}
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

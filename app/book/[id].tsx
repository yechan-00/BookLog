import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCover } from '@/components/books/BookCover';
import { StatusBadge } from '@/components/books/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StarRating } from '@/components/common/StarRating';
import { IndexFormModal, type DraftIndex } from '@/components/reading/IndexFormModal';
import { colors } from '@/constants/colors';
import { card, radius, spacing, typography } from '@/constants/theme';
import { useFocusData } from '@/hooks/useFocusData';
import { deleteUserBook, fetchBookDetail, updateBookStatus } from '@/lib/api/books';
import { addIndex, deleteIndex } from '@/lib/api/indexes';
import { deleteSession } from '@/lib/api/sessions';
import { loadActiveSession } from '@/lib/reading/activeSession';
import { refreshEngagementReminder } from '@/lib/reading/reminders';
import { startReading } from '@/lib/reading/startReading';
import type { BookDetail, BookStatus } from '@/types/book';
import { bookStatusLabel, readParam } from '@/utils/book';
import { nextStatuses } from '@/utils/bookStatus';
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

  return <BookDetailContent detail={state.data} onChanged={state.refresh} />;
}

function BookDetailContent({ detail, onChanged }: { detail: BookDetail; onChanged: () => void }) {
  const [indexOpen, setIndexOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const { book, sessions, indexes, review, totalDurationSeconds } = detail;
  // A shelved book starts as 'wishlist' and becomes 'reading' when its first session is saved.
  const canRead = book.status !== 'completed';

  const handleSaveIndex = async (draft: DraftIndex) => {
    try {
      await addIndex({ userBookId: book.userBookId, ...draft });
      setActionError('');
      onChanged();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '인덱스를 저장하지 못했습니다.');
    }
  };

  const confirmDelete = (title: string, message: string, onConfirm: () => void) => {
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: onConfirm },
    ]);
  };

  const runAction = async (action: () => Promise<void>, fallbackMessage: string) => {
    try {
      await action();
      setActionError('');
      onChanged();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : fallbackMessage);
    }
  };

  const changeStatus = (to: BookStatus) => {
    if (loadActiveSession()?.userBookId === book.userBookId) {
      setActionError('진행 중인 독서가 있어요. 먼저 독서를 종료한 뒤 상태를 바꿔 주세요.');
      return;
    }

    if (to === 'completed') {
      router.push({ pathname: '/book/complete', params: { userBookId: book.userBookId } });
      return;
    }

    const apply = () => {
      void runAction(() => updateBookStatus(book.userBookId, book.status, to), '상태를 바꾸지 못했습니다.');
    };

    if (book.status === 'completed') {
      Alert.alert(
        "'읽고 싶음'으로 되돌릴까요?",
        '진행률이 0으로 돌아가고 완독일이 지워져요. 지난 독서 기록과 인덱스는 그대로 남아요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '되돌리기', onPress: apply },
        ],
      );
      return;
    }

    apply();
  };

  const handleDeleteIndex = (indexId: string) =>
    confirmDelete('인덱스를 삭제할까요?', '삭제한 인덱스는 되돌릴 수 없어요.', () => {
      void runAction(() => deleteIndex(indexId), '인덱스를 삭제하지 못했습니다.');
    });

  const handleDeleteSession = (sessionId: string) =>
    confirmDelete(
      '이 독서 기록을 삭제할까요?',
      '읽은 시간과 페이지가 달성률과 연속 독서일에서도 빠져요. 되돌릴 수 없어요.',
      () => {
        void runAction(async () => {
          await deleteSession(sessionId, book.userBookId);
          // Today's goal may no longer be met, so the reminder has to be rebuilt.
          void refreshEngagementReminder();
        }, '독서 기록을 삭제하지 못했습니다.');
      },
    );

  const handleDeleteBook = () => {
    if (loadActiveSession()?.userBookId === book.userBookId) {
      setActionError('진행 중인 독서가 있어요. 먼저 독서를 종료한 뒤 삭제해 주세요.');
      return;
    }

    confirmDelete(
      '서재에서 책을 삭제할까요?',
      '독서 기록, 인덱스, 완독 기록이 모두 함께 삭제돼요. 되돌릴 수 없어요. 잠시 쉬고 싶다면 상태를 임시 중단으로 바꿔 주세요.',
      () => {
        void (async () => {
          try {
            await deleteUserBook(book.userBookId);
          } catch (error) {
            setActionError(error instanceof Error ? error.message : '책을 삭제하지 못했습니다.');
            return;
          }

          void refreshEngagementReminder();
          router.dismissTo('/(tabs)/library');
        })();
      },
    );
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

        <View style={styles.panel}>
          <Text style={styles.factLabel}>상태 변경</Text>
          <View style={styles.choices}>
            {nextStatuses(book.status).map((status) => (
              <Pressable
                key={status}
                accessibilityRole="button"
                accessibilityLabel={`${bookStatusLabel[status]}(으)로 바꾸기`}
                onPress={() => changeStatus(status)}
                style={styles.chip}
              >
                <Text style={styles.chipLabel}>{bookStatusLabel[status]}</Text>
              </Pressable>
            ))}
          </View>
          {book.status === 'reading' ? (
            <Text style={styles.meta}>읽는 중인 책은 읽고 싶음으로 바로 되돌릴 수 없어요. 임시 중단을 거쳐 주세요.</Text>
          ) : null}
        </View>

        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

        {canRead ? (
          <View style={styles.actions}>
            <PrimaryButton
              label="집중 독서 시작"
              onPress={() => startReading(book.userBookId, book.currentPage, book.status)}
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

        <SectionHeader title="독서 기록" />
        {sessions.length === 0 ? (
          <EmptyState title="아직 독서 기록이 없어요" description="독서를 마치고 저장하면 여기에 쌓여요." />
        ) : (
          sessions.map((session) => (
            <View key={session.id} style={styles.panel}>
              <View style={styles.rowBetween}>
                <Text style={styles.factLabel}>
                  {formatKoreanDateKey(session.date)} · {formatDuration(session.duration)} · {session.startPage}p →{' '}
                  {session.endPage}p
                </Text>
                <DeleteButton label="독서 기록 삭제" onPress={() => handleDeleteSession(session.id)} />
              </View>
              {session.oneLineReview ? <Text style={styles.body}>{session.oneLineReview}</Text> : null}
            </View>
          ))
        )}

        <SectionHeader title="인덱스" />
        <PrimaryButton label="인덱스 추가" variant="secondary" onPress={() => setIndexOpen(true)} />
        {indexes.length === 0 ? (
          <EmptyState title="저장한 인덱스가 없어요" description="독서 중에 기억하고 싶은 페이지와 제목을 남길 수 있습니다." />
        ) : (
          indexes.map((index) => (
            <View key={index.id} style={styles.panel}>
              <View style={styles.rowBetween}>
                <Text style={styles.factLabel}>p.{index.page}</Text>
                <DeleteButton label="인덱스 삭제" onPress={() => handleDeleteIndex(index.id)} />
              </View>
              <Text style={styles.quote}>{index.title}</Text>
              {index.quote ? <Text style={styles.meta}>{index.quote}</Text> : null}
            </View>
          ))
        )}

        <SectionHeader title="서재 관리" />
        <PrimaryButton label="서재에서 삭제" variant="secondary" onPress={handleDeleteBook} />
      </Screen>

      {indexOpen ? (
        <IndexFormModal
          visible
          initialPage={book.currentPage}
          onClose={() => setIndexOpen(false)}
          onSave={handleSaveIndex}
        />
      ) : null}
    </>
  );
}

function DeleteButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.deleteButton}>
      <Text style={styles.deleteLabel}>삭제</Text>
    </Pressable>
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
  error: {
    ...typography.caption,
    color: colors.warning,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  deleteButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
  },
});

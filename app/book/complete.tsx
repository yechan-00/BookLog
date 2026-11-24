import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { StarRating } from '@/components/common/StarRating';
import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { useFocusData } from '@/hooks/useFocusData';
import { completeBook, fetchLibraryBook } from '@/lib/api/books';
import { readParam } from '@/utils/book';
import { startOfToday, toDateKey } from '@/utils/date';
import { formatKoreanDate } from '@/utils/format';

export default function CompleteBookScreen() {
  const params = useLocalSearchParams<{ userBookId?: string; bookId?: string }>();
  const userBookId = readParam(params.userBookId) ?? readParam(params.bookId);
  const load = useCallback(
    () => (userBookId ? fetchLibraryBook(userBookId) : Promise.reject(new Error('책 정보가 없습니다.'))),
    [userBookId],
  );
  const state = useFocusData(load);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savingRef = useRef(false);

  if (state.status !== 'ready') {
    return (
      <>
        <Stack.Screen options={{ title: '완독하기' }} />
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

  const book = state.data;
  const canSave = rating > 0 && review.trim().length > 0 && !saved && !isSaving;

  const handleSave = async () => {
    if (savingRef.current || !canSave || !userBookId) {
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    setSaveError(null);

    try {
      await completeBook({
        userBookId,
        rating,
        content: review,
        completedOn: toDateKey(startOfToday()),
      });
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '완독 기록을 저장하지 못했습니다.');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '완독하기' }} />
      <Screen includeBottomInset>
        <View style={styles.header}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.subtitle}>{book.author}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.label}>완독 날짜</Text>
          <Text style={styles.value}>{formatKoreanDate(startOfToday())}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.label}>별점</Text>
          <StarRating value={rating} onChange={saved ? undefined : setRating} />
        </View>

        <TextField
          label="총평"
          value={review}
          onChangeText={setReview}
          placeholder="이 책을 덮으며 남는 생각"
          multiline
          editable={!saved && !isSaving}
        />

        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

        {saved ? (
          <View style={styles.panel}>
            <Text style={styles.saved}>완독 기록을 저장했어요.</Text>
            <Text style={styles.summary}>
              별점 {rating} · {review.trim()}
            </Text>
          </View>
        ) : null}

        {saved ? (
          <PrimaryButton
            label="책 상세로"
            onPress={() => router.replace({ pathname: '/book/[id]', params: { id: book.userBookId } })}
          />
        ) : (
          <PrimaryButton
            label={isSaving ? '저장 중…' : '저장'}
            onPress={() => {
              void handleSave();
            }}
            disabled={!canSave}
            loading={isSaving}
          />
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  panel: {
    ...card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  saved: {
    ...typography.bodyStrong,
    color: colors.positive,
  },
  summary: {
    ...typography.body,
    color: colors.text,
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
});

import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { StarRating } from '@/components/common/StarRating';
import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { useFocusData } from '@/hooks/useFocusData';
import { fetchLibraryBook } from '@/lib/api/books';
import { completeBook } from '@/lib/api/reviews';
import type { LibraryBook } from '@/types/book';
import { readParam } from '@/utils/book';
import { startOfToday } from '@/utils/date';
import { formatKoreanDate } from '@/utils/format';

export default function CompleteBookScreen() {
  const params = useLocalSearchParams<{ userBookId?: string }>();
  const userBookId = readParam(params.userBookId);

  const load = useCallback(
    () => (userBookId ? fetchLibraryBook(userBookId) : Promise.reject(new Error('책 정보가 없습니다.'))),
    [userBookId],
  );
  const state = useFocusData(load);

  if (state.status === 'loading') {
    return (
      <CompleteShell>
        <EmptyState title="불러오는 중이에요" />
      </CompleteShell>
    );
  }

  if (state.status === 'error') {
    return (
      <CompleteShell>
        <EmptyState title="책 정보를 불러오지 못했어요" description={state.message} />
        <PrimaryButton label="다시 시도" onPress={state.reload} />
      </CompleteShell>
    );
  }

  if (state.data.status === 'completed') {
    return (
      <CompleteShell>
        <EmptyState title="이미 완독한 책이에요" description="완독한 책을 다시 읽는 기능은 아직 지원하지 않아요." />
        <PrimaryButton label="돌아가기" variant="secondary" onPress={() => router.back()} />
      </CompleteShell>
    );
  }

  return <CompleteForm book={state.data} />;
}

function CompleteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Stack.Screen options={{ title: '완독하기' }} />
      <Screen includeBottomInset>{children}</Screen>
    </>
  );
}

function CompleteForm({ book }: { book: LibraryBook }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const canSave = rating > 0 && review.trim().length > 0 && !isSaving;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');

    try {
      await completeBook({ userBookId: book.userBookId, rating, content: review });
      router.dismissTo({ pathname: '/book/[id]', params: { id: book.userBookId } });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '완독 기록을 저장하지 못했습니다.');
      setIsSaving(false);
    }
  };

  return (
    <CompleteShell>
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
        <StarRating value={rating} onChange={isSaving ? undefined : setRating} />
      </View>

      <TextField
        label="총평"
        value={review}
        onChangeText={setReview}
        placeholder="이 책을 덮으며 남는 생각"
        multiline
        editable={!isSaving}
      />

      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

      <PrimaryButton
        label={isSaving ? '저장 중…' : '저장'}
        onPress={handleSave}
        disabled={!canSave}
        loading={isSaving}
      />
    </CompleteShell>
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
  error: {
    ...typography.caption,
    color: colors.warning,
  },
});

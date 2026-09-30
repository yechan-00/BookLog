import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { StarRating } from '@/components/common/StarRating';
import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { getLibraryBook } from '@/data/selectors';
import { readParam } from '@/utils/book';
import { startOfToday } from '@/utils/date';
import { formatKoreanDate } from '@/utils/format';

export default function CompleteBookScreen() {
  const params = useLocalSearchParams<{ bookId?: string }>();
  const book = getLibraryBook(readParam(params.bookId) ?? '');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [saved, setSaved] = useState(false);
  const canSave = rating > 0 && review.trim().length > 0 && !saved;

  return (
    <>
      <Stack.Screen options={{ title: '완독하기' }} />
      <Screen includeBottomInset>
        <View style={styles.header}>
          <Text style={styles.title}>{book?.title ?? '책'}</Text>
          <Text style={styles.subtitle}>{book?.author}</Text>
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
          editable={!saved}
        />

        {saved ? (
          <View style={styles.panel}>
            <Text style={styles.saved}>완독 기록을 이 화면에 남겨 두었어요.</Text>
            <Text style={styles.summary}>
              별점 {rating} · {review.trim()}
            </Text>
          </View>
        ) : null}

        <PrimaryButton label={saved ? '저장됨' : '저장'} onPress={() => setSaved(true)} disabled={!canSave} />
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
});

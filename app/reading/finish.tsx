import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { previewElapsedSeconds } from '@/data/mockReadingData';
import { getLibraryBook } from '@/data/selectors';
import { readParam } from '@/utils/book';
import { formatDuration } from '@/utils/format';

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function FinishReadingScreen() {
  const params = useLocalSearchParams<{
    bookId?: string;
    startPage?: string;
    endPage?: string;
    duration?: string;
  }>();
  const book = getLibraryBook(readParam(params.bookId) ?? '');
  const startPage = readNumber(readParam(params.startPage), book?.currentPage ?? 0);
  const initialEndPage = readNumber(readParam(params.endPage), startPage);
  const durationSeconds = readNumber(readParam(params.duration), previewElapsedSeconds);
  const [endPageText, setEndPageText] = useState(String(initialEndPage));
  const [review, setReview] = useState('');
  const [saved, setSaved] = useState(false);

  const endPage = Number(endPageText);
  const pagesRead = Number.isInteger(endPage) ? Math.max(0, endPage - startPage) : 0;
  const endPageValid = Number.isInteger(endPage) && endPage >= 0 && (!book || endPage <= book.totalPages);

  return (
    <>
      <Stack.Screen options={{ title: '독서 기록' }} />
      <Screen includeBottomInset>
        <View style={styles.summary}>
          <Text style={styles.lead}>오늘 {formatDuration(durationSeconds)} 읽었어요.</Text>
          <Text style={styles.book}>{book?.title ?? '책'}</Text>
          <Text style={styles.range}>
            {startPage}p → {endPageValid ? endPage : '–'}p
          </Text>
          <Text style={styles.pages}>{pagesRead}페이지 읽음</Text>
        </View>

        <TextField
          label="종료 페이지"
          value={endPageText}
          onChangeText={setEndPageText}
          keyboardType="number-pad"
          editable={!saved}
        />
        {!endPageValid ? <Text style={styles.error}>종료 페이지를 다시 확인해 주세요.</Text> : null}

        <TextField
          label="한줄평"
          value={review}
          onChangeText={setReview}
          placeholder="생각보다 몰입해서 읽었다."
          multiline
          editable={!saved}
        />

        {saved ? (
          <View style={styles.savedBox}>
            <Text style={styles.savedTitle}>이 화면에 기록을 남겨 두었어요.</Text>
            <Text style={styles.savedBody}>
              {formatDuration(durationSeconds)} · {startPage}p → {endPage}p · {pagesRead}페이지
            </Text>
            {review.trim() ? <Text style={styles.savedBody}>{review.trim()}</Text> : null}
          </View>
        ) : null}

        <PrimaryButton
          label={saved ? '저장됨' : '저장'}
          onPress={() => setSaved(true)}
          disabled={!endPageValid || saved}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  summary: {
    ...card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  lead: {
    ...typography.title,
    color: colors.text,
  },
  book: {
    ...typography.body,
    color: colors.textSecondary,
  },
  range: {
    ...typography.section,
    color: colors.text,
    marginTop: spacing.sm,
  },
  pages: {
    ...typography.body,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.warning,
  },
  savedBox: {
    ...card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  savedTitle: {
    ...typography.bodyStrong,
    color: colors.positive,
  },
  savedBody: {
    ...typography.body,
    color: colors.text,
  },
});

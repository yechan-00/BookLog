import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { useFocusData } from '@/hooks/useFocusData';
import { fetchLibraryBook } from '@/lib/api/books';
import { finishSession } from '@/lib/api/sessions';
import { cancelGoalReached } from '@/lib/notifications';
import { clearActiveSession, loadActiveSession } from '@/lib/reading/activeSession';
import { refreshEngagementReminder } from '@/lib/reading/reminders';
import type { LibraryBook } from '@/types/book';
import type { ActiveReadingSession } from '@/types/reading';
import { readParam } from '@/utils/book';
import { formatDuration } from '@/utils/format';

// Longer sessions are likely a timer left running, so the reader confirms the time before saving.
const LONG_SESSION_SECONDS = 3 * 60 * 60;

interface SavedSummary {
  endPage: number;
  durationSeconds: number;
  pagesRead: number;
  focusExitCount: number;
}

export default function FinishReadingScreen() {
  const params = useLocalSearchParams<{ userBookId?: string }>();
  const userBookId = readParam(params.userBookId);
  const [session] = useState<ActiveReadingSession | null>(loadActiveSession);

  const loadBook = useCallback(
    () => (userBookId ? fetchLibraryBook(userBookId) : Promise.reject(new Error('책 정보가 없습니다.'))),
    [userBookId],
  );
  const bookState = useFocusData(loadBook);

  if (!session || session.userBookId !== userBookId) {
    return (
      <FinishShell>
        <EmptyState title="종료할 독서가 없어요" description="이미 저장했거나 진행 중인 독서가 없어요." />
        <PrimaryButton label="돌아가기" variant="secondary" onPress={() => router.back()} />
      </FinishShell>
    );
  }

  if (bookState.status === 'loading') {
    return (
      <FinishShell>
        <EmptyState title="불러오는 중이에요" />
      </FinishShell>
    );
  }

  if (bookState.status === 'error') {
    return (
      <FinishShell>
        <EmptyState title="책 정보를 불러오지 못했어요" description={bookState.message} />
        <PrimaryButton label="다시 시도" onPress={bookState.reload} />
      </FinishShell>
    );
  }

  return <FinishForm book={bookState.data} session={session} />;
}

function FinishShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Stack.Screen options={{ title: '독서 기록' }} />
      <Screen includeBottomInset>{children}</Screen>
    </>
  );
}

function goToBookDetail(userBookId: string) {
  router.dismissTo({ pathname: '/book/[id]', params: { id: userBookId } });
}

function FinishForm({ book, session }: { book: LibraryBook; session: ActiveReadingSession }) {
  // Fixed when this screen opens, so the shown duration matches what gets saved.
  const [endedAt] = useState(() => new Date());
  const [endPageText, setEndPageText] = useState(String(session.startPage));
  const [review, setReview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [summary, setSummary] = useState<SavedSummary | null>(null);

  const startedAt = new Date(session.startedAt);
  const measuredSeconds = Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));
  const isLongSession = measuredSeconds > LONG_SESSION_SECONDS;
  const maxMinutes = Math.floor(measuredSeconds / 60);
  const [minutesText, setMinutesText] = useState(() => String(maxMinutes));
  const minutes = Number(minutesText);
  const minutesValid =
    !isLongSession ||
    (minutesText.trim() !== '' && Number.isInteger(minutes) && minutes >= 1 && minutes <= maxMinutes);
  const durationSeconds = isLongSession && minutesValid ? minutes * 60 : measuredSeconds;
  // The DB derives the duration from the two timestamps, so a corrected time moves the end time.
  const savedEndedAt = isLongSession ? new Date(startedAt.getTime() + durationSeconds * 1000) : endedAt;
  const endPage = Number(endPageText);
  const endPageValid =
    endPageText.trim() !== '' &&
    Number.isInteger(endPage) &&
    endPage >= session.startPage &&
    endPage <= book.totalPages;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');

    try {
      await finishSession({
        userBookId: book.userBookId,
        startedAt,
        endedAt: savedEndedAt,
        startPage: session.startPage,
        endPage,
        focusExitCount: session.focusExitCount,
        oneLineReview: review,
      });
      clearActiveSession();
      // The reading is over, so the goal-reached alert must not fire later. Today's reminder may now be unnecessary.
      await cancelGoalReached();
      void refreshEngagementReminder();
      setSummary({
        endPage,
        durationSeconds,
        pagesRead: endPage - session.startPage,
        focusExitCount: session.focusExitCount,
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '독서 기록을 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert('기록 없이 종료할까요?', '이번 독서 시간과 페이지는 저장되지 않아요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '기록 없이 종료',
        style: 'destructive',
        onPress: () => {
          clearActiveSession();
          void cancelGoalReached();
          goToBookDetail(book.userBookId);
        },
      },
    ]);
  };

  if (summary) {
    const isLastPage = summary.endPage === book.totalPages;

    return (
      <FinishShell>
        <View style={styles.summary}>
          <Text style={styles.lead}>오늘 {formatDuration(summary.durationSeconds)} 읽었어요.</Text>
          <Text style={styles.book}>{book.title}</Text>
          <Text style={styles.range}>
            {session.startPage}p → {summary.endPage}p
          </Text>
          <Text style={styles.pages}>
            {summary.pagesRead}페이지 읽음 · 집중 이탈 {summary.focusExitCount}회
          </Text>
        </View>
        {isLastPage ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>마지막 페이지까지 읽었어요. 완독 처리를 해 볼까요?</Text>
          </View>
        ) : null}
        {isLastPage ? (
          <PrimaryButton
            label="완독 처리하기"
            onPress={() => router.replace({ pathname: '/book/complete', params: { userBookId: book.userBookId } })}
          />
        ) : null}
        <PrimaryButton label="책 상세로" onPress={() => goToBookDetail(book.userBookId)} />
      </FinishShell>
    );
  }

  return (
    <FinishShell>
      <View style={styles.summary}>
        <Text style={styles.lead}>오늘 {formatDuration(durationSeconds)} 읽었어요.</Text>
        <Text style={styles.book}>{book.title}</Text>
        <Text style={styles.range}>
          {session.startPage}p → {endPageValid ? endPage : '–'}p
        </Text>
        <Text style={styles.pages}>
          {endPageValid ? endPage - session.startPage : 0}페이지 읽음 · 집중 이탈 {session.focusExitCount}회
        </Text>
      </View>

      {isLongSession ? (
        <>
          <View style={styles.notice}>
            <Text style={styles.longNoticeText}>
              독서 시간이 {LONG_SESSION_SECONDS / 3600}시간을 넘었어요. 타이머를 켜 둔 채 자리를 비웠다면 실제로 읽은
              시간을 입력해 주세요.
            </Text>
          </View>
          <TextField
            label="독서 시간 (분)"
            value={minutesText}
            onChangeText={setMinutesText}
            keyboardType="number-pad"
            editable={!isSaving}
          />
          {!minutesValid ? (
            <Text style={styles.error}>1부터 {maxMinutes} 사이의 분을 입력해 주세요.</Text>
          ) : null}
        </>
      ) : null}

      <TextField
        label="끝 페이지"
        value={endPageText}
        onChangeText={setEndPageText}
        keyboardType="number-pad"
        editable={!isSaving}
      />
      {!endPageValid ? (
        <Text style={styles.error}>
          {session.startPage}부터 {book.totalPages} 사이의 페이지를 입력해 주세요.
        </Text>
      ) : null}

      <TextField
        label="한줄평 (선택)"
        value={review}
        onChangeText={setReview}
        placeholder="생각보다 몰입해서 읽었다."
        multiline
        editable={!isSaving}
      />

      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

      <PrimaryButton
        label={isSaving ? '저장 중…' : '저장'}
        onPress={handleSave}
        disabled={!endPageValid || !minutesValid || isSaving}
      />
      <PrimaryButton label="기록 없이 종료" variant="secondary" onPress={handleDiscard} disabled={isSaving} />
    </FinishShell>
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
  notice: {
    ...card,
    padding: spacing.lg,
  },
  noticeText: {
    ...typography.body,
    color: colors.positive,
  },
  longNoticeText: {
    ...typography.body,
    color: colors.text,
  },
});

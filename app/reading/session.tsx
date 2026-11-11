import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BookCover } from '@/components/books/BookCover';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { IndexFormModal, type DraftIndex } from '@/components/reading/IndexFormModal';
import { ReadingTimer } from '@/components/reading/ReadingTimer';
import { colors } from '@/constants/colors';
import { FOCUS_MESSAGE_VISIBLE_MS, FOCUS_RETURN_MESSAGES } from '@/constants/focus';
import { card, spacing, typography } from '@/constants/theme';
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import { useFocusData } from '@/hooks/useFocusData';
import { useFocusReturn } from '@/hooks/useFocusReturn';
import { fetchLibraryBook } from '@/lib/api/books';
import { addIndex } from '@/lib/api/indexes';
import { loadActiveSession, registerFocusExit } from '@/lib/reading/activeSession';
import type { LibraryBook } from '@/types/book';
import type { ActiveReadingSession } from '@/types/reading';
import { readParam } from '@/utils/book';

export default function ReadingSessionScreen() {
  const params = useLocalSearchParams<{ userBookId?: string }>();
  const userBookId = readParam(params.userBookId);
  // Read once: the stored session is updated by this screen only (focus exits), and mirrored here.
  const [session, setSession] = useState<ActiveReadingSession | null>(loadActiveSession);

  const loadBook = useCallback(
    () => (userBookId ? fetchLibraryBook(userBookId) : Promise.reject(new Error('책 정보가 없습니다.'))),
    [userBookId],
  );
  const bookState = useFocusData(loadBook);

  if (!session) {
    return (
      <SessionShell>
        <EmptyState title="진행 중인 독서가 없어요" description="책 상세에서 독서를 시작해 주세요." />
        <PrimaryButton label="돌아가기" variant="secondary" onPress={() => router.back()} />
      </SessionShell>
    );
  }

  if (session.userBookId !== userBookId) {
    return (
      <SessionShell>
        <EmptyState
          title="다른 책을 읽는 중이에요"
          description="동시에 진행할 수 있는 독서는 하나예요. 진행 중인 독서를 먼저 마쳐 주세요."
        />
        <PrimaryButton
          label="진행 중인 독서로 이동"
          onPress={() =>
            router.replace({ pathname: '/reading/session', params: { userBookId: session.userBookId } })
          }
        />
      </SessionShell>
    );
  }

  if (bookState.status === 'loading') {
    return (
      <SessionShell>
        <EmptyState title="불러오는 중이에요" />
      </SessionShell>
    );
  }

  if (bookState.status === 'error') {
    return (
      <SessionShell>
        <EmptyState title="책 정보를 불러오지 못했어요" description={bookState.message} />
        <PrimaryButton label="다시 시도" onPress={bookState.reload} />
      </SessionShell>
    );
  }

  return <ActiveSession book={bookState.data} session={session} onSessionChange={setSession} />;
}

function SessionShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Stack.Screen options={{ title: '독서 중' }} />
      <Screen includeBottomInset>{children}</Screen>
    </>
  );
}

interface ActiveSessionProps {
  book: LibraryBook;
  session: ActiveReadingSession;
  onSessionChange: (session: ActiveReadingSession) => void;
}

function ActiveSession({ book, session, onSessionChange }: ActiveSessionProps) {
  const elapsedSeconds = useElapsedSeconds(session.startedAt);
  const [reaction, setReaction] = useState<string | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [savedIndexes, setSavedIndexes] = useState<DraftIndex[]>([]);
  const [indexError, setIndexError] = useState('');

  useFocusReturn(() => {
    const next = registerFocusExit();
    if (!next) {
      return;
    }

    onSessionChange(next);
    setReaction(FOCUS_RETURN_MESSAGES[(next.focusExitCount - 1) % FOCUS_RETURN_MESSAGES.length]);
  });

  useEffect(() => {
    if (!reaction) {
      return;
    }

    const timer = setTimeout(() => setReaction(null), FOCUS_MESSAGE_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [reaction]);

  const handleSaveIndex = async (draft: DraftIndex) => {
    try {
      await addIndex({ userBookId: book.userBookId, ...draft });
      setSavedIndexes((current) => [...current, draft]);
      setIndexError('');
    } catch (error) {
      setIndexError(error instanceof Error ? error.message : '인덱스를 저장하지 못했습니다.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '독서 중' }} />
      <Screen includeBottomInset>
        {reaction ? (
          <View accessibilityLiveRegion="polite" style={styles.reaction}>
            <Text style={styles.reactionText}>{reaction}</Text>
          </View>
        ) : null}

        <View style={styles.bookRow}>
          <BookCover title={book.title} color={book.coverColor} width={64} imageUrl={book.coverImageUrl} />
          <View style={styles.bookBody}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>{book.author}</Text>
            <Text style={styles.meta}>
              시작 페이지 {session.startPage} · 이탈 {session.focusExitCount}회
            </Text>
          </View>
        </View>

        <ReadingTimer elapsedSeconds={elapsedSeconds} />

        <PrimaryButton label="인덱스 추가" variant="secondary" onPress={() => setIndexOpen(true)} />
        {indexError ? <Text style={styles.error}>{indexError}</Text> : null}

        {savedIndexes.length > 0 ? (
          <View style={styles.list}>
            <SectionHeader title="이번 독서에서 남긴 인덱스" />
            {savedIndexes.map((index, position) => (
              <View key={`${position}-${index.page}`} style={styles.item}>
                <Text style={styles.itemLabel}>p.{index.page}</Text>
                <Text style={styles.itemBody}>{index.title}</Text>
                {index.quote ? <Text style={styles.itemQuote}>{index.quote}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        <PrimaryButton
          label="독서 종료"
          onPress={() =>
            router.push({ pathname: '/reading/finish', params: { userBookId: book.userBookId } })
          }
        />
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

const styles = StyleSheet.create({
  reaction: {
    ...card,
    padding: spacing.lg,
    backgroundColor: colors.surfaceMuted,
  },
  reactionText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  bookRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bookBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  author: {
    ...typography.body,
    color: colors.textSecondary,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  error: {
    ...typography.caption,
    color: colors.warning,
  },
  list: {
    gap: spacing.sm,
  },
  item: {
    ...card,
    padding: spacing.lg,
    gap: 4,
  },
  itemLabel: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
  },
  itemBody: {
    ...typography.body,
    color: colors.text,
  },
  itemQuote: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

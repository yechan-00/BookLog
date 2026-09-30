import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BookCover } from '@/components/books/BookCover';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { TextField } from '@/components/common/TextField';
import { IndexFormModal, type DraftIndex } from '@/components/reading/IndexFormModal';
import { NoteFormModal } from '@/components/reading/NoteFormModal';
import { ReadingTimer } from '@/components/reading/ReadingTimer';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { previewElapsedSeconds } from '@/data/mockReadingData';
import { getCurrentReadingBook, getLibraryBook } from '@/data/selectors';
import { readParam } from '@/utils/book';

interface LocalNote {
  id: string;
  content: string;
}

export default function ReadingSessionScreen() {
  const params = useLocalSearchParams<{ bookId?: string }>();
  const requestedId = readParam(params.bookId);
  const book = (requestedId ? getLibraryBook(requestedId) : null) ?? getCurrentReadingBook();
  const [currentPage, setCurrentPage] = useState(book ? String(book.currentPage) : '');
  const [pageError, setPageError] = useState('');
  const [indexOpen, setIndexOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [indexes, setIndexes] = useState<DraftIndex[]>([]);
  const [notes, setNotes] = useState<LocalNote[]>([]);

  if (!book) {
    return (
      <>
        <Stack.Screen options={{ title: '독서 중' }} />
        <Screen includeBottomInset>
          <EmptyState title="읽을 책이 없어요" />
        </Screen>
      </>
    );
  }

  const finishReading = () => {
    const endPage = Number(currentPage);
    if (!Number.isInteger(endPage) || endPage < 0 || endPage > book.totalPages) {
      setPageError(`0부터 ${book.totalPages} 사이의 페이지를 입력해 주세요.`);
      return;
    }

    setPageError('');
    router.push({
      pathname: '/reading/finish',
      params: {
        bookId: book.id,
        startPage: String(book.currentPage),
        endPage: String(endPage),
        duration: String(previewElapsedSeconds),
      },
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: '독서 중' }} />
      <Screen includeBottomInset>
        <View style={styles.bookRow}>
          <BookCover title={book.title} color={book.coverColor} width={64} imageUrl={book.coverImageUrl} />
          <View style={styles.bookBody}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>{book.author}</Text>
            <Text style={styles.meta}>시작 페이지 {book.currentPage}</Text>
          </View>
        </View>

        <ReadingTimer elapsedSeconds={previewElapsedSeconds} />

        <TextField
          label="현재 페이지"
          value={currentPage}
          onChangeText={setCurrentPage}
          keyboardType="number-pad"
          placeholder={String(book.currentPage)}
        />
        {pageError ? <Text style={styles.error}>{pageError}</Text> : null}

        <View style={styles.actions}>
          <PrimaryButton label="노트 추가" variant="secondary" onPress={() => setNoteOpen(true)} />
          <PrimaryButton label="인덱스 추가" variant="secondary" onPress={() => setIndexOpen(true)} />
        </View>

        {notes.length > 0 ? (
          <View style={styles.list}>
            <SectionHeader title="이번 세션의 노트" />
            {notes.map((note) => (
              <View key={note.id} style={styles.item}>
                <Text style={styles.itemBody}>{note.content}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {indexes.length > 0 ? (
          <View style={styles.list}>
            <SectionHeader title="이번 세션의 인덱스" />
            {indexes.map((index) => (
              <View key={`${index.page}-${index.quote}`} style={styles.item}>
                <Text style={styles.itemLabel}>p.{index.page}</Text>
                <Text style={styles.itemBody}>{index.quote}</Text>
                {index.memo ? <Text style={styles.itemMemo}>{index.memo}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        <PrimaryButton label="독서 종료" onPress={finishReading} />
      </Screen>

      {indexOpen ? (
        <IndexFormModal
          visible
          initialPage={Number(currentPage) || book.currentPage}
          onClose={() => setIndexOpen(false)}
          onSave={(draft) => setIndexes((current) => [...current, draft])}
        />
      ) : null}
      {noteOpen ? (
        <NoteFormModal
          visible
          onClose={() => setNoteOpen(false)}
          onSave={(content) =>
            setNotes((current) => [...current, { id: `${Date.now()}`, content }])
          }
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
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
  actions: {
    gap: spacing.sm,
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
  itemMemo: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

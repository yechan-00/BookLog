import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCover } from '@/components/books/BookCover';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SheetModal } from '@/components/common/SheetModal';
import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/theme';
import { registerBook } from '@/lib/api/books';
import { useAuth } from '@/lib/auth/AuthProvider';
import type { BookSearchResult } from '@/types/book';
import { fallbackCoverColor } from '@/utils/book';
import { publicErrorMessage } from '@/utils/publicError';
import { parseTotalPages } from '@/utils/totalPages';

const REGISTER_FAILURE = '책을 서재에 추가하지 못했습니다. 다시 시도해 주세요.';

type RegisterBookSheetProps = {
  book: BookSearchResult | null;
  onClose: () => void;
  onRegistered: () => void;
};

export function RegisterBookSheet({ book, onClose, onRegistered }: RegisterBookSheetProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { status: authStatus, userId } = useAuth();
  const [pages, setPages] = useState('');
  const [showPageError, setShowPageError] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const bookKey = book ? `${book.isbn}\u0000${book.title}\u0000${book.author}` : '';
  const isSubmitting = useRef(false);
  const bookKeyRef = useRef(bookKey);
  const [formBookKey, setFormBookKey] = useState(bookKey);
  if (bookKey !== formBookKey) {
    setFormBookKey(bookKey);
    setPages('');
    setShowPageError(false);
    setRegisterError(null);
    setIsRegistering(false);
  }

  useEffect(() => {
    bookKeyRef.current = bookKey;
    isSubmitting.current = false;
  }, [bookKey]);

  const parsedPages = parseTotalPages(pages);
  const canRegister = parsedPages.valid && !isRegistering;

  const handleClose = () => {
    if (isSubmitting.current) {
      return;
    }
    onClose();
  };

  const handleRegister = async () => {
    if (!book || isSubmitting.current || !parsedPages.valid) {
      setShowPageError(true);
      return;
    }

    if (authStatus !== 'ready' || !userId) {
      setRegisterError('로그인이 필요합니다.');
      return;
    }

    isSubmitting.current = true;
    setIsRegistering(true);
    setRegisterError(null);
    const submittedKey = bookKey;

    try {
      const registered = await registerBook({
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        coverImageUrl: book.coverImageUrl,
        totalPages: parsedPages.pages,
      });
      if (bookKeyRef.current !== submittedKey) {
        isSubmitting.current = false;
        setIsRegistering(false);
        return;
      }
      if (!registered.userBookId || !registered.bookId) {
        throw new Error(REGISTER_FAILURE);
      }
      Alert.alert('서재에 반영했습니다', '이미 있던 책이면 기존 기록을 유지합니다.', [
        { text: '확인', onPress: onRegistered },
      ]);
    } catch (error) {
      setRegisterError(publicErrorMessage(error, REGISTER_FAILURE));
      isSubmitting.current = false;
      setIsRegistering(false);
    }
  };

  return (
    <SheetModal visible={book !== null} title="서재에 추가" onClose={handleClose} avoidKeyboard>
      {book ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: Math.max(height - insets.top - spacing.xxxl * 4, spacing.xxxl * 8) }}
          contentContainerStyle={styles.content}
        >
          <View style={styles.book}>
            <BookCover
              title={book.title}
              color={fallbackCoverColor(book.title)}
              width={64}
              height={96}
              cornerRadius={8}
              imageUrl={book.coverImageUrl ?? undefined}
            />
            <View style={styles.bookBody}>
              <Text numberOfLines={2} style={styles.bookTitle}>
                {book.title}
              </Text>
              {book.author.trim() ? (
                <Text numberOfLines={1} style={styles.meta}>
                  {book.author.trim()}
                </Text>
              ) : null}
              {book.publisher.trim() ? (
                <Text numberOfLines={1} style={styles.meta}>
                  {book.publisher.trim()}
                </Text>
              ) : null}
            </View>
          </View>

          <TextField
            label="총 페이지"
            value={pages}
            onChangeText={(text) => {
              setPages(text);
              setShowPageError(true);
              setRegisterError(null);
            }}
            placeholder="320"
            keyboardType="number-pad"
            emphasizeFocus
            error={showPageError && !parsedPages.valid ? parsedPages.message : undefined}
          />
          {registerError ? <Text style={styles.error}>{registerError}</Text> : null}
          <PrimaryButton
            label={isRegistering ? '등록 중' : '서재에 추가'}
            loading={isRegistering}
            onPress={() => {
              void handleRegister();
            }}
            disabled={!canRegister}
          />
        </ScrollView>
      ) : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  book: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bookBody: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  bookTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
});

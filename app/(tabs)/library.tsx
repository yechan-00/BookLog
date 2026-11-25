import { router, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { LibraryBookGrid } from '@/components/library/LibraryBookGrid';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { LibraryFilters } from '@/components/library/LibraryFilters';
import { LibraryHeader } from '@/components/library/LibraryHeader';
import { LibraryListItem } from '@/components/library/LibraryListItem';
import { LibrarySearchField } from '@/components/library/LibrarySearchField';
import { LibraryToolbar } from '@/components/library/LibraryToolbar';
import { MessageSheet } from '@/components/common/MessageSheet';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { showAppToast } from '@/components/common/AppToast';
import { homeTheme } from '@/constants/homeTheme';
import { useFocusData } from '@/hooks/useFocusData';
import { updateBookStatus } from '@/lib/api/books';
import type { BookStatus } from '@/types/book';
import {
  filterEmptyMessage,
  filterLibraryBooks,
  type LibraryFilter,
  type LibrarySort,
  type LibraryViewMode,
} from '@/utils/libraryView';
import { loadLibraryBooks } from '@/utils/readingSource';

export default function LibraryScreen() {
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<LibrarySort>('added');
  const [viewMode, setViewMode] = useState<LibraryViewMode>('grid');
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const statusRequestRef = useRef(0);
  const loadBooks = useCallback(() => loadLibraryBooks(), []);
  const source = useFocusData(loadBooks);
  const books = source.status === 'ready' ? source.data : [];
  const visibleBooks =
    source.status === 'ready' ? filterLibraryBooks(books, filter, query, sort) : [];

  const openSearch = () => router.push('/book/search');
  const openBookshelf = () => router.push('/bookshelf' as Href);
  const openBook = (userBookId: string) => router.push(`/book/${userBookId}`);
  const openComplete = (userBookId: string) =>
    router.push({ pathname: '/book/complete', params: { userBookId } });
  const canSearch = source.status === 'ready';

  const handleChangeStatus = async (
    userBookId: string,
    next: Exclude<BookStatus, 'completed'>,
  ) => {
    const current = books.find((book) => book.userBookId === userBookId);
    if (statusBusyId || !current) {
      return;
    }

    const requestId = ++statusRequestRef.current;
    setStatusBusyId(userBookId);
    try {
      await updateBookStatus(userBookId, current.status, next);
      if (requestId !== statusRequestRef.current) {
        return;
      }
      source.reload();
      showAppToast('도서 상태를 변경했어요.');
    } catch (error) {
      if (requestId !== statusRequestRef.current) {
        return;
      }
      setStatusError(error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      if (requestId === statusRequestRef.current) {
        setStatusBusyId(null);
      }
    }
  };

  return (
    <Screen topInset backgroundColor={homeTheme.background} contentContainerStyle={styles.content}>
      <LibraryHeader onAdd={openSearch} onOpenBookshelf={openBookshelf} />

      <LibrarySearchField value={query} onChangeText={setQuery} editable={canSearch} />

      <LibraryFilters value={filter} onChange={setFilter} />

      {source.status === 'ready' && books.length > 0 ? (
        <LibraryToolbar sort={sort} viewMode={viewMode} onChangeSort={setSort} onChangeView={setViewMode} />
      ) : null}

      {source.status === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator color={homeTheme.primary} />
          <Text style={styles.loadingText}>서재를 불러오는 중이에요.</Text>
        </View>
      ) : source.status === 'error' ? (
        <View style={styles.errorBlock}>
          <LibraryEmptyState title="서재를 불러오지 못했어요." description={source.message} />
          <PrimaryButton
            label="다시 시도"
            onPress={source.reload}
            primaryColor={homeTheme.primary}
            primaryPressedColor={homeTheme.accentLine}
            onPrimaryColor={homeTheme.onPrimary}
          />
        </View>
      ) : books.length === 0 ? (
        <LibraryEmptyState
          title="아직 서재에 책이 없어요."
          description="첫 번째 책을 추가해 보세요."
          actionLabel="책 추가"
          onAction={openSearch}
        />
      ) : visibleBooks.length === 0 ? (
        <LibraryEmptyState
          title={query.trim() ? '검색 결과가 없어요.' : filterEmptyMessage(filter)}
          description={
            query.trim() ? '다른 제목이나 저자로 검색해 보세요.' : '필터를 바꾸거나 책을 추가해 보세요.'
          }
        />
      ) : viewMode === 'grid' ? (
        <LibraryBookGrid
          books={visibleBooks}
          onPressBook={openBook}
          onChangeStatus={handleChangeStatus}
          onComplete={openComplete}
          statusBusyId={statusBusyId}
        />
      ) : (
        <View style={styles.list}>
          {visibleBooks.map((book) => (
            <LibraryListItem
              key={book.userBookId}
              book={book}
              onPress={openBook}
              onChangeStatus={handleChangeStatus}
              onComplete={openComplete}
              statusBusy={statusBusyId === book.userBookId}
            />
          ))}
        </View>
      )}

      <MessageSheet
        visible={statusError !== null}
        title="상태를 바꾸지 못했어요"
        message={statusError ?? undefined}
        onClose={() => setStatusError(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingBottom: 28,
  },
  loading: {
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
    lineHeight: 18,
    color: homeTheme.textSecondary,
  },
  errorBlock: {
    gap: 12,
  },
  list: {
    gap: 12,
  },
});

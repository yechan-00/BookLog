import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookSearchField } from '@/components/books/BookSearchField';
import { BookSearchResultCard } from '@/components/books/BookSearchResultCard';
import { RegisterBookSheet } from '@/components/books/RegisterBookSheet';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/theme';
import { useBookSearch } from '@/hooks/useBookSearch';
import type { BookSearchResult } from '@/types/book';

export default function BookSearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
  const { results, phase, errorMessage, retry } = useBookSearch(query);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: '책 추가하기' }} />
      <View style={styles.body}>
        <BookSearchField value={query} onChangeText={setQuery} />
        <SearchBody
          phase={phase}
          results={results}
          errorMessage={errorMessage}
          onRetry={retry}
          onSelect={setSelectedBook}
          bottomInset={insets.bottom}
        />
      </View>
      <RegisterBookSheet
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onRegistered={() => {
          setSelectedBook(null);
          router.back();
        }}
      />
    </KeyboardAvoidingView>
  );
}

function SearchBody({
  phase,
  results,
  errorMessage,
  onRetry,
  onSelect,
  bottomInset,
}: {
  phase: 'idle' | 'loading' | 'ready' | 'error';
  results: BookSearchResult[];
  errorMessage: string | null;
  onRetry: () => void;
  onSelect: (book: BookSearchResult) => void;
  bottomInset: number;
}) {
  if (phase === 'idle') {
    return <Text style={styles.hint}>읽고 싶은 책을 검색해 보세요.</Text>;
  }

  if (phase === 'loading') {
    return (
      <View style={styles.status}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={styles.status}>
        <Text style={styles.errorText}>{errorMessage ?? '검색에 실패했어요.'}</Text>
        <PrimaryButton label="다시 시도" variant="secondary" onPress={onRetry} style={styles.retry} />
      </View>
    );
  }

  if (results.length === 0) {
    return <Text style={styles.hint}>검색 결과가 없어요.</Text>;
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item, index) => `${item.isbn}-${item.title}-${index}`}
      renderItem={({ item }) => <BookSearchResultCard book={item} onPress={() => onSelect(item)} />}
      contentContainerStyle={[styles.list, { paddingBottom: bottomInset + spacing.xl }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={styles.listView}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  listView: {
    flex: 1,
  },
  list: {
    gap: spacing.md,
  },
  status: {
    minHeight: 72,
    gap: spacing.md,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  hint: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  retry: {
    alignSelf: 'flex-start',
  },
});

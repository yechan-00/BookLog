import { Stack, router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Bookshelf, type ShelfBook } from '@/components/books/Bookshelf';
import { DustBookSheet } from '@/components/books/DustBookSheet';
import { AppIcon } from '@/components/common/AppIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { colors } from '@/constants/colors';
import { DUST_LEVEL_LABELS } from '@/constants/dustPolicy';
import { readerTheme } from '@/constants/readerTheme';
import { card, spacing, typography } from '@/constants/theme';
import { useFocusData } from '@/hooks/useFocusData';
import { fetchDustWipes, saveDustWipe, type DustWipeRecord } from '@/lib/api/dust';
import { startReading } from '@/lib/reading/startReading';
import type { LibraryBook } from '@/types/book';
import { bookshelfDashboard, type DustBookView } from '@/utils/bookshelfView';
import { startOfToday, toDateKey } from '@/utils/date';
import { loadLibraryBooks } from '@/utils/readingSource';

type WipeMap = Record<string, DustWipeRecord>;

export default function BookshelfScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const todayKey = toDateKey(startOfToday());
  const [wipes, setWipes] = useState<WipeMap>({});
  const [wipesError, setWipesError] = useState<string | null>(null);
  const [selectedDust, setSelectedDust] = useState<DustBookView | null>(null);
  const [wipeBusy, setWipeBusy] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);
  const [wipeSucceeded, setWipeSucceeded] = useState(false);
  const wipeLock = useRef(false);

  const loadBooks = useCallback(async () => {
    const books = await loadLibraryBooks();
    try {
      const wipeRows = await fetchDustWipes();
      const next: WipeMap = {};
      for (const wipe of wipeRows) {
        next[wipe.userBookId] = wipe;
      }
      setWipes(next);
      setWipesError(null);
    } catch (error) {
      setWipes({});
      setWipesError(error instanceof Error ? error.message : '먼지 기록을 불러오지 못했어요.');
    }
    return books;
  }, []);

  const source = useFocusData(loadBooks);
  const wipeList = useMemo(() => Object.values(wipes), [wipes]);
  const dashboard = useMemo(() => {
    const books = source.status === 'ready' ? source.data : [];
    return bookshelfDashboard(books, todayKey, wipeList);
  }, [source, todayKey, wipeList]);
  const books = source.status === 'ready' ? source.data : [];

  const completedShelfBooks: ShelfBook[] = useMemo(
    () =>
      dashboard.completedSpines.map((spine) => ({
        id: spine.userBookId,
        userBookId: spine.userBookId,
        title: spine.title,
        color: spine.spineColor,
        width: spine.displayWidth,
        statusLabel: '완독',
      })),
    [dashboard.completedSpines],
  );

  const dustyShelfBooks: ShelfBook[] = useMemo(
    () =>
      dashboard.dustBooks
        .filter((book) => (book.dustLevel ?? 0) > 0)
        .map((book) => ({
          id: book.userBookId,
          userBookId: book.userBookId,
          title: book.title,
          color: book.coverColor,
          width: 34,
          dustLevel: book.dustLevel ?? 0,
          statusLabel: DUST_LEVEL_LABELS[book.dustLevel ?? 0],
        })),
    [dashboard.dustBooks],
  );

  const openBook = (userBookId: string) => {
    setSelectedDust(null);
    router.push(`/book/${userBookId}`);
  };

  const continueReading = (book: LibraryBook | DustBookView) => {
    const currentPage = 'currentPage' in book ? book.currentPage : 1;
    setSelectedDust(null);
    startReading(book.userBookId, currentPage, book.status);
  };

  const handleWipe = async () => {
    if (!selectedDust || wipeLock.current) {
      return;
    }
    const level = selectedDust.dustLevel ?? 0;
    if (level <= 0) {
      return;
    }

    wipeLock.current = true;
    setWipeBusy(true);
    setWipeError(null);
    setWipeSucceeded(false);
    const previous = selectedDust;

    try {
      const saved = await saveDustWipe({
        userBookId: selectedDust.userBookId,
        dustLevel: level,
      });
      setWipes((current) => ({ ...current, [saved.userBookId]: saved }));
      setSelectedDust({
        ...previous,
        lastWipedOn: saved.wipedOn,
        dustLevel: 0,
        elapsedDays: 0,
        referenceOn: saved.wipedOn,
      });
      setWipeSucceeded(true);
    } catch (error) {
      setWipeError(error instanceof Error ? error.message : '먼지털이를 저장하지 못했어요.');
      setSelectedDust(previous);
      setWipeSucceeded(false);
    } finally {
      wipeLock.current = false;
      setWipeBusy(false);
    }
  };

  const contentMax = Math.min(width, 560);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        topInset
        includeBottomInset
        backgroundColor={readerTheme.background}
        contentContainerStyle={[styles.content, { paddingHorizontal: compact ? 12 : 16, maxWidth: contentMax, alignSelf: 'center', width: '100%' }]}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            hitSlop={8}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
                return;
              }
              router.replace('/');
            }}
            style={styles.back}
          >
            <AppIcon name="chevronLeft" size={18} color={readerTheme.primary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>나의 책꽂이</Text>
            <Text style={styles.subtitle}>등록된 책 {dashboard.totalCount}권</Text>
          </View>
          <View style={styles.backSpacer} />
        </View>

        {source.status === 'loading' ? (
          <View style={styles.loading}>
            <ActivityIndicator color={readerTheme.primary} />
            <Text style={styles.note}>책꽂이를 불러오는 중이에요.</Text>
          </View>
        ) : null}

        {source.status === 'error' ? (
          <EmptyState title="책꽂이를 불러오지 못했어요" description={source.message} />
        ) : null}

        {source.status === 'ready' && books.length === 0 ? (
          <EmptyState
            title="아직 책꽂이가 비어 있어요"
            description="서재에 책을 등록하면 이곳에 쌓여요."
          />
        ) : null}

        {source.status === 'ready' && books.length > 0 ? (
          <>
            <View style={styles.summary}>
              <SummaryChip label="전체" value={`${dashboard.totalCount}`} />
              <SummaryChip label="읽는 중" value={`${dashboard.readingCount}`} />
              <SummaryChip label="완독" value={`${dashboard.completedCount}`} />
            </View>

            <View style={styles.dustBanner}>
              <Text style={styles.dustBannerTitle}>
                {dashboard.dustyCount > 0
                  ? `먼지가 쌓인 책 ${dashboard.dustyCount}권`
                  : '먼지가 쌓인 책이 없어요'}
              </Text>
              <Text style={styles.note}>
                오래 손길이 닿지 않은 읽는 중·중단 책에 먼지가 쌓여요. 털어도 독서 기록은 바뀌지 않아요.
              </Text>
              {wipesError ? <Text style={styles.warn}>먼지 기록: {wipesError}</Text> : null}
            </View>

            <SectionHeader title="완독 책꽂이" />
            {completedShelfBooks.length === 0 ? (
              <Text style={styles.note}>완독한 책이 아직 없어요.</Text>
            ) : (
              <Bookshelf books={completedShelfBooks} onPressBook={openBook} />
            )}

            <SectionHeader title="먼지가 쌓인 책" />
            {dustyShelfBooks.length === 0 ? (
              <Text style={styles.note}>지금은 먼지를 털 책이 없어요.</Text>
            ) : (
              <>
                <Bookshelf
                  books={dustyShelfBooks}
                  onPressBook={(userBookId) => {
                    const target = dashboard.dustBooks.find((book) => book.userBookId === userBookId) ?? null;
                    setWipeError(null);
                    setWipeSucceeded(false);
                    setSelectedDust(target);
                  }}
                />
                <Text style={styles.hint}>책을 눌러 상태를 확인하고 먼지를 털 수 있어요.</Text>
              </>
            )}

            <AccessibleDustList
              books={dashboard.dustBooks}
              onSelect={(book) => {
                setWipeError(null);
                setWipeSucceeded(false);
                setSelectedDust(book);
              }}
            />
          </>
        ) : null}

        {source.status === 'ready' && books.length === 0 ? (
          <PrimaryButton label="책 추가하기" onPress={() => router.push('/book/search')} />
        ) : null}

        {source.status === 'error' ? (
          <PrimaryButton label="다시 시도" onPress={source.reload} />
        ) : null}
      </Screen>

      <DustBookSheet
        book={selectedDust}
        busy={wipeBusy}
        errorMessage={wipeError}
        wipeSucceeded={wipeSucceeded}
        onClose={() => {
          setSelectedDust(null);
          setWipeError(null);
          setWipeSucceeded(false);
        }}
        onWipe={() => {
          void handleWipe();
        }}
        onOpenBook={() => {
          if (selectedDust) {
            openBook(selectedDust.userBookId);
          }
        }}
        onContinueReading={() => {
          if (selectedDust) {
            continueReading(selectedDust);
          }
        }}
      />
    </>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

function AccessibleDustList({
  books,
  onSelect,
}: {
  books: DustBookView[];
  onSelect: (book: DustBookView) => void;
}) {
  if (books.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      <Text style={styles.listTitle}>책 목록</Text>
      {books.map((book) => (
        <Pressable
          key={book.userBookId}
          accessibilityRole="button"
          accessibilityLabel={`${book.title}, ${DUST_LEVEL_LABELS[book.dustLevel ?? 0]}`}
          onPress={() => onSelect(book)}
          style={styles.listRow}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.listName} numberOfLines={1}>
              {book.title}
            </Text>
            <Text style={styles.note} numberOfLines={1}>
              {book.author || '저자 미상'} · {DUST_LEVEL_LABELS[book.dustLevel ?? 0]}
            </Text>
          </View>
          <AppIcon name="chevronRight" size={14} color={readerTheme.primarySoft} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: readerTheme.border,
    backgroundColor: readerTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 40,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: readerTheme.text,
  },
  subtitle: {
    ...typography.caption,
    color: readerTheme.textSecondary,
  },
  summary: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    ...card,
    padding: spacing.md,
    gap: 2,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  dustBanner: {
    ...card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  dustBannerTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  warn: {
    ...typography.caption,
    color: colors.warning,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  loading: {
    gap: spacing.sm,
  },
  list: {
    ...card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  listTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  listName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});

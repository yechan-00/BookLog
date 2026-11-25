import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCover } from '@/components/books/BookCover';
import { ActionSheet, type ActionSheetItem } from '@/components/common/ActionSheet';
import { AppIcon } from '@/components/common/AppIcon';
import { homeTheme } from '@/constants/homeTheme';
import { readerTheme } from '@/constants/readerTheme';
import { spacing, typography } from '@/constants/theme';
import type { BookStatus, LibraryBook } from '@/types/book';
import { bookStatusLabel } from '@/utils/book';
import { planBookStatusChange, statusChangeOptions } from '@/utils/bookStatus';

type LibraryBookMenuProps = {
  book: LibraryBook;
  onOpenDetail: (userBookId: string) => void;
  onChangeStatus?: (userBookId: string, next: Exclude<BookStatus, 'completed'>) => void;
  onComplete?: (userBookId: string) => void;
  busy?: boolean;
};

/** Shelf actions for BOOK-03. Completing routes to READ-05 instead of a raw update. */
export function LibraryBookMenu({
  book,
  onOpenDetail,
  onChangeStatus,
  onComplete,
  busy = false,
}: LibraryBookMenuProps) {
  const [open, setOpen] = useState(false);

  const items = useMemo((): ActionSheetItem[] => {
    const statusItems: ActionSheetItem[] = [];
    for (const status of statusChangeOptions(book.status)) {
      const plan = planBookStatusChange(book.status, status);
      if (plan.kind === 'forbidden') {
        continue;
      }

      if (plan.kind === 'complete_flow') {
        statusItems.push({
          key: 'complete',
          label: '완독 처리',
          icon: 'checkmark',
          onPress: () => onComplete?.(book.userBookId),
        });
        continue;
      }

      const icon =
        plan.next === 'reading'
          ? 'play'
          : plan.next === 'paused'
            ? 'clock'
            : plan.next === 'wishlist'
              ? 'bookmark'
              : 'bookOpen';

      statusItems.push({
        key: plan.next,
        label: bookStatusLabel[plan.next],
        icon,
        onPress: () => onChangeStatus?.(book.userBookId, plan.next),
      });
    }

    return [
      {
        key: 'detail',
        label: '책 상세 보기',
        icon: 'document',
        onPress: () => onOpenDetail(book.userBookId),
      },
      ...statusItems,
    ];
  }, [book, onChangeStatus, onComplete, onOpenDetail]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${book.title} 더보기`}
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        hitSlop={10}
        onPress={() => {
          if (!busy) {
            setOpen(true);
          }
        }}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <AppIcon name="more" size={16} color={homeTheme.textSecondary} />
      </Pressable>

      <ActionSheet
        visible={open}
        title="도서 메뉴"
        onClose={() => setOpen(false)}
        items={items}
        header={
          <View style={styles.header}>
            <BookCover
              title={book.title}
              color={book.coverColor || readerTheme.soft}
              imageUrl={book.coverImageUrl}
              width={52}
            />
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle} numberOfLines={3}>
                {book.title}
              </Text>
              {book.author ? (
                <Text style={styles.headerMeta} numberOfLines={1}>
                  {book.author}
                </Text>
              ) : null}
              <Text style={styles.headerStatus}>{bookStatusLabel[book.status]}</Text>
            </View>
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: readerTheme.border,
    marginBottom: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headerTitle: {
    ...typography.bodyStrong,
    color: readerTheme.text,
  },
  headerMeta: {
    ...typography.caption,
    color: readerTheme.textSecondary,
  },
  headerStatus: {
    ...typography.caption,
    color: readerTheme.primary,
    fontWeight: '600',
  },
});

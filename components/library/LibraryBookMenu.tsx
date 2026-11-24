import { Alert, Pressable, StyleSheet } from 'react-native';

import { AppIcon } from '@/components/common/AppIcon';
import { homeTheme } from '@/constants/homeTheme';
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
  const openMenu = () => {
    if (busy) {
      return;
    }

    const statusButtons = statusChangeOptions(book.status).flatMap((status) => {
      const plan = planBookStatusChange(book.status, status);
      if (plan.kind === 'forbidden') {
        return [];
      }

      if (plan.kind === 'complete_flow') {
        return [
          {
            text: '완독 처리…',
            onPress: () => onComplete?.(book.userBookId),
          },
        ];
      }

      return [
        {
          text: bookStatusLabel[plan.next],
          onPress: () => onChangeStatus?.(book.userBookId, plan.next),
        },
      ];
    });

    Alert.alert(book.title, undefined, [
      {
        text: '책 상세 보기',
        onPress: () => onOpenDetail(book.userBookId),
      },
      ...statusButtons,
      { text: '취소', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${book.title} 더보기`}
      accessibilityState={{ disabled: busy }}
      disabled={busy}
      hitSlop={10}
      onPress={openMenu}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <AppIcon name="more" size={16} color={homeTheme.textSecondary} />
    </Pressable>
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
});

import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { LibraryGridItem } from '@/components/library/LibraryGridItem';
import type { BookStatus, LibraryBook } from '@/types/book';

type LibraryBookGridProps = {
  books: readonly LibraryBook[];
  onPressBook: (userBookId: string) => void;
  onChangeStatus?: (userBookId: string, next: Exclude<BookStatus, 'completed'>) => void;
  onComplete?: (userBookId: string) => void;
  statusBusyId?: string | null;
};

export function LibraryBookGrid({
  books,
  onPressBook,
  onChangeStatus,
  onComplete,
  statusBusyId = null,
}: LibraryBookGridProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = 20;
  const gap = 12;
  const columns = width < 360 ? 2 : 3;
  const usable = width - horizontalPadding * 2;
  const itemWidth = Math.floor((usable - gap * (columns - 1)) / columns);

  const rows: LibraryBook[][] = [];
  for (let index = 0; index < books.length; index += columns) {
    rows.push(books.slice(index, index + columns));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { gap }]}>
          {row.map((book) => (
            <LibraryGridItem
              key={book.userBookId}
              book={book}
              width={itemWidth}
              onPress={onPressBook}
              onChangeStatus={onChangeStatus}
              onComplete={onComplete}
              statusBusy={statusBusyId === book.userBookId}
            />
          ))}
          {row.length < columns
            ? Array.from({ length: columns - row.length }, (_, filler) => (
                <View key={`spacer-${rowIndex}-${filler}`} style={{ width: itemWidth }} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 20,
  },
  row: {
    flexDirection: 'row',
  },
});

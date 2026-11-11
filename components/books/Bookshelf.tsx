import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { BookSpine } from '@/components/books/BookSpine';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/theme';

export type ShelfBook = {
  id: string;
  bookId: string;
  title: string;
  color: string;
  width?: number | null;
};

type BookshelfProps = {
  books: ShelfBook[];
  onPressBook: (bookId: string) => void;
};

const SHELF_GAP = 8;
const SHELF_SIDE_PAD = 14;
const FALLBACK_WIDTH = 320;

function packShelfRows(books: ShelfBook[], availableWidth: number): ShelfBook[][] {
  if (books.length === 0) {
    return [];
  }

  const maxWidth = Math.max(availableWidth - SHELF_SIDE_PAD * 2, 96);
  const rows: ShelfBook[][] = [];
  let current: ShelfBook[] = [];
  let used = 0;

  for (const book of books) {
    const spineWidth = book.width ?? 36;
    const next = current.length === 0 ? spineWidth : used + SHELF_GAP + spineWidth;
    if (current.length > 0 && next > maxWidth) {
      rows.push(current);
      current = [book];
      used = spineWidth;
      continue;
    }

    current.push(book);
    used = next;
  }

  if (current.length > 0) {
    rows.push(current);
  }

  return rows;
}

export function Bookshelf({ books, onPressBook }: BookshelfProps) {
  const [shelfWidth, setShelfWidth] = useState(FALLBACK_WIDTH);
  const rows = packShelfRows(books, shelfWidth);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > 0 && next !== shelfWidth) {
      setShelfWidth(next);
    }
  };

  return (
    <View style={styles.unit} onLayout={onLayout}>
      {rows.length === 0 ? (
        <ShelfRow books={[]} onPressBook={onPressBook} />
      ) : (
        rows.map((row, index) => (
          <ShelfRow key={`shelf-row-${index}`} books={row} onPressBook={onPressBook} />
        ))
      )}
    </View>
  );
}

function ShelfRow({ books, onPressBook }: { books: ShelfBook[]; onPressBook: (bookId: string) => void }) {
  return (
    <View style={styles.shelf}>
      <View style={styles.bay}>
        <View style={styles.row}>
          {books.map((book) => (
            <BookSpine
              key={book.id}
              id={book.id}
              title={book.title}
              color={book.color}
              width={book.width}
              onPress={() => onPressBook(book.bookId)}
            />
          ))}
        </View>
      </View>
      <View style={styles.board}>
        <View style={styles.boardGrain} />
        <View style={styles.boardShadow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  unit: {
    gap: spacing.md,
  },
  shelf: {
    gap: 0,
  },
  bay: {
    minHeight: 148,
    justifyContent: 'flex-end',
    paddingHorizontal: SHELF_SIDE_PAD,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(74, 48, 37, 0.06)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'flex-end',
    gap: SHELF_GAP,
    minHeight: 132,
  },
  board: {
    height: 16,
    borderRadius: 4,
    backgroundColor: colors.shelf,
    borderBottomWidth: 3,
    borderBottomColor: colors.shelfEdge,
    overflow: 'hidden',
  },
  boardGrain: {
    ...StyleSheet.absoluteFill,
    borderTopWidth: 2,
    borderTopColor: colors.shelfHighlight,
    opacity: 0.55,
  },
  boardShadow: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: -5,
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.darkBrown,
    opacity: 0.16,
  },
});

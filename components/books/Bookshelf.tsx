import { ScrollView, StyleSheet, View } from 'react-native';

import { BookSpine } from '@/components/books/BookSpine';
import { colors } from '@/constants/colors';

type ShelfBook = {
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

export function Bookshelf({ books, onPressBook }: BookshelfProps) {
  return (
    <View style={styles.shelf}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {books.map((book) => (
          <BookSpine
            key={book.id}
            title={book.title}
            color={book.color}
            width={book.width}
            onPress={() => onPressBook(book.bookId)}
          />
        ))}
      </ScrollView>
      <View style={styles.board} />
    </View>
  );
}

const styles = StyleSheet.create({
  shelf: {
    gap: 0,
  },
  row: {
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  board: {
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.shelf,
    borderBottomWidth: 3,
    borderBottomColor: colors.shelfEdge,
  },
});

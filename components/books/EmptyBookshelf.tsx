import { StyleSheet, Text, View } from 'react-native';

import { CoverBookshelf } from '@/components/books/CoverBookshelf';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { libraryTheme } from '@/constants/libraryTheme';
import { spacing, typography } from '@/constants/theme';

type EmptyBookshelfProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAdd?: () => void;
};

export function EmptyBookshelf({
  title = '아직 서재가 비어 있어요.',
  description = '첫 번째 책을 꽂아 나만의 서재를 만들어 보세요.',
  actionLabel = '책 등록하기',
  onAdd,
}: EmptyBookshelfProps) {
  return (
    <View style={styles.wrap}>
      <CoverBookshelf books={[]} onPressBook={() => undefined} />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {onAdd ? <PrimaryButton label={actionLabel} onPress={onAdd} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  copy: {
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyStrong,
    color: libraryTheme.text,
  },
  description: {
    ...typography.caption,
    color: libraryTheme.textSecondary,
  },
});

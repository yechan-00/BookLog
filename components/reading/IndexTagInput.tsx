import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IndexTagChips } from '@/components/reading/IndexTagChips';
import { MAX_INDEX_TAG_LENGTH, MAX_INDEX_TAGS } from '@/constants/bookIndex';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';

type IndexTagInputProps = {
  tags: readonly string[];
  text: string;
  onChangeText: (text: string) => void;
  /** 입력 중인 글자를 태그로 확정한다 (완료 키, 추가 버튼). */
  onSubmit: () => void;
  onRemove: (tag: string) => void;
};

export function IndexTagInput({ tags, text, onChangeText, onSubmit, onRemove }: IndexTagInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        태그 (선택, 최대 {MAX_INDEX_TAGS}개 · {MAX_INDEX_TAG_LENGTH}자 이하)
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          submitBehavior="submit"
          returnKeyType="done"
          placeholder="쉼표나 완료 키로 추가"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="태그 입력"
          style={styles.input}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="태그 추가" onPress={onSubmit} style={styles.addButton}>
          <Text style={styles.addLabel}>추가</Text>
        </Pressable>
      </View>
      <IndexTagChips tags={tags} onRemove={onRemove} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  addButton: {
    minWidth: 64,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
});

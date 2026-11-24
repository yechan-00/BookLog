import { StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/common/AppIcon';
import { homeTheme } from '@/constants/homeTheme';

type LibrarySearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  editable?: boolean;
};

export function LibrarySearchField({ value, onChangeText, editable = true }: LibrarySearchFieldProps) {
  return (
    <View style={[styles.wrap, !editable && styles.disabled]}>
      <AppIcon name="search" size={20} color={homeTheme.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={editable ? '제목 또는 저자 검색' : '서재를 불러온 뒤 검색할 수 있어요'}
        placeholderTextColor="#A39589"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DED4',
    backgroundColor: homeTheme.surface,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  disabled: {
    opacity: 0.72,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: homeTheme.text,
    paddingVertical: 12,
  },
});

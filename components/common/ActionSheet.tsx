import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/common/AppIcon';
import { SheetModal } from '@/components/common/SheetModal';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { readerTheme } from '@/constants/readerTheme';
import { spacing, typography } from '@/constants/theme';

export type ActionSheetItem = {
  key: string;
  label: string;
  icon?: AppIconName;
  destructive?: boolean;
  onPress: () => void;
};

type ActionSheetProps = {
  visible: boolean;
  title: string;
  description?: string;
  header?: ReactNode;
  items: ActionSheetItem[];
  onClose: () => void;
  cancelLabel?: string;
};

export function ActionSheet({
  visible,
  title,
  description,
  header,
  items,
  onClose,
  cancelLabel = '취소',
}: ActionSheetProps) {
  return (
    <SheetModal
      visible={visible}
      title={title}
      description={description}
      onClose={onClose}
      footer={<PrimaryButton label={cancelLabel} variant="secondary" onPress={onClose} />}
    >
      {header}
      <View style={styles.list}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              // Let the sheet begin closing before the next UI step.
              requestAnimationFrame(() => item.onPress());
            }}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            {item.icon ? (
              <AppIcon
                name={item.icon}
                size={18}
                color={item.destructive ? readerTheme.error : readerTheme.primary}
              />
            ) : (
              <View style={styles.iconSpacer} />
            )}
            <Text
              style={[styles.label, item.destructive && styles.destructive]}
              numberOfLines={2}
            >
              {item.label}
            </Text>
            <AppIcon name="chevronRight" size={16} color={readerTheme.textMuted} />
          </Pressable>
        ))}
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 2,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: readerTheme.border,
  },
  pressed: {
    opacity: 0.75,
  },
  iconSpacer: {
    width: 18,
  },
  label: {
    ...typography.bodyStrong,
    color: readerTheme.text,
    flex: 1,
    minWidth: 0,
  },
  destructive: {
    color: readerTheme.error,
  },
});

import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SheetModal } from '@/components/common/SheetModal';
import { WheelPicker } from '@/components/common/WheelPicker';
import { readerTheme } from '@/constants/readerTheme';
import { spacing, typography } from '@/constants/theme';
import {
  formatPagePreview,
  isValidPageTarget,
  pageOptions,
} from '@/utils/wheelDuration';

type NumberPickerSheetProps = {
  visible: boolean;
  initialValue: number;
  onConfirm: (value: number) => void;
  onClose: () => void;
  title?: string;
  description?: string;
};

function NumberPickerContent({
  initialValue,
  onConfirm,
  onClose,
}: {
  initialValue: number;
  onConfirm: (value: number) => void;
  onClose: () => void;
}) {
  const seed = Math.max(1, initialValue || 15);
  const values = useMemo(() => pageOptions(seed), [seed]);
  const [index, setIndex] = useState(() => Math.max(0, values.indexOf(seed)));
  const selected = values[index] ?? seed;
  const valid = isValidPageTarget(selected);

  return (
    <>
      <View style={styles.wheel}>
        <WheelPicker
          values={values}
          selectedIndex={index}
          onChangeIndex={setIndex}
          formatLabel={(value) => `${value}`}
          accessibilityLabel="페이지"
        />
        <Text style={styles.unit}>쪽</Text>
      </View>
      <Text style={styles.preview}>{formatPagePreview(selected)}</Text>
      <View style={styles.footer}>
        <PrimaryButton
          label="확인"
          disabled={!valid}
          onPress={() => {
            if (!valid) {
              return;
            }
            onConfirm(selected);
            onClose();
          }}
          primaryColor={readerTheme.primary}
          onPrimaryColor={readerTheme.onPrimary}
        />
        <PrimaryButton label="취소" variant="secondary" onPress={onClose} />
      </View>
    </>
  );
}

export function NumberPickerSheet({
  visible,
  initialValue,
  onConfirm,
  onClose,
  title = '하루 독서 페이지',
  description = '매일 읽고 싶은 양을 정해요.',
}: NumberPickerSheetProps) {
  return (
    <SheetModal
      visible={visible}
      title={title}
      description={description}
      onClose={onClose}
      scrollable={false}
    >
      {visible ? (
        <NumberPickerContent
          key={`pages-${initialValue}`}
          initialValue={initialValue}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      ) : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  wheel: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  unit: {
    ...typography.caption,
    color: readerTheme.textSecondary,
    fontWeight: '600',
  },
  preview: {
    ...typography.bodyStrong,
    color: readerTheme.text,
    textAlign: 'center',
  },
  footer: {
    gap: spacing.sm,
  },
});

import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SheetModal } from '@/components/common/SheetModal';
import { WheelPicker } from '@/components/common/WheelPicker';
import { readerTheme } from '@/constants/readerTheme';
import { spacing, typography } from '@/constants/theme';
import {
  clampDurationSelection,
  durationHourOptions,
  formatDurationPreview,
  isValidDurationTotal,
  totalMinutesToParts,
} from '@/utils/wheelDuration';

type DurationPickerSheetProps = {
  visible: boolean;
  initialTotalMinutes: number;
  onConfirm: (totalMinutes: number) => void;
  onClose: () => void;
};

function DurationPickerContent({
  initialTotalMinutes,
  onConfirm,
  onClose,
}: {
  initialTotalMinutes: number;
  onConfirm: (totalMinutes: number) => void;
  onClose: () => void;
}) {
  const seed = Math.max(1, initialTotalMinutes || 15);
  const seedParts = totalMinutesToParts(seed);
  const [hours, setHours] = useState(seedParts.hours);
  const [minutes, setMinutes] = useState(seedParts.minutes);
  const hourValues = useMemo(() => durationHourOptions(seed), [seed]);
  const minuteValues = useMemo(() => Array.from({ length: 60 }, (_, index) => index), []);
  const total = clampDurationSelection(hours, minutes);
  const valid = isValidDurationTotal(total);

  return (
    <>
      <View style={styles.wheels}>
        <View style={styles.column}>
          <WheelPicker
            values={hourValues}
            selectedIndex={Math.max(0, hourValues.indexOf(hours))}
            onChangeIndex={(index) => setHours(hourValues[index] ?? 0)}
            formatLabel={(value) => `${value}`}
            accessibilityLabel="시간"
            width="100%"
          />
          <Text style={styles.unit}>시간</Text>
        </View>
        <View style={styles.column}>
          <WheelPicker
            values={minuteValues}
            selectedIndex={minutes}
            onChangeIndex={(index) => setMinutes(minuteValues[index] ?? 0)}
            formatLabel={(value) => `${value}`}
            accessibilityLabel="분"
            width="100%"
          />
          <Text style={styles.unit}>분</Text>
        </View>
      </View>
      <Text style={styles.preview}>{formatDurationPreview(total)}</Text>
      {!valid ? <Text style={styles.error}>1분 이상 선택해 주세요.</Text> : null}
      <View style={styles.footer}>
        <PrimaryButton
          label="확인"
          disabled={!valid}
          onPress={() => {
            if (!valid) {
              return;
            }
            onConfirm(total);
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

export function DurationPickerSheet({
  visible,
  initialTotalMinutes,
  onConfirm,
  onClose,
}: DurationPickerSheetProps) {
  return (
    <SheetModal
      visible={visible}
      title="하루 독서 시간"
      description="매일 읽고 싶은 시간을 정해요."
      onClose={onClose}
      scrollable={false}
    >
      {visible ? (
        <DurationPickerContent
          key={`duration-${initialTotalMinutes}`}
          initialTotalMinutes={initialTotalMinutes}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      ) : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  wheels: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  column: {
    flex: 1,
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
  error: {
    ...typography.caption,
    color: readerTheme.error,
    textAlign: 'center',
  },
  footer: {
    gap: spacing.sm,
  },
});

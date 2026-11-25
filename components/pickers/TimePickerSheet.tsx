import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SheetModal } from '@/components/common/SheetModal';
import { WheelPicker } from '@/components/common/WheelPicker';
import { readerTheme } from '@/constants/readerTheme';
import { spacing, typography } from '@/constants/theme';
import {
  formatWheelClockPreview,
  hhmmToWheelClock,
  pad2,
  wheelClockToHhmm,
  WHEEL_HOUR12_VALUES,
  WHEEL_MINUTE_VALUES,
  type DayPeriod,
  type WheelClock,
} from '@/utils/wheelTime';

type TimePickerSheetProps = {
  visible: boolean;
  initialHhmm: string;
  onConfirm: (hhmm: string) => void;
  onClose: () => void;
  notificationsEnabled?: boolean;
};

const PERIODS: DayPeriod[] = ['am', 'pm'];

function TimePickerContent({
  initialHhmm,
  onConfirm,
  onClose,
  notificationsEnabled,
}: {
  initialHhmm: string;
  onConfirm: (hhmm: string) => void;
  onClose: () => void;
  notificationsEnabled: boolean;
}) {
  const seed = hhmmToWheelClock(initialHhmm) ?? { period: 'pm' as const, hour12: 9, minute: 0 };
  const [period, setPeriod] = useState<DayPeriod>(seed.period);
  const [hour12, setHour12] = useState(seed.hour12);
  const [minute, setMinute] = useState(seed.minute);
  const clock: WheelClock = { period, hour12, minute };
  const preview = formatWheelClockPreview(clock, { notifyTone: notificationsEnabled });

  return (
    <>
      <View style={styles.wheels}>
        <View style={[styles.column, styles.periodColumn]}>
          <WheelPicker
            values={PERIODS}
            selectedIndex={period === 'am' ? 0 : 1}
            onChangeIndex={(index) => setPeriod(PERIODS[index] ?? 'am')}
            formatLabel={(value) => (value === 'am' ? '오전' : '오후')}
            accessibilityLabel="오전 오후"
            width="100%"
          />
        </View>
        <View style={styles.column}>
          <WheelPicker
            values={WHEEL_HOUR12_VALUES}
            selectedIndex={Math.max(0, WHEEL_HOUR12_VALUES.indexOf(hour12 as (typeof WHEEL_HOUR12_VALUES)[number]))}
            onChangeIndex={(index) => setHour12(WHEEL_HOUR12_VALUES[index] ?? 12)}
            formatLabel={(value) => `${value}`}
            accessibilityLabel="시"
            width="100%"
          />
          <Text style={styles.unit}>시</Text>
        </View>
        <View style={styles.column}>
          <WheelPicker
            values={WHEEL_MINUTE_VALUES}
            selectedIndex={minute}
            onChangeIndex={(index) => setMinute(WHEEL_MINUTE_VALUES[index] ?? 0)}
            formatLabel={(value) => pad2(value)}
            accessibilityLabel="분"
            width="100%"
          />
          <Text style={styles.unit}>분</Text>
        </View>
      </View>
      <Text style={styles.preview}>{preview}</Text>
      <View style={styles.footer}>
        <PrimaryButton
          label="확인"
          onPress={() => {
            onConfirm(wheelClockToHhmm(clock));
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

export function TimePickerSheet({
  visible,
  initialHhmm,
  onConfirm,
  onClose,
  notificationsEnabled = true,
}: TimePickerSheetProps) {
  return (
    <SheetModal
      visible={visible}
      title="독서 알림 시간"
      description="독서를 시작할 시간을 정해요."
      onClose={onClose}
      scrollable={false}
    >
      {visible ? (
        <TimePickerContent
          key={`time-${initialHhmm}`}
          initialHhmm={initialHhmm}
          onConfirm={onConfirm}
          onClose={onClose}
          notificationsEnabled={notificationsEnabled}
        />
      ) : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  wheels: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  periodColumn: {
    flex: 1.15,
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

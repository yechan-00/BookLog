import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SheetModal } from '@/components/common/SheetModal';
import { readerTheme } from '@/constants/readerTheme';
import { spacing, typography } from '@/constants/theme';

type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  dismissOnBackdrop?: boolean;
  icon?: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  destructive = false,
  dismissOnBackdrop = true,
  icon,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const handleConfirm = async () => {
    if (busyRef.current) {
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      title={title}
      description={message}
      onClose={onCancel}
      dismissOnBackdrop={dismissOnBackdrop && !busy}
      showCloseButton={!busy}
      footer={
        <View style={styles.actions}>
          <PrimaryButton
            label={confirmLabel}
            onPress={() => {
              void handleConfirm();
            }}
            loading={busy}
            disabled={busy}
            primaryColor={destructive ? readerTheme.error : readerTheme.primary}
            primaryPressedColor={destructive ? '#943F36' : readerTheme.primaryDeep}
            onPrimaryColor={readerTheme.onPrimary}
          />
          <PrimaryButton
            label={cancelLabel}
            variant="secondary"
            onPress={onCancel}
            disabled={busy}
          />
        </View>
      }
    >
      {icon ? <View style={styles.iconWrap}>{icon}</View> : <View />}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
});

export function ConfirmSheetMessage({ children }: { children: string }) {
  return <Text style={stylesMessage.text}>{children}</Text>;
}

const stylesMessage = StyleSheet.create({
  text: {
    ...typography.body,
    color: readerTheme.textSecondary,
  },
});

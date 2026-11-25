import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { readerTheme } from '@/constants/readerTheme';
import { spacing, typography } from '@/constants/theme';

type ToastState = { id: number; message: string } | null;

let toastId = 0;
let pushToast: ((message: string) => void) | null = null;

export function showAppToast(message: string): void {
  pushToast?.(message);
}

export function AppToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState>(null);
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    pushToast = (message: string) => {
      toastId += 1;
      setToast({ id: toastId, message });
    };
    return () => {
      pushToast = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast((current) => (current?.id === toast.id ? null : current));
      }
    });
  }, [toast, opacity]);

  if (!toast) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          opacity,
          bottom: Math.max(insets.bottom, 8) + 56,
        },
      ]}
    >
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: readerTheme.primaryDeep,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    zIndex: 100,
  },
  text: {
    ...typography.bodyStrong,
    color: readerTheme.onPrimary,
    textAlign: 'center',
  },
});

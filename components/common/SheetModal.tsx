import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { readerTheme } from '@/constants/readerTheme';
import { spacing, typography } from '@/constants/theme';

type SheetModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  avoidKeyboard?: boolean;
  description?: string;
  /** When false, dim tap does not dismiss (Android back still uses onClose). */
  dismissOnBackdrop?: boolean;
  footer?: ReactNode;
  /** Hide the text close control when false. */
  showCloseButton?: boolean;
  /** Disable body ScrollView (needed for nested Wheel pickers). */
  scrollable?: boolean;
};

const OPEN_MS = 250;
const CLOSE_MS = 200;

export function SheetModal({
  visible,
  title,
  onClose,
  children,
  avoidKeyboard = false,
  description,
  dismissOnBackdrop = true,
  footer,
  showCloseButton = true,
  scrollable = true,
}: SheetModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [rendered, setRendered] = useState(visible);
  const [dim] = useState(() => new Animated.Value(0));
  const [sheetY] = useState(() => new Animated.Value(windowHeight));
  const reduceMotionRef = useRef(false);

  if (visible && !rendered) {
    setRendered(true);
  }

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        reduceMotionRef.current = enabled;
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (visible) {
      const duration = reduceMotionRef.current ? 1 : OPEN_MS;
      sheetY.setValue(windowHeight * 0.25);
      Animated.parallel([
        Animated.timing(dim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(sheetY, { toValue: 0, duration, useNativeDriver: true }),
      ]).start();
      return;
    }

    if (!rendered) {
      return;
    }

    const duration = reduceMotionRef.current ? 1 : CLOSE_MS;
    Animated.parallel([
      Animated.timing(dim, { toValue: 0, duration, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: windowHeight * 0.35, duration, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        setRendered(false);
      }
    });
  }, [visible, dim, sheetY, windowHeight, rendered]);

  if (!rendered) {
    return null;
  }

  const maxBody = Math.round(windowHeight * 0.72);

  return (
    <Modal visible={rendered} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={avoidKeyboard ? (Platform.OS === 'ios' ? 'padding' : 'height') : undefined}
        enabled={avoidKeyboard}
      >
        <View style={styles.root}>
          <Animated.View style={[styles.dim, { opacity: dim }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              style={styles.backdrop}
              onPress={dismissOnBackdrop ? onClose : undefined}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md,
                transform: [{ translateY: sheetY }],
                maxHeight: Math.round(windowHeight * 0.9),
              },
            ]}
          >
            <View style={styles.handle} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                {description ? <Text style={styles.description}>{description}</Text> : null}
              </View>
              {showCloseButton ? (
                <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} hitSlop={8}>
                  <Text style={styles.close}>닫기</Text>
                </Pressable>
              ) : null}
            </View>
            {scrollable ? (
              <ScrollView
                style={{ maxHeight: maxBody }}
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={[styles.body, { maxHeight: maxBody }]}>{children}</View>
            )}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: readerTheme.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: readerTheme.border,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: readerTheme.text,
  },
  description: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
    color: readerTheme.textSecondary,
  },
  close: {
    ...typography.body,
    color: readerTheme.textSecondary,
    paddingTop: 2,
  },
  body: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  footer: {
    gap: spacing.sm,
  },
});

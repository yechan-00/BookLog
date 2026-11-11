import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spineHeightFor } from '@/utils/spineStyle';

type BookSpineProps = {
  title: string;
  color: string;
  onPress?: () => void;
  /** Display width in points. Omitted width keeps the original spine. */
  width?: number | null;
  /** Stable seed for height. Defaults to the title. */
  id?: string;
  /**
   * Reserved for a later dust layer. 0 is a clean spine.
   * This version does not draw dust.
   */
  dustLevel?: number;
};

export function BookSpine({ title, color, onPress, width, id }: BookSpineProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const seed = id?.trim() || title;
  const height = spineHeightFor(seed);
  const spineWidth = width ?? 36;
  const titleTrack = Math.max(height - 28, 72);

  const setPressed = (pressed: boolean) => {
    Animated.spring(scale, {
      toValue: pressed ? 0.96 : 1,
      friction: 7,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <Animated.View
        style={[
          styles.spine,
          {
            backgroundColor: color,
            width: spineWidth,
            height,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.bandTop} />
        <View style={[styles.titleWrap, { width: titleTrack }]}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.title, { width: titleTrack - 6 }]}>
            {title}
          </Text>
        </View>
        <View style={styles.bandBottom} />
        <View style={styles.edge} pointerEvents="none" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  spine: {
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60, 42, 30, 0.28)',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingVertical: 8,
    shadowColor: colors.darkBrown,
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  bandTop: {
    width: '62%',
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(251, 247, 241, 0.38)',
  },
  bandBottom: {
    width: '62%',
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(251, 247, 241, 0.28)',
  },
  edge: {
    ...StyleSheet.absoluteFill,
    borderRightWidth: 2,
    borderRightColor: 'rgba(251, 247, 241, 0.12)',
  },
  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  title: {
    textAlign: 'center',
    color: colors.coverText,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
});

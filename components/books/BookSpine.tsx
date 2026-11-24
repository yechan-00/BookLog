import { useEffect, useState } from 'react';
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
  /** 0 is clean. Higher levels add a light dust veil. */
  dustLevel?: number;
  accessibilityHint?: string;
};

export function BookSpine({
  title,
  color,
  onPress,
  width,
  id,
  dustLevel = 0,
  accessibilityHint,
}: BookSpineProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const [dustOpacity] = useState(() => new Animated.Value(dustVeil(dustLevel)));
  const seed = id?.trim() || title;
  const height = spineHeightFor(seed);
  const spineWidth = width ?? 36;
  const showTitle = spineWidth >= 26;
  const titleTrack = Math.max(height - 28, 72);
  const level = Math.max(0, Math.min(3, Math.round(dustLevel)));

  useEffect(() => {
    Animated.timing(dustOpacity, {
      toValue: dustVeil(level),
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [dustOpacity, level]);

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
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      hitSlop={level > 0 ? 4 : 2}
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
        {showTitle ? (
          <View style={[styles.titleWrap, { width: titleTrack }]}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.title, { width: titleTrack - 6 }]}>
              {title}
            </Text>
          </View>
        ) : (
          <View style={styles.titlePlaceholder} />
        )}
        <View style={styles.bandBottom} />
        <View style={styles.edge} pointerEvents="none" />
        {level > 0 ? (
          <Animated.View pointerEvents="none" style={[styles.dustVeil, { opacity: dustOpacity }]}>
            {dustSpecks(level).map((speck) => (
              <View
                key={speck.key}
                style={[
                  styles.speck,
                  {
                    width: speck.size,
                    height: speck.size,
                    left: `${speck.x}%`,
                    top: `${speck.y}%`,
                    opacity: speck.opacity,
                  },
                ]}
              />
            ))}
          </Animated.View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function dustVeil(level: number): number {
  if (level <= 0) {
    return 0;
  }
  if (level === 1) {
    return 0.18;
  }
  if (level === 2) {
    return 0.32;
  }
  return 0.46;
}

function dustSpecks(level: number) {
  const count = level === 1 ? 3 : level === 2 ? 5 : 7;
  return Array.from({ length: count }, (_, index) => ({
    key: `speck-${index}`,
    size: 2 + (index % 2),
    x: 18 + ((index * 17) % 64),
    y: 12 + ((index * 23) % 70),
    opacity: 0.35 + (index % 3) * 0.12,
  }));
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
  titlePlaceholder: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    color: colors.coverText,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  dustVeil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(196, 186, 170, 0.35)',
  },
  speck: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(90, 78, 64, 0.55)',
  },
});

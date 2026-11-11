import { useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { libraryTheme } from '@/constants/libraryTheme';

export type ShelfBookCoverProps = {
  id: string;
  title: string;
  author: string;
  color: string;
  width: number;
  height: number;
  imageUrl?: string | null;
  onPress?: () => void;
  /**
   * Reserved for a later dust overlay. 0 is clean.
   * This version does not draw dust.
   */
  dustLevel?: number;
};

export function ShelfBookCover({
  title,
  author,
  color,
  width,
  height,
  imageUrl,
  onPress,
}: ShelfBookCoverProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const [imageState, setImageState] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    imageUrl ? 'loading' : 'idle',
  );
  const showImage = Boolean(imageUrl) && imageState !== 'error';
  const thickness = Math.max(3, Math.round(width * 0.06));

  const setPressed = (pressed: boolean) => {
    Animated.spring(scale, {
      toValue: pressed ? 0.97 : 1,
      friction: 8,
      tension: 170,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${author ? `, ${author}` : ''}`}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{ width: width + thickness }}
    >
      <Animated.View style={[styles.lift, { transform: [{ scale }] }]}>
        <View style={[styles.shadow, { width: width * 0.92, left: thickness + width * 0.04 }]} />
        <View style={styles.bookRow}>
          <View style={[styles.thickness, { width: thickness, height, backgroundColor: shade(color, -0.18) }]} />
          <View style={[styles.cover, { width, height, backgroundColor: color }]}>
            {showImage ? (
              <Image
                source={{ uri: imageUrl! }}
                style={styles.image}
                resizeMode="cover"
                onLoadStart={() => setImageState('loading')}
                onLoad={() => setImageState('ready')}
                onError={() => setImageState('error')}
              />
            ) : (
              <View style={styles.fallback}>
                <Text numberOfLines={4} style={styles.fallbackTitle}>
                  {title}
                </Text>
                {author ? (
                  <Text numberOfLines={2} style={styles.fallbackAuthor}>
                    {author}
                  </Text>
                ) : null}
              </View>
            )}
            {imageState === 'loading' && imageUrl ? <View style={styles.loadingVeil} /> : null}
            <View style={styles.edgeHighlight} pointerEvents="none" />
            <View style={styles.dustSlot} pointerEvents="none" />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function shade(hex: string, amount: number): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) {
    return libraryTheme.woodDark;
  }

  const channels = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(value.slice(offset, offset + 2), 16);
    return Math.max(0, Math.min(255, Math.round(channel * (1 + amount))));
  });

  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

const styles = StyleSheet.create({
  lift: {
    alignItems: 'flex-start',
  },
  shadow: {
    position: 'absolute',
    bottom: 1,
    height: 6,
    borderRadius: 8,
    backgroundColor: libraryTheme.coverShadow,
    opacity: 0.35,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  thickness: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  cover: {
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(51, 39, 31, 0.18)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  fallback: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'flex-end',
    gap: 6,
  },
  fallbackTitle: {
    color: libraryTheme.onPrimary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  fallbackAuthor: {
    color: 'rgba(255, 252, 247, 0.82)',
    fontSize: 10,
    lineHeight: 13,
  },
  loadingVeil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(247, 243, 235, 0.28)',
  },
  edgeHighlight: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(255, 252, 247, 0.22)',
  },
  dustSlot: {
    ...StyleSheet.absoluteFill,
  },
});

import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

type BookCoverProps = {
  title: string;
  color: string;
  width?: number;
  height?: number;
  cornerRadius?: number;
  imageUrl?: string;
  /** When true, missing/failed images show a blank tint instead of the title. */
  hideTitleFallback?: boolean;
};

export function BookCover({
  title,
  color,
  width = 56,
  height,
  cornerRadius = 4,
  imageUrl,
  hideTitleFallback = false,
}: BookCoverProps) {
  const coverHeight = height ?? Math.round(width * 1.48);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <View
      style={[
        styles.cover,
        { width, height: coverHeight, backgroundColor: color, borderRadius: cornerRadius },
      ]}
    >
      <View style={styles.edge} />
      {showImage ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          onError={() => setImageFailed(true)}
        />
      ) : hideTitleFallback ? null : (
        <Text numberOfLines={4} style={styles.title}>
          {title}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 4,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'flex-end',
  },
  edge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: 'rgba(255, 251, 245, 0.28)',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  title: {
    color: colors.coverText,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
});

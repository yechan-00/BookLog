import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

type BookCoverProps = {
  title: string;
  color: string;
  width?: number;
  imageUrl?: string;
};

export function BookCover({ title, color, width = 56, imageUrl }: BookCoverProps) {
  const height = Math.round(width * 1.48);

  return (
    <View style={[styles.cover, { width, height, backgroundColor: color }]}>
      <View style={styles.edge} />
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
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

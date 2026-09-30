import { Pressable, StyleSheet, Text, View } from 'react-native';

type BookSpineProps = {
  title: string;
  color: string;
  onPress?: () => void;
  /**
   * Reserved for a later dust layer. 0 is a clean spine.
   * This version does not draw dust.
   */
  dustLevel?: number;
};

export function BookSpine({ title, color, onPress }: BookSpineProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.spine, { backgroundColor: color }, pressed && styles.pressed]}
    >
      <View style={styles.titleWrap}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  spine: {
    width: 36,
    height: 132,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.82,
  },
  titleWrap: {
    width: 118,
    alignItems: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  title: {
    width: 112,
    textAlign: 'center',
    color: '#FBF7F1',
    fontSize: 11,
    fontWeight: '700',
  },
});

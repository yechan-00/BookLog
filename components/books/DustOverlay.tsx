import { StyleSheet, View } from 'react-native';

type DustOverlayProps = {
  /** 0 is clean (draws nothing), 3 is the heaviest dust. */
  level: number;
};

// Dust settles on the top edge first, so each level thickens a pale cap there and scatters specks
// mostly in the upper part. The values are tuned to stay visible on both dark and light covers.
const CAP_HEIGHT = [0, 10, 16, 24];
const VEIL_ALPHA = [0, 0.1, 0.16, 0.24];
const SPECK_COUNT = [0, 6, 10, 14];
// The cap stands in for a gradient: layers all start at the top edge and reach further down one by one,
// so the overlap is thickest at the top and there are no seams between bands.
const CAP_LAYERS = 10;
const CAP_LAYER_ALPHA = 0.17;

const DUST_RGB = '236, 229, 217';

/** Pale dust drawn over a spine or cover. The parent must clip (`overflow: 'hidden'`). */
export function DustOverlay({ level }: DustOverlayProps) {
  const step = Math.max(0, Math.min(3, Math.round(level)));
  if (step === 0) {
    return null;
  }

  const capHeight = CAP_HEIGHT[step];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(${DUST_RGB}, ${VEIL_ALPHA[step]})` }]} />
      {Array.from({ length: CAP_LAYERS }, (_, index) => (
        <View
          key={`cap-${index}`}
          style={[styles.capLayer, { height: (capHeight * (index + 1)) / CAP_LAYERS }]}
        />
      ))}
      {dustSpecks(step).map((speck) => (
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
    </View>
  );
}

// R2 low-discrepancy sequence: spreads specks evenly without lining them up, and stays stable per index.
const R2_X = 0.7548776662;
const R2_Y = 0.5698402910;

function fraction(value: number): number {
  return value - Math.floor(value);
}

function dustSpecks(step: number) {
  return Array.from({ length: SPECK_COUNT[step] }, (_, index) => {
    const spreadY = fraction(0.5 + R2_Y * (index + 1));
    return {
      key: `speck-${index}`,
      size: 2 + (index % 3) * 0.75,
      x: 8 + fraction(0.5 + R2_X * (index + 1)) * 80,
      // Most specks sit in the top third, every fourth drifts lower.
      y: index % 4 === 3 ? 40 + spreadY * 50 : 3 + spreadY * 30,
      opacity: 0.45 + (index % 3) * 0.15,
    };
  });
}

const styles = StyleSheet.create({
  capLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: `rgba(${DUST_RGB}, ${CAP_LAYER_ALPHA})`,
  },
  speck: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: `rgba(${DUST_RGB}, 1)`,
  },
});

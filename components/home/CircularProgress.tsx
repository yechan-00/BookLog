import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { homeTheme } from '@/constants/homeTheme';

type CircularProgressProps = {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: ReactNode;
};

/**
 * Donut progress without SVG.
 * Right half covers 0–50%, left half covers 50–100%.
 */
export function CircularProgress({
  percent,
  size = 96,
  strokeWidth = 10,
  color = homeTheme.progress,
  trackColor = homeTheme.progressTrack,
  children,
}: CircularProgressProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const rightSpin = Math.min(clamped, 50) / 50;
  const leftSpin = Math.max(clamped - 50, 0) / 50;
  const half = size / 2;
  const inner = size - strokeWidth * 2;

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
    >
      <View
        style={[
          styles.layer,
          {
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: strokeWidth,
            borderColor: trackColor,
          },
        ]}
      />

      {/* 0–50%: right half */}
      <View style={[styles.clip, { width: half, height: size, left: half }]}>
        <View
          style={[
            styles.spinner,
            {
              width: size,
              height: size,
              borderRadius: half,
              borderWidth: strokeWidth,
              borderColor: color,
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
              left: -half,
              transform: [{ rotate: `${-135 + rightSpin * 180}deg` }],
            },
          ]}
        />
      </View>

      {/* 50–100%: left half */}
      <View style={[styles.clip, { width: half, height: size, left: 0 }]}>
        <View
          style={[
            styles.spinner,
            {
              width: size,
              height: size,
              borderRadius: half,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              opacity: clamped > 50 ? 1 : 0,
              transform: [{ rotate: `${45 + leftSpin * 180}deg` }],
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.hole,
          {
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            top: strokeWidth,
            left: strokeWidth,
            backgroundColor: homeTheme.surface,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
  },
  clip: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  spinner: {
    position: 'absolute',
    top: 0,
  },
  hole: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

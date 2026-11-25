import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { readerTheme } from '@/constants/readerTheme';

const DEFAULT_ROW = 44;
const VISIBLE_ROWS = 5;

type WheelPickerProps<T> = {
  values: readonly T[];
  selectedIndex: number;
  onChangeIndex: (index: number) => void;
  formatLabel: (value: T, index: number) => string;
  width?: number | `${number}%`;
  rowHeight?: number;
  accessibilityLabel?: string;
};

export function WheelPicker<T>({
  values,
  selectedIndex,
  onChangeIndex,
  formatLabel,
  width = '100%',
  rowHeight = DEFAULT_ROW,
  accessibilityLabel,
}: WheelPickerProps<T>) {
  const listRef = useRef<FlatList<T>>(null);
  const pendingIndex = useRef(selectedIndex);
  const pad = useMemo(() => Array.from({ length: 2 }, () => null as unknown as T), []);
  const data = useMemo(() => [...pad, ...values, ...pad], [pad, values]);
  const height = rowHeight * VISIBLE_ROWS;

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      const safe = Math.max(0, Math.min(values.length - 1, index));
      listRef.current?.scrollToOffset({ offset: safe * rowHeight, animated });
    },
    [rowHeight, values.length],
  );

  useEffect(() => {
    pendingIndex.current = selectedIndex;
    const id = requestAnimationFrame(() => {
      scrollToIndex(selectedIndex, false);
    });
    return () => cancelAnimationFrame(id);
  }, [selectedIndex, scrollToIndex, values.length]);

  const commitOffset = (offsetY: number) => {
    const raw = Math.round(offsetY / rowHeight);
    const next = Math.max(0, Math.min(values.length - 1, raw));
    pendingIndex.current = next;
    if (next !== selectedIndex) {
      onChangeIndex(next);
    }
  };

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    commitOffset(event.nativeEvent.contentOffset.y);
  };

  const onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const velocity = event.nativeEvent.velocity?.y ?? 0;
    if (Math.abs(velocity) < 0.05) {
      commitOffset(offsetY);
      scrollToIndex(Math.round(offsetY / rowHeight), true);
    }
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<T>) => {
    if (index < 2 || index >= values.length + 2) {
      return <View style={{ height: rowHeight }} />;
    }
    const valueIndex = index - 2;
    const selected = valueIndex === selectedIndex;
    const distance = Math.abs(valueIndex - selectedIndex);
    return (
      <View style={[styles.row, { height: rowHeight }]}>
        <Text
          style={[
            styles.label,
            selected && styles.labelSelected,
            distance >= 2 && styles.labelFar,
          ]}
          numberOfLines={1}
        >
          {formatLabel(item, valueIndex)}
        </Text>
      </View>
    );
  };

  return (
    <View
      style={[styles.wrap, { width, height }]}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{
        text: values[selectedIndex] !== undefined ? formatLabel(values[selectedIndex] as T, selectedIndex) : undefined,
      }}
      accessibilityActions={[
        { name: 'increment' },
        { name: 'decrement' },
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment' && selectedIndex < values.length - 1) {
          onChangeIndex(selectedIndex + 1);
        }
        if (event.nativeEvent.actionName === 'decrement' && selectedIndex > 0) {
          onChangeIndex(selectedIndex - 1);
        }
      }}
    >
      <View pointerEvents="none" style={[styles.selection, { top: rowHeight * 2, height: rowHeight }]} />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, index) => `wheel-${index}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={rowHeight}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: rowHeight, offset: rowHeight * index, index })}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onScrollEndDrag}
        nestedScrollEnabled
      />
    </View>
  );
}

/** Read the last snapped index even if React state has not flushed yet. */
export function createWheelIndexRef(initial: number) {
  return { current: initial };
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  selection: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 12,
    backgroundColor: readerTheme.soft,
    zIndex: 0,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: 20,
    lineHeight: 26,
    color: readerTheme.textSecondary,
    fontWeight: '500',
  },
  labelSelected: {
    fontSize: 26,
    lineHeight: 32,
    color: readerTheme.text,
    fontWeight: '700',
  },
  labelFar: {
    opacity: 0.55,
  },
});

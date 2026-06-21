import React, { useCallback, useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { borderRadius, brandColors, fontSize, spacing } from '../../constants/colors';
import type { AppTheme } from '../../theme';

export const WHEEL_ITEM_HEIGHT = 44;
export const WHEEL_VISIBLE_ROWS = 5;
const WHEEL_PADDING_ROWS = Math.floor(WHEEL_VISIBLE_ROWS / 2);

export type WheelPickerItem<T extends string | number> = {
  value: T;
  label: string;
};

interface WheelPickerColumnProps<T extends string | number> {
  items: WheelPickerItem<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  theme: AppTheme;
  style?: ViewStyle;
}

const getItemOpacity = (index: number, selectedIndex: number) => {
  const distance = Math.abs(index - selectedIndex);

  if (distance === 0) {
    return 1;
  }

  if (distance === 1) {
    return 0.5;
  }

  return 0.24;
};

const getItemTextStyle = (
  index: number,
  selectedIndex: number,
  theme: AppTheme,
): TextStyle => {
  const isSelected = index === selectedIndex;

  return {
    fontSize: isSelected ? fontSize.base : fontSize.sm,
    fontWeight: isSelected ? '800' : '600',
    color: isSelected
      ? theme.isDark
        ? '#ffffff'
        : brandColors.navy
      : theme.colors.textMuted,
    opacity: getItemOpacity(index, selectedIndex),
    textAlign: 'center',
    textTransform: 'capitalize',
  };
};

export function WheelPickerColumn<T extends string | number>({
  items,
  selectedValue,
  onValueChange,
  theme,
  style,
}: WheelPickerColumnProps<T>) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === selectedValue),
  );
  const isUserDraggingRef = useRef(false);

  const scrollToIndex = useCallback((index: number, animated: boolean) => {
    scrollRef.current?.scrollTo({
      y: index * WHEEL_ITEM_HEIGHT,
      animated,
    });
  }, []);

  useEffect(() => {
    if (isUserDraggingRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      scrollToIndex(selectedIndex, false);
    }, 0);

    return () => clearTimeout(timer);
  }, [items, selectedIndex, scrollToIndex]);

  const commitIndex = (offsetY: number) => {
    const nextIndex = Math.round(offsetY / WHEEL_ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, nextIndex));
    const nextValue = items[clampedIndex]?.value;

    if (nextValue !== undefined && nextValue !== selectedValue) {
      onValueChange(nextValue);
    }

    scrollToIndex(clampedIndex, true);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserDraggingRef.current = false;
    commitIndex(event.nativeEvent.contentOffset.y);
  };

  return (
    <View style={[styles.column, style]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        disableIntervalMomentum
        onScrollBeginDrag={() => {
          isUserDraggingRef.current = true;
        }}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{
          paddingVertical: WHEEL_PADDING_ROWS * WHEEL_ITEM_HEIGHT,
        }}
      >
        {items.map((item, index) => (
          <View key={String(item.value)} style={styles.item}>
            <Text style={getItemTextStyle(index, selectedIndex, theme)}>{item.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS,
    overflow: 'hidden',
  },
  item: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
});

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, brandColors, fontSize, spacing } from '../../constants/colors';
import { formatLocalDate } from '../../utils/date';
import type { AppTheme } from '../../theme';
import { buildBirthYearOptions } from './BirthdateYearPicker';
import {
  WHEEL_ITEM_HEIGHT,
  WHEEL_VISIBLE_ROWS,
  WheelPickerColumn,
  type WheelPickerItem,
} from './WheelPickerColumn';

const WHEEL_PADDING_ROWS = Math.floor(WHEEL_VISIBLE_ROWS / 2);

const MONTH_ITEMS: WheelPickerItem<number>[] = Array.from({ length: 12 }, (_, monthIndex) => ({
  value: monthIndex,
  label: formatLocalDate(new Date(2020, monthIndex, 1, 12, 0, 0, 0), {
    month: 'long',
  }),
}));

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const clampDay = (year: number, month: number, day: number) =>
  Math.min(day, getDaysInMonth(year, month));

interface BirthdateWheelPickerProps {
  year: number;
  month: number;
  day: number;
  minDateKey: string | null;
  maxDateKey: string | null;
  onChange: (next: { year: number; month: number; day: number }) => void;
  theme: AppTheme;
}

export const BirthdateWheelPicker: React.FC<BirthdateWheelPickerProps> = ({
  year,
  month,
  day,
  minDateKey,
  maxDateKey,
  onChange,
  theme,
}) => {
  const yearItems = useMemo(() => {
    const years = buildBirthYearOptions(minDateKey, maxDateKey).reverse();

    return years.map((value) => ({
      value,
      label: `${value}`,
    }));
  }, [maxDateKey, minDateKey]);

  const dayItems = useMemo(() => {
    const totalDays = getDaysInMonth(year, month);

    return Array.from({ length: totalDays }, (_, index) => {
      const value = index + 1;

      return {
        value,
        label: `${value}`,
      };
    });
  }, [month, year]);

  const safeDay = clampDay(year, month, day);

  const handleYearChange = (nextYear: number) => {
    const nextDay = clampDay(nextYear, month, safeDay);
    onChange({ year: nextYear, month, day: nextDay });
  };

  const handleMonthChange = (nextMonth: number) => {
    const nextDay = clampDay(year, nextMonth, safeDay);
    onChange({ year, month: nextMonth, day: nextDay });
  };

  const handleDayChange = (nextDay: number) => {
    onChange({ year, month, day: nextDay });
  };

  const previewLabel = formatLocalDate(new Date(year, month, safeDay, 12, 0, 0, 0), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const fadeTopColors: [string, string] = theme.isDark
    ? ['rgba(15, 23, 42, 0.95)', 'rgba(15, 23, 42, 0)']
    : ['rgba(255, 255, 255, 0.96)', 'rgba(255, 255, 255, 0)'];

  const fadeBottomColors: [string, string] = theme.isDark
    ? ['rgba(15, 23, 42, 0)', 'rgba(15, 23, 42, 0.95)']
    : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.96)'];

  return (
    <View style={styles.container}>
      <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
        Gira día, mes y año para elegir tu fecha de nacimiento
      </Text>

      <View
        style={[
          styles.wheelFrame,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.inputBackground,
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.selectionBand,
            {
              backgroundColor: `${brandColors.sky}24`,
              borderColor: `${brandColors.sky}66`,
            },
          ]}
        />

        <View style={styles.columns}>
          <WheelPickerColumn
            items={dayItems}
            selectedValue={safeDay}
            onValueChange={handleDayChange}
            theme={theme}
            style={styles.dayColumn}
          />
          <WheelPickerColumn
            items={MONTH_ITEMS}
            selectedValue={month}
            onValueChange={handleMonthChange}
            theme={theme}
            style={styles.monthColumn}
          />
          <WheelPickerColumn
            items={yearItems}
            selectedValue={year}
            onValueChange={handleYearChange}
            theme={theme}
            style={styles.yearColumn}
          />
        </View>

        <LinearGradient
          pointerEvents="none"
          colors={fadeTopColors}
          style={styles.fadeTop}
        />
        <LinearGradient
          pointerEvents="none"
          colors={fadeBottomColors}
          style={styles.fadeBottom}
        />
      </View>

      <View
        style={[
          styles.preview,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceAlt,
          },
        ]}
      >
        <Text style={[styles.previewLabel, { color: theme.colors.textMuted }]}>
          Fecha seleccionada
        </Text>
        <Text style={[styles.previewValue, { color: theme.colors.textPrimary }]}>
          {previewLabel}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  hint: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  wheelFrame: {
    position: 'relative',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS,
  },
  selectionBand: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    top: WHEEL_PADDING_ROWS * WHEEL_ITEM_HEIGHT,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    zIndex: 2,
  },
  columns: {
    flexDirection: 'row',
    zIndex: 1,
  },
  monthColumn: {
    flex: 1.35,
  },
  dayColumn: {
    flex: 0.55,
  },
  yearColumn: {
    flex: 0.8,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_HEIGHT * 1.6,
    zIndex: 3,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_HEIGHT * 1.6,
    zIndex: 3,
  },
  preview: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  previewLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  previewValue: {
    fontSize: fontSize.base,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});

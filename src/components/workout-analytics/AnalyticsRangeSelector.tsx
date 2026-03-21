import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, fontSize, spacing } from '../../constants/colors';
import { WORKOUT_ANALYTICS_RANGE_OPTIONS } from '../../constants/workoutAnalytics';
import type { WorkoutAnalyticsRange } from '../../types';

interface AnalyticsRangeSelectorProps {
  value: WorkoutAnalyticsRange;
  onChange: (nextValue: WorkoutAnalyticsRange) => void;
}

export const AnalyticsRangeSelector: React.FC<AnalyticsRangeSelectorProps> = ({
  value,
  onChange,
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.content}
  >
    {WORKOUT_ANALYTICS_RANGE_OPTIONS.map((option) => {
      const isActive = option.value === value;

      return (
        <TouchableOpacity
          key={option.value}
          activeOpacity={0.85}
          onPress={() => onChange(option.value)}
          style={[styles.pill, isActive ? styles.pillActive : null]}
        >
          <Text style={[styles.pillText, isActive ? styles.pillTextActive : null]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
  pill: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pillActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  pillText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[600],
  },
  pillTextActive: {
    color: colors.white,
  },
});

export default AnalyticsRangeSelector;

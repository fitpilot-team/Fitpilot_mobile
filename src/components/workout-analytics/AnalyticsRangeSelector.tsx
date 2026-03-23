import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { WORKOUT_ANALYTICS_RANGE_OPTIONS } from '../../constants/workoutAnalytics';
import { useThemedStyles, type AppTheme } from '../../theme';
import type { WorkoutAnalyticsRange } from '../../types';

interface AnalyticsRangeSelectorProps {
  value: WorkoutAnalyticsRange;
  onChange: (nextValue: WorkoutAnalyticsRange) => void;
}

export const AnalyticsRangeSelector: React.FC<AnalyticsRangeSelectorProps> = ({
  value,
  onChange,
}) => {
  const styles = useThemedStyles(createStyles);

  return (
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
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    content: {
      gap: spacing.sm,
    },
    pill: {
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    pillActive: {
      backgroundColor: theme.isDark ? theme.colors.primarySoft : theme.colors.primary,
      borderColor: theme.isDark ? theme.colors.primaryBorder : theme.colors.primary,
    },
    pillText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    pillTextActive: {
      color: theme.isDark ? theme.colors.primary : theme.colors.surface,
    },
  });

export default AnalyticsRangeSelector;

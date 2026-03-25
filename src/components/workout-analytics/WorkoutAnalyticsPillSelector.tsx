import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useThemedStyles, type AppTheme } from '../../theme';

type PillSelectorItem = {
  value: string;
  label: string;
};

interface WorkoutAnalyticsPillSelectorProps {
  items: PillSelectorItem[];
  value: string;
  onChange: (nextValue: string) => void;
}

export const WorkoutAnalyticsPillSelector: React.FC<WorkoutAnalyticsPillSelectorProps> = ({
  items,
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
      {items.map((item) => {
        const isActive = item.value === value;

        return (
          <TouchableOpacity
            key={item.value}
            activeOpacity={0.86}
            onPress={() => onChange(item.value)}
            style={[styles.pill, isActive ? styles.pillActive : null]}
          >
            <Text style={[styles.pillText, isActive ? styles.pillTextActive : null]}>{item.label}</Text>
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
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    pillTextActive: {
      color: theme.isDark ? theme.colors.primary : theme.colors.surface,
    },
  });

export default WorkoutAnalyticsPillSelector;

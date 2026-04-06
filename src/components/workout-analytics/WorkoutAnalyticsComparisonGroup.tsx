import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../common';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import type { WorkoutAnalyticsComparisonGroupSection } from '../../types';
import { useThemedStyles, type AppTheme } from '../../theme';

interface WorkoutAnalyticsComparisonGroupProps {
  section: WorkoutAnalyticsComparisonGroupSection;
}

export const WorkoutAnalyticsComparisonGroup: React.FC<WorkoutAnalyticsComparisonGroupProps> = ({ section }) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{section.title}</Text>
        {section.subtitle ? <Text style={styles.subtitle}>{section.subtitle}</Text> : null}
      </View>

      <View style={styles.items}>
        {section.items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{item.label}</Text>
              <Text
                style={[
                  styles.status,
                  item.availability === 'available'
                    ? styles.statusAvailable
                    : item.availability === 'partial'
                      ? styles.statusPartial
                      : styles.statusUnavailable,
                ]}
              >
                {item.availability === 'available'
                  ? 'Listo'
                  : item.availability === 'partial'
                    ? 'Parcial'
                    : 'Sin base'}
              </Text>
            </View>

            <View style={styles.valuesRow}>
              <View style={styles.valueBlock}>
                <Text style={styles.valueLabel}>Planeado</Text>
                <Text style={styles.valueText}>{item.planned_display}</Text>
              </View>
              <View style={styles.valueBlock}>
                <Text style={styles.valueLabel}>Ejecutado</Text>
                <Text style={styles.valueText}>{item.actual_display}</Text>
              </View>
            </View>

            {item.helper_text ? <Text style={styles.helper}>{item.helper_text}</Text> : null}
          </View>
        ))}
      </View>
    </Card>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: spacing.md,
    },
    header: {
      gap: spacing.xs,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    items: {
      gap: spacing.sm,
    },
    itemCard: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
      alignItems: 'center',
    },
    itemTitle: {
      fontSize: fontSize.sm,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    status: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    statusAvailable: {
      color: theme.colors.success,
    },
    statusPartial: {
      color: theme.colors.warning,
    },
    statusUnavailable: {
      color: theme.colors.textMuted,
    },
    valuesRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    valueBlock: {
      flex: 1,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.background,
      padding: spacing.sm,
      gap: 4,
    },
    valueLabel: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      fontWeight: '700',
    },
    valueText: {
      fontSize: fontSize.base,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    helper: {
      fontSize: fontSize.xs,
      lineHeight: 18,
      color: theme.colors.textMuted,
    },
  });

export default WorkoutAnalyticsComparisonGroup;

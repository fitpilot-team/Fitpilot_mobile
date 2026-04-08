import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../common';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import type { WorkoutAnalyticsSnapshotSection } from '../../types';
import { useThemedStyles, type AppTheme } from '../../theme';

interface WorkoutAnalyticsSnapshotCardProps {
  section: WorkoutAnalyticsSnapshotSection;
}

export const WorkoutAnalyticsSnapshotCard: React.FC<WorkoutAnalyticsSnapshotCardProps> = ({ section }) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        {section.eyebrow ? <Text style={styles.eyebrow}>{section.eyebrow}</Text> : null}
        <Text style={styles.title}>{section.title}</Text>
        {section.subtitle ? <Text style={styles.subtitle}>{section.subtitle}</Text> : null}
      </View>

      <View style={styles.metricsGrid}>
        {section.metrics.map((metric) => (
          <View key={metric.id} style={styles.metricCard}>
            <Text style={styles.metricValue}>{metric.display_value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
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
    eyebrow: {
      fontSize: fontSize.xs,
      fontWeight: '800',
      color: theme.colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textMuted,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    metricCard: {
      minWidth: '47%',
      flexGrow: 1,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: spacing.sm,
      gap: 4,
    },
    metricValue: {
      fontSize: fontSize.lg,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    metricLabel: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  });

export default WorkoutAnalyticsSnapshotCard;

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, brandColors, colors, fontSize, shadows, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { MicrocycleMode, MicrocycleProgress } from '../../types';

interface MicrocycleStatsProps {
  microcycleProgress: MicrocycleProgress | null;
  mode: MicrocycleMode;
  onModeChange: (mode: MicrocycleMode) => void;
  isLoading?: boolean;
}

type StatCard = {
  key: string;
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
};

export const MicrocycleStats: React.FC<MicrocycleStatsProps> = ({
  microcycleProgress,
  mode,
  onModeChange,
  isLoading = false,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const plannedMetrics = microcycleProgress?.planned_metrics;
  const actualMetrics = microcycleProgress?.actual_metrics;

  const plannedStats: StatCard[] = [
    {
      key: 'sessions',
      label: 'Sesiones',
      value: plannedMetrics
        ? `${plannedMetrics.completed_planned_sessions}/${plannedMetrics.total_planned_sessions}`
        : '-',
      icon: 'checkmark-done-circle-outline',
      tint: colors.success,
    },
    {
      key: 'progress',
      label: 'Progreso',
      value: plannedMetrics?.total_planned_sessions
        ? `${plannedMetrics.next_session_position ?? plannedMetrics.total_planned_sessions}/${plannedMetrics.total_planned_sessions}`
        : '-',
      icon: 'barbell-outline',
      tint: brandColors.sky,
    },
    {
      key: 'completion',
      label: 'Cumplimiento',
      value: `${Math.round(plannedMetrics?.completion_percentage ?? 0)}%`,
      icon: 'stats-chart-outline',
      tint: brandColors.navy,
    },
  ];

  const actualStats: StatCard[] = [
    {
      key: 'executed',
      label: 'Ejecutadas',
      value: `${actualMetrics?.executed_sessions ?? 0}`,
      icon: 'flash-outline',
      tint: colors.success,
    },
    {
      key: 'active-days',
      label: 'DÃ­as activos',
      value: `${actualMetrics?.active_days ?? 0}`,
      icon: 'calendar-outline',
      tint: brandColors.sky,
    },
    {
      key: 'double-days',
      label: 'Dobles',
      value: `${actualMetrics?.double_session_days ?? 0}`,
      icon: 'layers-outline',
      tint: brandColors.navy,
    },
  ];

  const stats = mode === 'planned' ? plannedStats : actualStats;

  return (
    <View style={styles.container}>
      <View style={styles.toggleWrap}>
        <Pressable
          onPress={() => onModeChange('planned')}
          style={[styles.toggleButton, mode === 'planned' && styles.toggleButtonActive]}
        >
          <Text style={[styles.toggleLabel, mode === 'planned' && styles.toggleLabelActive]}>
            PlanificaciÃ³n
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onModeChange('actual')}
          style={[styles.toggleButton, mode === 'actual' && styles.toggleButtonActive]}
        >
          <Text style={[styles.toggleLabel, mode === 'actual' && styles.toggleLabelActive]}>
            EjecuciÃ³n real
          </Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        {stats.map((stat) => (
          <View key={stat.key} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: `${stat.tint}18` }]}>
              <Ionicons name={stat.icon} size={18} color={stat.tint} />
            </View>
            <Text style={styles.value}>{isLoading ? '...' : stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.sm,
    },
    toggleWrap: {
      flexDirection: 'row',
      alignSelf: 'center',
      marginBottom: spacing.md,
      padding: 4,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.sm,
    },
    toggleButton: {
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    toggleButtonActive: {
      backgroundColor: theme.isDark ? theme.colors.primarySoft : brandColors.navy,
    },
    toggleLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    toggleLabelActive: {
      color: theme.isDark ? theme.colors.primary : theme.colors.surface,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    card: {
      flex: 1,
      minHeight: 132,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      ...shadows.sm,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    value: {
      fontSize: fontSize['2xl'],
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    label: {
      marginTop: spacing.xs,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
  });

export default MicrocycleStats;

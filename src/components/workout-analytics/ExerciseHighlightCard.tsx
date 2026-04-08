import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, fontSize, shadows, spacing } from '../../constants/colors';
import { useThemedStyles, type AppTheme } from '../../theme';
import type { ExerciseTrendSummary } from '../../types';
import { formatLocalDate } from '../../utils/date';
import {
  formatMetricValue,
  getProfileConfig,
  getProfilePrimaryMetricLabel,
  getSummaryMetricContext,
} from '../../utils/analyticsProfiles';
import { formatVolumeKg, formatWeightKg, getTrendStatusMeta } from '../../utils/workoutAnalytics';
import { ExerciseSparkline } from './ExerciseSparkline';

const META_SEPARATOR = ' \u00b7 ';

export interface ExerciseHighlightCardProps {
  exercise: ExerciseTrendSummary;
  selectedRepBucketLabel?: string | null;
  onPress: () => void;
}

const buildLastSessionCopy = (lastPerformedOn?: string | null) => {
  if (!lastPerformedOn) {
    return 'Sin fecha reciente';
  }

  return `Ultima sesion${META_SEPARATOR}${formatLocalDate(lastPerformedOn, {
    day: 'numeric',
    month: 'short',
  })}`;
};

const buildPrimaryMetricLabel = (
  analyticsProfile: ExerciseTrendSummary['analytics_profile'],
  selectedRepBucketLabel?: string | null,
) => {
  const baseLabel = getProfilePrimaryMetricLabel(analyticsProfile);
  return selectedRepBucketLabel
    ? `${baseLabel} reciente en ${selectedRepBucketLabel}`
    : `${baseLabel} reciente`;
};

const buildPrimaryMetricValue = (exercise: ExerciseTrendSummary) => {
  const profile = getProfileConfig(exercise.analytics_profile);
  const isBodyweight = profile.id === 'bodyweight_progression';

  if (isBodyweight) {
    if (exercise.primary_metric_value == null) {
      return '-- reps';
    }

    return formatMetricValue(exercise.primary_metric_value, exercise.primary_metric_unit ?? profile.primaryUnit);
  }

  if (exercise.primary_metric_value != null) {
    return formatMetricValue(exercise.primary_metric_value, exercise.primary_metric_unit ?? profile.primaryUnit);
  }

  return formatWeightKg(exercise.best_recent_weight_kg ?? exercise.latest_best_weight_kg ?? null);
};

const buildPrimaryMetricContext = (
  exercise: ExerciseTrendSummary,
  selectedRepBucketLabel?: string | null,
) => {
  const profile = getProfileConfig(exercise.analytics_profile);
  const context = getSummaryMetricContext(exercise);

  if (!context?.reps_exact) {
    return null;
  }

  if (profile.id === 'bodyweight_progression') {
    if (typeof context.weight_kg === 'number' && context.weight_kg > 0) {
      return `Lastre: ${formatWeightKg(context.weight_kg)}`;
    }

    return null;
  }

  const parts = [`${context.reps_exact} reps`];

  if (!selectedRepBucketLabel && context.rep_bucket_label) {
    parts.push(context.rep_bucket_label);
  }

  return parts.join(META_SEPARATOR);
};

export const ExerciseHighlightCard: React.FC<ExerciseHighlightCardProps> = ({
  exercise,
  selectedRepBucketLabel,
  onPress,
}) => {
  const styles = useThemedStyles(createStyles);
  const trendMeta = getTrendStatusMeta(exercise.trend_status);
  const primaryMetricContext = buildPrimaryMetricContext(exercise, selectedRepBucketLabel);
  const statItems = [
    {
      id: 'sessions',
      label: 'Sesiones',
      value: `${exercise.sessions_count}`,
    },
    ...(exercise.total_volume_kg != null && exercise.total_volume_kg > 0
      ? [
          {
            id: 'volume',
            label: 'Volumen',
            value: formatVolumeKg(exercise.total_volume_kg),
          },
        ]
      : []),
  ];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text numberOfLines={2} style={styles.exerciseName}>
            {exercise.exercise_name}
          </Text>

          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: `${trendMeta.color}14`,
                borderColor: `${trendMeta.color}26`,
              },
            ]}
          >
            <Ionicons name={trendMeta.icon as keyof typeof Ionicons.glyphMap} size={14} color={trendMeta.color} />
            <Text style={[styles.trendBadgeText, { color: trendMeta.color }]}>{trendMeta.label}</Text>
          </View>
        </View>

        <Text style={styles.exerciseMeta}>{buildLastSessionCopy(exercise.last_performed_on)}</Text>
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.primaryMetricCard}>
          <Text style={styles.primaryMetricLabel}>
            {buildPrimaryMetricLabel(exercise.analytics_profile, selectedRepBucketLabel)}
          </Text>
          <Text style={styles.primaryMetricValue}>{buildPrimaryMetricValue(exercise)}</Text>
          {primaryMetricContext ? (
            <Text style={styles.primaryMetricContext}>{primaryMetricContext}</Text>
          ) : null}
        </View>

        <View style={styles.sparklineWrap}>
          <ExerciseSparkline
            color={trendMeta.color}
            height={92}
            values={exercise.sparkline_points}
            variant="compact"
            width={140}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        {statItems.map((item) => (
          <View key={item.id} style={styles.statCard}>
            <Text style={styles.statLabel}>{item.label}</Text>
            <Text numberOfLines={1} style={styles.statValue}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.md,
      gap: spacing.sm,
      ...shadows.sm,
    },
    header: {
      gap: spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    exerciseName: {
      flex: 1,
      minWidth: 0,
      fontSize: fontSize.lg,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      lineHeight: 26,
    },
    trendBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    trendBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
    },
    exerciseMeta: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    bodyRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'stretch',
      gap: spacing.sm,
    },
    primaryMetricCard: {
      flex: 1,
      minWidth: 176,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.md,
      gap: spacing.xs,
      justifyContent: 'center',
    },
    primaryMetricLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    primaryMetricValue: {
      fontSize: fontSize['2xl'],
      fontWeight: '800',
      color: theme.colors.textPrimary,
      lineHeight: 30,
    },
    primaryMetricContext: {
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textSecondary,
    },
    sparklineWrap: {
      flexShrink: 0,
      minWidth: 140,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.sm,
      gap: 4,
    },
    statLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    statValue: {
      fontSize: fontSize.base,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
  });

export default ExerciseHighlightCard;

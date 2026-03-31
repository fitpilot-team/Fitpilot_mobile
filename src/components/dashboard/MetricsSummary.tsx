import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { brandColors, spacing, fontSize, borderRadius, shadows } from '../../constants/colors';
import { StatCardSkeleton } from '../common/Skeleton';
import { nutritionClient } from '../../services/api';
import type { ApiError, MetricSummary } from '../../types';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import {
  type MeasurementPreference,
  useMeasurementPreferenceStore,
} from '../../store/measurementPreferenceStore';
import { convertMeasurementUnitValue } from '../../utils/measurementUnits';
import { formatMeasurementNumber } from '../../utils/measurements';

interface MetricsSummaryProps {
  onPress?: () => void;
  contentWidth?: number;
  horizontalPadding?: number;
}

const metricConfig: Record<
  string,
  { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; color: string }
> = {
  weight: { icon: 'scale', label: 'Peso', color: '#3B82F6' },
  body_fat: { icon: 'body', label: 'Grasa', color: '#EF4444' },
  chest: { icon: 'fitness', label: 'Pecho', color: '#10B981' },
  waist: { icon: 'resize', label: 'Cintura', color: '#F59E0B' },
  hips: { icon: 'ellipse', label: 'Cadera', color: '#8B5CF6' },
  arms: { icon: 'barbell', label: 'Brazos', color: '#EC4899' },
  thighs: { icon: 'walk', label: 'Piernas', color: '#06B6D4' },
};

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({
  onPress,
  contentWidth = 390,
  horizontalPadding = spacing.md,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [metrics, setMetrics] = useState<MetricSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const measurementPreference = useMeasurementPreferenceStore((state) => state.preference);
  const initializeMeasurementPreference = useMeasurementPreferenceStore((state) => state.initialize);

  useEffect(() => {
    void loadMetrics();
  }, []);

  useEffect(() => {
    void initializeMeasurementPreference();
  }, [initializeMeasurementPreference]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await nutritionClient.get<MetricSummary[]>('/client-metrics/me/summary', {
        skipErrorLogging: true,
      });
      setMetrics(response);
    } catch (loadError) {
      const apiError = loadError as ApiError;

      if (apiError.status !== 403 && apiError.status !== 404 && apiError.status !== 501) {
        setError('Error al cargar metricas');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis metricas</Text>
        </View>
        <View style={[styles.metricsGrid, contentWidth >= 720 ? styles.metricsGridTablet : null]}>
          <StatCardSkeleton />
          <View style={styles.metricGap} />
          <StatCardSkeleton />
        </View>
      </View>
    );
  }

  if (error || metrics.length === 0) {
    return null;
  }

  const displayMetrics = metrics.slice(0, 4);

  return (
    <Animated.View
      entering={FadeInUp.duration(500)}
      style={[styles.container, { paddingHorizontal: horizontalPadding }]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={20} color={theme.colors.primary} />
          <Text style={styles.title}>Mis metricas</Text>
        </View>
        <TouchableOpacity style={styles.seeAllButton} onPress={onPress}>
          <Text style={styles.seeAllText}>Ver todo</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.metricsGrid, contentWidth >= 720 ? styles.metricsGridTablet : null]}>
        {displayMetrics.map((metric, index) => (
          <MetricCard
            key={metric.metric_type}
            metric={metric}
            index={index}
            measurementPreference={measurementPreference}
          />
        ))}
      </View>
    </Animated.View>
  );
};

interface MetricCardProps {
  metric: MetricSummary;
  index: number;
  measurementPreference: MeasurementPreference;
}

const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  index,
  measurementPreference,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const config = metricConfig[metric.metric_type] || {
    icon: 'analytics' as React.ComponentProps<typeof Ionicons>['name'],
    label: metric.metric_type,
    color: brandColors.sky,
  };
  const convertedMetric = convertMeasurementUnitValue(
    metric.latest_value,
    metric.unit,
    measurementPreference,
  );
  const convertedChange = metric.change_from_previous === null
    ? null
    : convertMeasurementUnitValue(
        Math.abs(metric.change_from_previous),
        metric.unit,
        measurementPreference,
      );

  const hasChange = metric.change_from_previous !== null;
  const isPositive = metric.change_from_previous && metric.change_from_previous > 0;
  const isNegative = metric.change_from_previous && metric.change_from_previous < 0;
  const isWeightOrFat = ['weight', 'body_fat'].includes(metric.metric_type);
  const changeColor = isWeightOrFat
    ? isNegative ? theme.colors.success : isPositive ? theme.colors.error : theme.colors.textMuted
    : isPositive ? theme.colors.success : isNegative ? theme.colors.error : theme.colors.textMuted;
  const gradientColors: readonly [string, string] = theme.isDark
    ? [`${config.color}2A`, 'rgba(9, 17, 31, 0.94)']
    : [`${config.color}12`, `${config.color}04`];

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).duration(400)}
      style={[styles.metricCardShell, shadows.sm]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.metricCard}
      >
        <View style={[styles.metricIcon, { backgroundColor: `${config.color}18` }]}>
          <Ionicons name={config.icon} size={16} color={config.color} />
        </View>

        <View style={styles.metricValueRow}>
          <Text style={styles.metricValue}>
            {formatMeasurementNumber(
              convertedMetric.value,
              convertedMetric.unit === '%' ? 1 : 1,
            )}
          </Text>
          <Text style={styles.metricUnit}>{convertedMetric.unit}</Text>
        </View>

        <Text style={styles.metricLabel}>{config.label}</Text>

        {hasChange && metric.change_from_previous !== 0 && (
          <View style={[styles.changeBadge, { backgroundColor: `${changeColor}18` }]}>
            <Ionicons
              name={isPositive ? 'arrow-up' : 'arrow-down'}
              size={10}
              color={changeColor}
            />
            <Text style={[styles.changeText, { color: changeColor }]}>
              {convertedChange
                ? formatMeasurementNumber(
                    convertedChange.value,
                    convertedChange.unit === '%' ? 1 : 1,
                  )
                : '--'}
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginVertical: spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    seeAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    seeAllText: {
      fontSize: fontSize.sm,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    metricsGridTablet: {
      justifyContent: 'space-between',
    },
    metricGap: {
      width: spacing.sm,
    },
    metricCardShell: {
      width: '48%',
      maxWidth: 280,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.isDark ? theme.colors.borderStrong : theme.colors.border,
      backgroundColor: theme.isDark ? '#0f1826' : theme.colors.card,
    },
    metricCard: {
      padding: spacing.md,
      minHeight: 132,
    },
    metricIcon: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    metricValueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.xs,
    },
    metricValue: {
      fontSize: fontSize['2xl'],
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    metricUnit: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    metricLabel: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      marginTop: spacing.xs,
    },
    changeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
    },
    changeText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
    },
  });

export default MetricsSummary;

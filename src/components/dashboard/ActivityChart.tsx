import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import { colors, brandColors, spacing, fontSize, borderRadius, shadows } from '../../constants/colors';
import { ChartSkeleton } from '../common/Skeleton';
import type { MuscleVolumeResponse } from '../../types';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const MAX_MUSCLES_SHOWN = 6;
const BAR_HEIGHT = 20;

interface ActivityChartProps {
  muscleVolume: MuscleVolumeResponse | null;
  isLoading?: boolean;
  countSecondaryMuscles: boolean;
  onToggleSecondary: (value: boolean) => void;
  contentWidth?: number;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({
  muscleVolume,
  isLoading = false,
  countSecondaryMuscles,
  onToggleSecondary,
  contentWidth = 390,
}) => {
  const animationProgress = useSharedValue(0);
  const chartWidth = Math.max(280, contentWidth - spacing.lg * 2);
  const labelWidth = chartWidth >= 720 ? 128 : chartWidth >= 560 ? 112 : 96;
  const valueWidth = 48;
  const barAreaWidth = Math.max(80, chartWidth - labelWidth - valueWidth - spacing.md);

  useEffect(() => {
    if (muscleVolume && !isLoading) {
      animationProgress.value = 0;
      animationProgress.value = withDelay(
        200,
        withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [animationProgress, isLoading, muscleVolume]);

  const { muscles, maxSets } = useMemo(() => {
    const visibleMuscles = muscleVolume?.muscles?.slice(0, MAX_MUSCLES_SHOWN) || [];
    const max = visibleMuscles.length > 0 ? Math.max(...visibleMuscles.map((item) => item.effective_sets)) : 0;
    return { muscles: visibleMuscles, maxSets: max };
  }, [muscleVolume]);

  if (isLoading) {
    return (
      <View style={styles.skeletonWrapper}>
        <ChartSkeleton />
      </View>
    );
  }

  const totalSets = Math.round(muscleVolume?.total_effective_sets || 0);

  if (!muscleVolume || muscles.length === 0) {
    return (
      <View style={styles.container}>
        <ExpoGradient
          colors={[brandColors.navy, brandColors.sky]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.title}>Volumen del entrenamiento</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sin datos de volumen</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExpoGradient
        colors={[brandColors.navy, brandColors.sky]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Volumen del entrenamiento</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalSets} series</Text>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Contar secundarios (0.5x)</Text>
        <Switch
          value={countSecondaryMuscles}
          onValueChange={onToggleSecondary}
          trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.6)' }}
          thumbColor={countSecondaryMuscles ? colors.white : colors.gray[300]}
        />
      </View>

      <View style={styles.chartContainer}>
        {muscles.map((muscle) => (
          <MuscleBar
            key={muscle.muscle_name}
            muscle={muscle}
            maxSets={maxSets}
            labelWidth={labelWidth}
            valueWidth={valueWidth}
            barAreaWidth={barAreaWidth}
            animationProgress={animationProgress}
          />
        ))}
      </View>
    </View>
  );
};

interface MuscleBarProps {
  muscle: { muscle_name: string; display_name: string; effective_sets: number };
  maxSets: number;
  labelWidth: number;
  valueWidth: number;
  barAreaWidth: number;
  animationProgress: SharedValue<number>;
}

const MuscleBar: React.FC<MuscleBarProps> = ({
  muscle,
  maxSets,
  labelWidth,
  valueWidth,
  barAreaWidth,
  animationProgress,
}) => {
  const barWidth = maxSets > 0 ? (muscle.effective_sets / maxSets) * barAreaWidth : 0;

  const animatedProps = useAnimatedProps(() => ({
    width: barWidth * animationProgress.value,
  }));

  return (
    <View style={styles.barRow}>
      <Text style={[styles.muscleLabel, { width: labelWidth }]} numberOfLines={1}>
        {muscle.display_name}
      </Text>
      <View style={styles.barContainer}>
        <Svg height={BAR_HEIGHT} width={barAreaWidth}>
          <Rect
            x={0}
            y={4}
            width={barAreaWidth}
            height={BAR_HEIGHT - 8}
            rx={6}
            fill="rgba(255, 255, 255, 0.15)"
          />
          <AnimatedRect
            x={0}
            y={4}
            height={BAR_HEIGHT - 8}
            rx={6}
            fill={colors.white}
            fillOpacity={0.9}
            animatedProps={animatedProps}
          />
        </Svg>
      </View>
      <Text style={[styles.valueLabel, { width: valueWidth }]}>
        {muscle.effective_sets.toFixed(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  skeletonWrapper: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  toggleLabel: {
    flex: 1,
    fontSize: fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  chartContainer: {
    marginTop: spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  muscleLabel: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '500',
    paddingRight: spacing.sm,
  },
  barContainer: {
    flex: 1,
  },
  valueLabel: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '600',
    textAlign: 'right',
    paddingLeft: spacing.xs,
  },
  emptyState: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default ActivityChart;

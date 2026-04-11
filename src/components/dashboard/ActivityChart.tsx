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
import { useAppTheme } from '../../theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const MAX_MUSCLES_SHOWN = 6;
const BAR_HEIGHT = 20;
const SESSION_LANDMARK_MIN = 4;
const SESSION_LANDMARK_MAX = 12;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getSessionLandmarkFillRatio = (effectiveSets: number) =>
  clamp(
    (effectiveSets - SESSION_LANDMARK_MIN) / (SESSION_LANDMARK_MAX - SESSION_LANDMARK_MIN),
    0,
    1
  );

interface ActivityChartProps {
  muscleVolume: MuscleVolumeResponse | null;
  isLoading?: boolean;
  countSecondaryMuscles: boolean;
  onToggleSecondary: (value: boolean) => void;
  contentWidth?: number;
  horizontalPadding?: number;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({
  muscleVolume,
  isLoading = false,
  countSecondaryMuscles,
  onToggleSecondary,
  contentWidth = 390,
  horizontalPadding = spacing.md,
}) => {
  const { theme } = useAppTheme();
  const animationProgress = useSharedValue(0);
  const containerWidth = Math.max(320, contentWidth - horizontalPadding * 2);
  const chartWidth = Math.max(220, containerWidth - spacing.lg * 2);
  const labelWidth = chartWidth >= 720 ? 128 : chartWidth >= 560 ? 112 : 96;
  const valueWidth = 48;
  const barAreaWidth = Math.max(80, chartWidth - labelWidth - valueWidth - spacing.md);

  // Lighter gradient matching MetricsSummary card style for Light Mode, original for Dark Mode
  const gradientColors = theme.isDark
    ? ([brandColors.navy, brandColors.sky] as const)
    : ([`${brandColors.sky}22`, `${brandColors.navy}14`] as const);
  const textColor = theme.isDark ? colors.white : brandColors.navy;
  const subtextColor = theme.isDark ? 'rgba(255,255,255,0.72)' : `${brandColors.navy}AA`;

  useEffect(() => {
    if (muscleVolume && !isLoading) {
      animationProgress.value = 0;
      animationProgress.value = withDelay(
        200,
        withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [animationProgress, isLoading, muscleVolume]);

  const muscles = useMemo(() => {
    const visibleMuscles = muscleVolume?.muscles?.slice(0, MAX_MUSCLES_SHOWN) || [];
    return visibleMuscles;
  }, [muscleVolume]);

  if (isLoading) {
    return (
      <View style={[styles.skeletonWrapper, { width: containerWidth, alignSelf: 'center' }]}>
        <ChartSkeleton />
      </View>
    );
  }

  const totalSets = Math.round(muscleVolume?.total_effective_sets || 0);

  if (!muscleVolume || muscles.length === 0) {
    return (
      <View style={[styles.container, { width: containerWidth, alignSelf: 'center', borderWidth: 1, borderColor: theme.isDark ? theme.colors.borderStrong : theme.colors.border }]}>
        <ExpoGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.title, { color: textColor }]}>Volumen de entrenamiento por sesión</Text>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: subtextColor }]}>Sin datos de volumen</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: containerWidth, alignSelf: 'center', borderWidth: theme.isDark ? 0 : 1, borderColor: theme.colors.border }]}>
      <ExpoGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Volumen del entrenamiento</Text>
        <View style={[styles.badge, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.2)' : `${brandColors.sky}22` }]}>
          <Text style={[styles.badgeText, { color: textColor }]}>{totalSets} series</Text>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: subtextColor }]}>Contar volumen de sinergistas(0.5x)</Text>
        <Switch
          value={countSecondaryMuscles}
          onValueChange={onToggleSecondary}
          trackColor={{ false: theme.isDark ? 'rgba(255,255,255,0.3)' : `${brandColors.sky}44`, true: theme.isDark ? 'rgba(255,255,255,0.6)' : brandColors.sky }}
          thumbColor={countSecondaryMuscles ? (theme.isDark ? colors.white : brandColors.navy) : colors.gray[300]}
        />
      </View>

      <Text style={[styles.rangeLegend, { color: subtextColor }]}>
        Rango RP por sesion: {SESSION_LANDMARK_MIN}-{SESSION_LANDMARK_MAX} series efectivas
      </Text>

      <View style={styles.chartContainer}>
        {muscles.map((muscle) => (
          <MuscleBar
            key={muscle.muscle_name}
            muscle={muscle}
            labelWidth={labelWidth}
            valueWidth={valueWidth}
            barAreaWidth={barAreaWidth}
            animationProgress={animationProgress}
            textColor={textColor}
            barFill={theme.isDark ? 'rgba(255,255,255,0.9)' : brandColors.navy}
            barBg={theme.isDark ? 'rgba(255,255,255,0.15)' : `${brandColors.sky}30`}
          />
        ))}
      </View>
    </View>
  );
};

interface MuscleBarProps {
  muscle: { muscle_name: string; display_name: string; effective_sets: number };
  labelWidth: number;
  valueWidth: number;
  barAreaWidth: number;
  animationProgress: SharedValue<number>;
  textColor?: string;
  barFill?: string;
  barBg?: string;
}

const MuscleBar: React.FC<MuscleBarProps> = ({
  muscle,
  labelWidth,
  valueWidth,
  barAreaWidth,
  animationProgress,
  textColor = colors.white,
  barFill = colors.white,
  barBg = 'rgba(255,255,255,0.15)',
}) => {
  const barWidth = getSessionLandmarkFillRatio(muscle.effective_sets) * barAreaWidth;

  const animatedProps = useAnimatedProps(() => ({
    width: barWidth * animationProgress.value,
  }));

  return (
    <View style={styles.barRow}>
      <Text style={[styles.muscleLabel, { width: labelWidth, color: textColor }]} numberOfLines={1}>
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
            fill={barBg}
          />
          <AnimatedRect
            x={0}
            y={4}
            height={BAR_HEIGHT - 8}
            rx={6}
            fill={barFill}
            fillOpacity={0.9}
            animatedProps={animatedProps}
          />
        </Svg>
      </View>
      <Text style={[styles.valueLabel, { width: valueWidth, color: textColor }]}>
        {muscle.effective_sets.toFixed(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  skeletonWrapper: {
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
  rangeLegend: {
    fontSize: fontSize.xs,
    color: 'rgba(255, 255, 255, 0.72)',
    fontWeight: '500',
    marginBottom: spacing.xs,
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

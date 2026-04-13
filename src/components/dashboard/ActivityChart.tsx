import React, { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import {
  borderRadius,
  brandColors,
  colors,
  fontSize,
  shadows,
  spacing,
} from '../../constants/colors';
import { ChartSkeleton } from '../common/Skeleton';
import type { MuscleVolumeResponse } from '../../types';
import { useAppTheme } from '../../theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const MAX_MUSCLES_SHOWN = 6;
const BAR_HEIGHT = 20;
const SESSION_LANDMARK_MIN = 4;
const SESSION_LANDMARK_MAX = 12;
const TRACK_VERTICAL_PADDING = 4;
const TRACK_HEIGHT = BAR_HEIGHT - TRACK_VERTICAL_PADDING * 2;
const TRACK_RADIUS = 6;
const LANDMARK_MARKER_WIDTH = 2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getSessionVolumeFillRatio = (effectiveSets: number) =>
  clamp(effectiveSets / SESSION_LANDMARK_MAX, 0, 1);

const getSessionLandmarkMarkerRatio = () =>
  clamp(SESSION_LANDMARK_MIN / SESSION_LANDMARK_MAX, 0, 1);

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
  const barAreaWidth = Math.max(
    80,
    chartWidth - labelWidth - valueWidth - spacing.md,
  );
  const isAndroidLight = Platform.OS === 'android' && !theme.isDark;
  const shellBackgroundColor = isAndroidLight ? theme.colors.card : 'transparent';
  const surfaceBackgroundColor = isAndroidLight
    ? theme.colors.card
    : 'transparent';

  const gradientColors = theme.isDark
    ? ([brandColors.navy, brandColors.sky] as const)
    : ([`${brandColors.sky}22`, `${brandColors.navy}14`] as const);
  const textColor = theme.isDark ? colors.white : brandColors.navy;
  const subtextColor = theme.isDark
    ? 'rgba(255,255,255,0.72)'
    : `${brandColors.navy}AA`;

  useEffect(() => {
    if (muscleVolume && !isLoading) {
      animationProgress.value = 0;
      animationProgress.value = withDelay(
        200,
        withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [animationProgress, isLoading, muscleVolume]);

  const muscles = useMemo(
    () => muscleVolume?.muscles?.slice(0, MAX_MUSCLES_SHOWN) || [],
    [muscleVolume],
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.skeletonWrapper,
          { width: containerWidth, alignSelf: 'center' },
        ]}
      >
        <ChartSkeleton />
      </View>
    );
  }

  const totalSets = Math.round(muscleVolume?.total_effective_sets || 0);
  const hasVolumeData = Boolean(muscleVolume) && muscles.length > 0;
  const surfaceBorderWidth = hasVolumeData ? (theme.isDark ? 0 : 1) : 1;
  const surfaceBorderColor = hasVolumeData
    ? theme.colors.border
    : theme.isDark
      ? theme.colors.borderStrong
      : theme.colors.border;

  return (
    <View
      style={[
        styles.cardShell,
        {
          width: containerWidth,
          alignSelf: 'center',
          backgroundColor: shellBackgroundColor,
        },
      ]}
    >
      <View
        style={[
          styles.cardSurface,
          {
            backgroundColor: surfaceBackgroundColor,
            borderWidth: surfaceBorderWidth,
            borderColor: surfaceBorderColor,
          },
        ]}
      >
        <ExpoGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {!hasVolumeData ? (
          <>
            <Text style={[styles.title, { color: textColor }]}>
              {'Volumen de entrenamiento por sesi\u00f3n'}
            </Text>
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: subtextColor }]}>
                Sin datos de volumen
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>
                Volumen del entrenamiento
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255,255,255,0.2)'
                      : `${brandColors.sky}22`,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: textColor }]}>
                  {totalSets} series
                </Text>
              </View>
            </View>

            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: subtextColor }]}>
                Contar volumen de sinergistas (0.5x)
              </Text>
              <Switch
                value={countSecondaryMuscles}
                onValueChange={onToggleSecondary}
                trackColor={{
                  false: theme.isDark
                    ? 'rgba(255,255,255,0.3)'
                    : `${brandColors.sky}44`,
                  true: theme.isDark
                    ? 'rgba(255,255,255,0.6)'
                    : brandColors.sky,
                }}
                thumbColor={
                  countSecondaryMuscles
                    ? theme.isDark
                      ? colors.white
                      : brandColors.navy
                    : colors.gray[300]
                }
              />
            </View>

            <Text style={[styles.rangeLegend, { color: subtextColor }]}>
              Rango RP por sesi\u00f3n: {SESSION_LANDMARK_MIN}-
              {SESSION_LANDMARK_MAX} series efectivas
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
                  barFill={
                    theme.isDark ? 'rgba(255,255,255,0.9)' : brandColors.navy
                  }
                  barBg={
                    theme.isDark
                      ? 'rgba(255,255,255,0.15)'
                      : `${brandColors.sky}30`
                  }
                  markerFill={
                    theme.isDark
                      ? 'rgba(255,255,255,0.55)'
                      : `${brandColors.navy}59`
                  }
                />
              ))}
            </View>
          </>
        )}
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
  markerFill?: string;
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
  markerFill = 'rgba(255,255,255,0.55)',
}) => {
  const barWidth =
    getSessionVolumeFillRatio(muscle.effective_sets) * barAreaWidth;
  const landmarkMarkerX = clamp(
    getSessionLandmarkMarkerRatio() * barAreaWidth -
      LANDMARK_MARKER_WIDTH / 2,
    0,
    Math.max(barAreaWidth - LANDMARK_MARKER_WIDTH, 0),
  );

  const animatedProps = useAnimatedProps(() => ({
    width: barWidth * animationProgress.value,
  }));

  return (
    <View style={styles.barRow}>
      <Text
        style={[styles.muscleLabel, { width: labelWidth, color: textColor }]}
        numberOfLines={1}
      >
        {muscle.display_name}
      </Text>
      <View style={styles.barContainer}>
        <Svg height={BAR_HEIGHT} width={barAreaWidth}>
          <Rect
            x={0}
            y={TRACK_VERTICAL_PADDING}
            width={barAreaWidth}
            height={TRACK_HEIGHT}
            rx={TRACK_RADIUS}
            fill={barBg}
          />
          <AnimatedRect
            x={0}
            y={TRACK_VERTICAL_PADDING}
            height={TRACK_HEIGHT}
            rx={TRACK_RADIUS}
            fill={barFill}
            fillOpacity={0.9}
            animatedProps={animatedProps}
          />
          <Rect
            x={landmarkMarkerX}
            y={TRACK_VERTICAL_PADDING}
            width={LANDMARK_MARKER_WIDTH}
            height={TRACK_HEIGHT}
            rx={LANDMARK_MARKER_WIDTH / 2}
            fill={markerFill}
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
  cardShell: {
    marginVertical: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  cardSurface: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    padding: spacing.lg,
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

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  useAnimatedProps,
} from 'react-native-reanimated';
import { colors, brandColors, spacing, fontSize, borderRadius, shadows } from '../../constants/colors';
import { StatCardSkeleton } from '../common/Skeleton';
import type { WeeklyProgress } from '../../types';

interface QuickStatsProps {
  weeklyProgress: WeeklyProgress | null;
  workoutPosition: number | null;
  workoutTotal: number | null;
  isLoading?: boolean;
}

interface StatItem {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
  gradientColors: [string, string];
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export const QuickStats: React.FC<QuickStatsProps> = ({
  weeklyProgress,
  workoutPosition,
  workoutTotal,
  isLoading = false,
}) => {
  const animationProgress = useSharedValue(0);

  useEffect(() => {
    if (!isLoading) {
      animationProgress.value = withDelay(
        200,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.statsRow}>
          <StatCardSkeleton />
          <View style={styles.statGap} />
          <StatCardSkeleton />
          <View style={styles.statGap} />
          <StatCardSkeleton />
        </View>
      </View>
    );
  }

  const completedThisWeek = weeklyProgress?.total_workouts_completed || 0;
  const overallPercentage = Math.round(weeklyProgress?.overall_completion_percentage || 0);

  const stats: StatItem[] = [
    {
      icon: 'checkmark-circle',
      value: completedThisWeek,
      label: 'Esta semana',
      color: colors.success,
      gradientColors: ['#10B98115', '#10B98105'],
    },
    {
      icon: 'barbell',
      value: workoutPosition && workoutTotal ? `${workoutPosition}/${workoutTotal}` : '-',
      label: 'Progreso',
      color: brandColors.sky,
      gradientColors: [`${brandColors.sky}15`, `${brandColors.sky}05`],
    },
    {
      icon: 'trending-up',
      value: `${overallPercentage}%`,
      label: 'Completado',
      color: brandColors.navy,
      gradientColors: [`${brandColors.navy}15`, `${brandColors.navy}05`],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            stat={stat}
            index={index}
            animationProgress={animationProgress}
          />
        ))}
      </View>
    </View>
  );
};

interface StatCardProps {
  stat: StatItem;
  index: number;
  animationProgress: Animated.SharedValue<number>;
}

const StatCard: React.FC<StatCardProps> = ({ stat, index, animationProgress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const delay = index * 0.1;
    const progress = interpolate(
      animationProgress.value,
      [delay, delay + 0.4],
      [0, 1],
      'clamp'
    );

    return {
      opacity: progress,
      transform: [
        { translateY: interpolate(progress, [0, 1], [20, 0]) },
        { scale: interpolate(progress, [0, 1], [0.9, 1]) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.statCard, shadows.sm, animatedStyle]}>
      <LinearGradient
        colors={stat.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.iconContainer, { backgroundColor: `${stat.color}15` }]}>
        <Ionicons name={stat.icon} size={18} color={stat.color} />
      </View>

      <Text style={[styles.statValue, { color: stat.color }]}>
        {stat.value}
      </Text>

      <Text style={styles.statLabel}>
        {stat.label}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statGap: {
    width: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    textAlign: 'center',
  },
});

export default QuickStats;

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, borderRadius, spacing } from '../../constants/colors';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const SCREEN_WIDTH = Dimensions.get('window').width;

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.md,
  style,
}) => {
  const translateX = useSharedValue(-SCREEN_WIDTH);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SCREEN_WIDTH, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius: radius,
        },
        style,
      ]}
    >
      <AnimatedLinearGradient
        colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.shimmer, animatedStyle]}
      />
    </View>
  );
};

// Preset: Skeleton para tarjeta de entrenamiento
export const WorkoutCardSkeleton: React.FC = () => (
  <View style={styles.workoutCard}>
    <Skeleton width="60%" height={24} />
    <Skeleton width="40%" height={16} style={{ marginTop: spacing.sm }} />
    <Skeleton width="100%" height={160} style={{ marginTop: spacing.md }} borderRadius={borderRadius.lg} />
  </View>
);

// Preset: Skeleton para ActivityChart
export const ChartSkeleton: React.FC = () => (
  <View style={styles.chartContainer}>
    <Skeleton width={120} height={24} />
    <Skeleton width="100%" height={100} style={{ marginTop: spacing.md }} borderRadius={borderRadius.lg} />
    <View style={styles.chartLabels}>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Skeleton key={i} width={30} height={14} />
      ))}
    </View>
  </View>
);

// Preset: Skeleton para QuickStats
export const StatCardSkeleton: React.FC = () => (
  <View style={styles.statCard}>
    <Skeleton width={24} height={24} borderRadius={borderRadius.full} />
    <Skeleton width={40} height={28} style={{ marginTop: spacing.sm }} />
    <Skeleton width={60} height={14} style={{ marginTop: spacing.xs }} />
  </View>
);

// Preset: Skeleton para lista de items
export const ListItemSkeleton: React.FC = () => (
  <View style={styles.listItem}>
    <Skeleton width={40} height={40} borderRadius={borderRadius.full} />
    <View style={styles.listItemContent}>
      <Skeleton width="70%" height={16} />
      <Skeleton width="50%" height={14} style={{ marginTop: spacing.xs }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[200],
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: '50%',
  },
  workoutCard: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
  },
  chartContainer: {
    padding: spacing.lg,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.xl,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  listItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
});

export default Skeleton;

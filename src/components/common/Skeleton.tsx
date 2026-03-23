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
import { borderRadius, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles } from '../../theme';

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
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SCREEN_WIDTH, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [translateX]);

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
        colors={['transparent', theme.colors.skeletonHighlight, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.shimmer, animatedStyle]}
      />
    </View>
  );
};

const SkeletonContainer: React.FC<{
  children: React.ReactNode;
  variant: 'workout' | 'chart' | 'stat' | 'listItem';
}> = ({ children, variant }) => {
  const styles = useThemedStyles(createStyles);
  return <View style={styles[variant]}>{children}</View>;
};

const SkeletonChartLabels: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.chartLabels}>{children}</View>;
};

const SkeletonListItemContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.listItemContent}>{children}</View>;
};

export const WorkoutCardSkeleton: React.FC = () => (
  <SkeletonContainer variant="workout">
    <Skeleton width="60%" height={24} />
    <Skeleton width="40%" height={16} style={{ marginTop: spacing.sm }} />
    <Skeleton width="100%" height={160} style={{ marginTop: spacing.md }} borderRadius={borderRadius.lg} />
  </SkeletonContainer>
);

export const ChartSkeleton: React.FC = () => (
  <SkeletonContainer variant="chart">
    <Skeleton width={120} height={24} />
    <Skeleton width="100%" height={100} style={{ marginTop: spacing.md }} borderRadius={borderRadius.lg} />
    <SkeletonChartLabels>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Skeleton key={i} width={30} height={14} />
      ))}
    </SkeletonChartLabels>
  </SkeletonContainer>
);

export const StatCardSkeleton: React.FC = () => (
  <SkeletonContainer variant="stat">
    <Skeleton width={24} height={24} borderRadius={borderRadius.full} />
    <Skeleton width={40} height={28} style={{ marginTop: spacing.sm }} />
    <Skeleton width={60} height={14} style={{ marginTop: spacing.xs }} />
  </SkeletonContainer>
);

export const ListItemSkeleton: React.FC = () => (
  <SkeletonContainer variant="listItem">
    <Skeleton width={40} height={40} borderRadius={borderRadius.full} />
    <SkeletonListItemContent>
      <Skeleton width="70%" height={16} />
      <Skeleton width="50%" height={14} style={{ marginTop: spacing.xs }} />
    </SkeletonListItemContent>
  </SkeletonContainer>
);

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.skeletonBase,
      overflow: 'hidden',
    },
    shimmer: {
      ...StyleSheet.absoluteFillObject,
      width: '50%',
    },
    workout: {
      padding: spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    chart: {
      padding: spacing.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    chartLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.md,
    },
    stat: {
      flex: 1,
      padding: spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    listItemContent: {
      flex: 1,
      marginLeft: spacing.md,
    },
  });

export default Skeleton;

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline } from 'react-native-svg';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import { buildLineCoordinates, buildPolylinePoints } from '../../utils/workoutAnalytics';

interface ExerciseSparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  variant?: 'default' | 'compact';
}

const CONTAINER_PADDING = 10;

export const ExerciseSparkline: React.FC<ExerciseSparklineProps> = ({
  values,
  width = 128,
  height,
  color,
  variant = 'default',
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const strokeColor = color ?? theme.colors.primary;
  const isCompact = variant === 'compact';
  const resolvedHeight = height ?? (isCompact ? 92 : 72);
  const horizontalPadding = isCompact ? spacing.sm : CONTAINER_PADDING;
  const chartWidth = Math.max(width - horizontalPadding * 2, 56);
  const chartHeight = isCompact ? 28 : 24;
  const iconSize = isCompact ? 13 : 14;
  const strokeWidth = isCompact ? 2.25 : 2.5;

  const points = values.length
    ? buildLineCoordinates(values, chartWidth, chartHeight, {
        top: 4,
        right: 2,
        bottom: 4,
        left: 2,
      })
    : [];

  return (
    <View
      accessible
      accessibilityLabel={values.length ? 'Tendencia del ejercicio' : 'Tendencia del ejercicio sin datos'}
      style={[
        styles.container,
        isCompact ? styles.containerCompact : null,
        {
          width,
          minHeight: resolvedHeight,
          paddingHorizontal: horizontalPadding,
          paddingVertical: isCompact ? spacing.xs + 2 : spacing.sm,
        },
      ]}
    >
      <View style={[styles.header, isCompact ? styles.headerCompact : null]}>
        <Ionicons name="trending-up-outline" size={iconSize} color={strokeColor} />
        <Text style={[styles.label, isCompact ? styles.labelCompact : null]}>Tendencia</Text>
      </View>

      {values.length ? (
        <View style={[styles.chartWrap, isCompact ? styles.chartWrapCompact : null]}>
          <Svg width={chartWidth} height={chartHeight}>
            <Polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={buildPolylinePoints(points)}
            />
          </Svg>
        </View>
      ) : (
        <View style={[styles.emptyState, isCompact ? styles.emptyStateCompact : null]}>
          <View style={styles.emptyLine} />
          <Text style={styles.emptyText}>Sin datos</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexShrink: 0,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.isDark ? theme.colors.borderStrong : theme.colors.border,
      justifyContent: 'space-between',
    },
    containerCompact: {
      borderRadius: borderRadius.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerCompact: {
      gap: 5,
    },
    label: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    labelCompact: {
      color: theme.colors.textMuted,
    },
    chartWrap: {
      marginTop: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartWrapCompact: {
      marginTop: spacing.xs + 2,
    },
    emptyState: {
      marginTop: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    emptyStateCompact: {
      marginTop: spacing.xs + 2,
      gap: 4,
    },
    emptyLine: {
      width: '100%',
      height: 2,
      borderRadius: 999,
      backgroundColor: theme.isDark ? theme.colors.borderStrong : theme.colors.border,
    },
    emptyText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
  });

export default ExerciseSparkline;

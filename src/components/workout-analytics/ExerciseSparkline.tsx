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
}

const CONTAINER_PADDING = 10;

export const ExerciseSparkline: React.FC<ExerciseSparklineProps> = ({
  values,
  width = 128,
  height = 72,
  color,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const strokeColor = color ?? theme.colors.primary;
  const chartWidth = Math.max(width - CONTAINER_PADDING * 2, 56);
  const chartHeight = 24;

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
      style={[styles.container, { width, minHeight: height }]}
    >
      <View style={styles.header}>
        <Ionicons name="trending-up-outline" size={14} color={theme.colors.primary} />
        <Text style={styles.label}>Tendencia</Text>
      </View>

      {values.length ? (
        <View style={styles.chartWrap}>
          <Svg width={chartWidth} height={chartHeight}>
            <Polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={buildPolylinePoints(points)}
            />
          </Svg>
        </View>
      ) : (
        <View style={styles.emptyState}>
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
      paddingHorizontal: CONTAINER_PADDING,
      paddingVertical: spacing.sm,
      justifyContent: 'space-between',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    label: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    chartWrap: {
      marginTop: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      marginTop: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
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

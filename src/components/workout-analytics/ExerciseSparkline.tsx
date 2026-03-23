import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import { buildLineCoordinates, buildPolylinePoints } from '../../utils/workoutAnalytics';

interface ExerciseSparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const ExerciseSparkline: React.FC<ExerciseSparklineProps> = ({
  values,
  width = 112,
  height = 38,
  color,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const strokeColor = color ?? theme.colors.primary;

  if (!values.length) {
    return <View style={[styles.empty, { width, height }]} />;
  }

  const points = buildLineCoordinates(values, width, height, {
    top: 6,
    right: 4,
    bottom: 6,
    left: 4,
  });

  return (
    <Svg width={width} height={height}>
      <Polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={buildPolylinePoints(points)}
      />
    </Svg>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    empty: {
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });

export default ExerciseSparkline;

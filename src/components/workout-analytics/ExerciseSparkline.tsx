import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { colors } from '../../constants/colors';
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
  color = colors.primary[500],
}) => {
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
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={buildPolylinePoints(points)}
      />
    </Svg>
  );
};

const styles = StyleSheet.create({
  empty: {
    borderRadius: 999,
    backgroundColor: colors.gray[100],
  },
});

export default ExerciseSparkline;

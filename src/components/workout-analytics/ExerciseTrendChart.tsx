import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline, Rect } from 'react-native-svg';
import { borderRadius, colors, fontSize, spacing } from '../../constants/colors';
import type { ExerciseTrendPoint, RepRangeBucket } from '../../types';
import { formatLocalDate } from '../../utils/date';
import {
  buildLineCoordinates,
  buildPolylinePoints,
  formatVolumeKg,
  getRepRangeColor,
} from '../../utils/workoutAnalytics';

interface ExerciseTrendChartProps {
  series: ExerciseTrendPoint[];
  repRanges: RepRangeBucket[];
  contentWidth?: number;
}

const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 20, right: 16, bottom: 32, left: 16 };

export const ExerciseTrendChart: React.FC<ExerciseTrendChartProps> = ({
  series,
  repRanges,
  contentWidth = 360,
}) => {
  if (!series.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No hay registros del ejercicio en este rango.</Text>
      </View>
    );
  }

  const chartWidth = Math.max(contentWidth - spacing.lg * 2, 280);
  const weightValues = series.map((point) => point.best_weight_kg ?? 0);
  const volumeValues = series.map((point) => point.volume_kg);
  const linePoints = buildLineCoordinates(weightValues, chartWidth, CHART_HEIGHT, CHART_PADDING);
  const maxVolume = Math.max(...volumeValues, 1);
  const chartBottom = CHART_HEIGHT - CHART_PADDING.bottom;
  const barAreaHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const slotWidth =
    series.length === 1 ? 0 : (chartWidth - CHART_PADDING.left - CHART_PADDING.right) / (series.length - 1);

  return (
    <View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendLineDot]} />
          <Text style={styles.legendLabel}>Mejor carga</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendBarDot]} />
          <Text style={styles.legendLabel}>Volumen</Text>
        </View>
      </View>

      <Svg width={chartWidth} height={CHART_HEIGHT}>
        {series.map((point, index) => {
          const x =
            series.length === 1 ? chartWidth / 2 : CHART_PADDING.left + slotWidth * index;
          const barHeight = (point.volume_kg / maxVolume) * (barAreaHeight * 0.45);
          const barColor =
            repRanges.find((bucket) => bucket.id === point.reps_bucket_id)?.color_token ?? 'sky';

          return (
            <Rect
              key={`${point.performed_on_date}-volume`}
              x={x - 10}
              y={chartBottom - barHeight}
              width={20}
              height={barHeight}
              rx={6}
              fill={getRepRangeColor(barColor)}
              fillOpacity={0.24}
            />
          );
        })}

        <Polyline
          fill="none"
          stroke={colors.primary[500]}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={buildPolylinePoints(linePoints)}
        />

        {linePoints.map((point, index) => (
          <Circle
            key={`${series[index].performed_on_date}-circle`}
            cx={point.x}
            cy={point.y}
            r={4.5}
            fill={colors.white}
            stroke={colors.primary[500]}
            strokeWidth={2}
          />
        ))}
      </Svg>

      <View style={styles.bottomMeta}>
        <View style={styles.metaColumn}>
          <Text style={styles.metaLabel}>Primera</Text>
          <Text style={styles.metaValue}>
            {formatLocalDate(series[0].performed_on_date, { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <View style={styles.metaColumn}>
          <Text style={styles.metaLabel}>Ultima</Text>
          <Text style={styles.metaValue}>
            {formatLocalDate(series[series.length - 1].performed_on_date, { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <View style={styles.metaColumn}>
          <Text style={styles.metaLabel}>Volumen reciente</Text>
          <Text style={styles.metaValue}>{formatVolumeKg(series[series.length - 1].volume_kg)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  legendRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLineDot: {
    backgroundColor: colors.primary[500],
  },
  legendBarDot: {
    backgroundColor: colors.gray[300],
  },
  legendLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    fontWeight: '600',
  },
  bottomMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metaColumn: {
    flex: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    padding: spacing.sm,
  },
  metaLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  metaValue: {
    marginTop: 4,
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.gray[900],
  },
  emptyState: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[50],
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
  },
});

export default ExerciseTrendChart;

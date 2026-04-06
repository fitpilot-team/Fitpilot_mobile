import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { RepRangeBucket, RepRangeChartPoint } from '../../types';
import { formatLocalDate } from '../../utils/date';
import { getRepRangeColor } from '../../utils/workoutAnalytics';

interface RepRangeVolumeChartProps {
  points: RepRangeChartPoint[];
  repRanges: RepRangeBucket[];
  contentWidth?: number;
}

const CHART_HEIGHT = 160;
const BAR_WIDTH = 22;
const SLOT_WIDTH = 42;
const PADDING_X = 16;
const PADDING_Y = 12;

export const RepRangeVolumeChart: React.FC<RepRangeVolumeChartProps> = ({
  points,
  repRanges,
  contentWidth = 360,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (!points.length || repRanges.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          No hay volumen con carga en este rango. Completa sesiones con peso para ver la distribucion semanal.
        </Text>
      </View>
    );
  }

  const svgWidth = Math.max(contentWidth - spacing.lg * 2, points.length * SLOT_WIDTH + PADDING_X * 2);
  const maxTotal = Math.max(
    ...points.map((point) =>
      repRanges.reduce((sum, bucket) => sum + (point.totals[bucket.id] || 0), 0),
    ),
    1,
  );

  return (
    <View>
      <View style={styles.legendRow}>
        {repRanges.map((bucket) => (
          <View key={bucket.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getRepRangeColor(bucket.color_token) }]} />
            <Text style={styles.legendLabel}>{bucket.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width: svgWidth }}>
          <Svg width={svgWidth} height={CHART_HEIGHT}>
            {points.map((point, index) => {
              const x = PADDING_X + index * SLOT_WIDTH;
              let offsetY = CHART_HEIGHT - PADDING_Y;

              return (
                <React.Fragment key={point.week_start}>
                  {repRanges.map((bucket) => {
                    const bucketValue = point.totals[bucket.id] || 0;
                    const segmentHeight = (bucketValue / maxTotal) * (CHART_HEIGHT - PADDING_Y * 2);

                    if (segmentHeight <= 0) {
                      return null;
                    }

                    offsetY -= segmentHeight;
                    return (
                      <Rect
                        key={bucket.id}
                        x={x}
                        y={offsetY}
                        width={BAR_WIDTH}
                        height={segmentHeight}
                        rx={6}
                        fill={getRepRangeColor(bucket.color_token)}
                      />
                    );
                  })}

                  <Rect
                    x={x}
                    y={PADDING_Y}
                    width={BAR_WIDTH}
                    height={CHART_HEIGHT - PADDING_Y * 2}
                    rx={6}
                    fill="transparent"
                    stroke={theme.colors.border}
                    strokeWidth={1}
                  />
                </React.Fragment>
              );
            })}
          </Svg>

          <View style={styles.labelsRow}>
            {points.map((point) => (
              <Text key={point.week_start} style={[styles.axisLabel, { width: SLOT_WIDTH }]}>
                {formatLocalDate(point.week_start, { day: 'numeric', month: 'short' })}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      <Text style={styles.chartHint}>
        Cada columna resume el volumen semanal con carga. Los colores indican en que rangos de reps estuvo repartido.
      </Text>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    legendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendLabel: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    labelsRow: {
      flexDirection: 'row',
      marginTop: spacing.xs,
      paddingLeft: PADDING_X - (SLOT_WIDTH - BAR_WIDTH) / 2,
    },
    axisLabel: {
      textAlign: 'center',
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    emptyState: {
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    chartHint: {
      marginTop: spacing.sm,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
  });

export default RepRangeVolumeChart;

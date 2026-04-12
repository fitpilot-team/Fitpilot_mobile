import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { WorkoutAnalyticsTrendSeriesSection } from '../../types';
import { buildLineCoordinates, buildPolylinePoints } from '../../utils/workoutAnalytics';

interface WorkoutAnalyticsLineTrendChartProps {
  section: WorkoutAnalyticsTrendSeriesSection;
  contentWidth?: number;
}

const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 20, right: 18, bottom: 32, left: 18 };
const SLOT_WIDTH = 56;

const formatValue = (value: number | null | undefined, unit?: string | null) => {
  if (value == null || Number.isNaN(value)) {
    return '--';
  }

  const formatted = new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: unit === '%' ? 0 : 1,
  }).format(value);

  return unit ? `${formatted} ${unit}` : formatted;
};

const axisDateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
});

const formatAxisLabel = (tooltipLabel: string | null | undefined, fallbackLabel: string) => {
  if (!tooltipLabel) {
    return fallbackLabel;
  }

  const parsed = new Date(`${tooltipLabel}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackLabel;
  }

  return axisDateFormatter.format(parsed).replace('.', '');
};

export const WorkoutAnalyticsLineTrendChart: React.FC<WorkoutAnalyticsLineTrendChartProps> = ({
  section,
  contentWidth = 360,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const hasPrimary = section.points.some((point) => point.value != null);
  const hasSecondary = section.points.some((point) => point.secondary_value != null);

  if (!section.points.length || !hasPrimary) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          No hay suficientes datos para construir esta tendencia en el contexto actual.
        </Text>
      </View>
    );
  }

  const svgWidth = Math.max(
    contentWidth - spacing.lg * 2,
    section.points.length * SLOT_WIDTH + CHART_PADDING.left + CHART_PADDING.right,
  );
  const primaryValues = section.points.map((point) => point.value ?? 0);
  const secondaryValues = section.points.map((point) => point.secondary_value ?? 0);
  const sharedDomain = hasSecondary
    ? {
        min: Math.min(...primaryValues, ...secondaryValues),
        max: Math.max(...primaryValues, ...secondaryValues),
      }
    : undefined;
  const primaryCoordinates = buildLineCoordinates(
    primaryValues,
    svgWidth,
    CHART_HEIGHT,
    CHART_PADDING,
    sharedDomain,
  );
  const secondaryCoordinates = hasSecondary
    ? buildLineCoordinates(secondaryValues, svgWidth, CHART_HEIGHT, CHART_PADDING, sharedDomain)
    : [];
  const latestPoint = section.points[section.points.length - 1];
  const primaryFooterValue = latestPoint.value;
  const secondaryFooterValue = latestPoint.secondary_value;
  const primaryFooterLabel = section.primary_label ?? 'Actual';
  const secondaryFooterLabel = section.secondary_label ?? 'Planeado';

  return (
    <View style={styles.container}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={styles.legendLabel}>{section.primary_label ?? 'Serie principal'}</Text>
        </View>
        {hasSecondary ? (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
            <Text style={styles.legendLabel}>{section.secondary_label ?? 'Serie secundaria'}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <Svg width={svgWidth} height={CHART_HEIGHT}>
            {hasSecondary ? (
              <>
                <Polyline
                  fill="none"
                  stroke={theme.colors.success}
                  strokeWidth={3}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={buildPolylinePoints(secondaryCoordinates)}
                />
                {secondaryCoordinates.map((point, index) => (
                  <Circle
                    key={`secondary-${section.points[index]?.tooltip_label ?? section.points[index]?.label ?? index}`}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    fill={theme.colors.surface}
                    stroke={theme.colors.success}
                    strokeWidth={2}
                  />
                ))}
              </>
            ) : null}

            <Polyline
              fill="none"
              stroke={theme.colors.primary}
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={buildPolylinePoints(primaryCoordinates)}
            />

            {primaryCoordinates.map((point, index) => (
              <React.Fragment
                key={`primary-${section.points[index]?.tooltip_label ?? section.points[index]?.label ?? index}`}
              >
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={4.5}
                  fill={theme.colors.surface}
                  stroke={theme.colors.primary}
                  strokeWidth={2}
                />
              </React.Fragment>
            ))}
          </Svg>

          <View style={styles.labelsRow}>
            {section.points.map((point, index) => (
              <Text
                key={point.tooltip_label ?? `${point.label}-${index}`}
                style={[
                  styles.axisLabel,
                  { width: SLOT_WIDTH },
                ]}
              >
                {formatAxisLabel(point.tooltip_label, point.label)}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerRow}>
        <View style={styles.footerMetric}>
          <Text style={styles.footerLabel}>{primaryFooterLabel}</Text>
          <Text style={styles.footerValue}>{formatValue(primaryFooterValue, section.unit)}</Text>
        </View>
        {hasSecondary ? (
          <View style={styles.footerMetric}>
            <Text style={styles.footerLabel}>{secondaryFooterLabel}</Text>
            <Text style={styles.footerValue}>
              {formatValue(secondaryFooterValue, section.unit)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    legendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
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
    legendLabel: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    labelsRow: {
      flexDirection: 'row',
      paddingHorizontal: CHART_PADDING.left - 4,
      gap: spacing.sm,
    },
    axisLabel: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    footerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    footerMetric: {
      flex: 1,
      minWidth: 120,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.sm,
      gap: 4,
    },
    footerLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    footerValue: {
      fontSize: fontSize.base,
      fontWeight: '800',
      color: theme.colors.textPrimary,
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
  });

export default WorkoutAnalyticsLineTrendChart;

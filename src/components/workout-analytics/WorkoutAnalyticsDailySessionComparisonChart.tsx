import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { WorkoutAnalyticsTrendSeriesSection } from '../../types';

interface WorkoutAnalyticsDailySessionComparisonChartProps {
  section: WorkoutAnalyticsTrendSeriesSection;
  contentWidth?: number;
}

type DayStatusTone = 'success' | 'muted' | 'primary' | 'warning';

type DayStatus = {
  label: string;
  tone: DayStatusTone;
} | null;

const CHART_HEIGHT = 168;
const DAY_COLUMN_WIDTH = 68;
const BAR_WIDTH = 14;

const axisDateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
});

const integerFormatter = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 0,
});

const formatDayLabel = (tooltipLabel: string | null | undefined, fallbackLabel: string) => {
  if (!tooltipLabel) {
    return fallbackLabel;
  }

  const parsed = new Date(`${tooltipLabel}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackLabel;
  }

  return axisDateFormatter.format(parsed).replace('.', '');
};

const normalizeCount = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
};

const getDayStatus = (actual: number, planned: number): DayStatus => {
  if (actual > 0 && planned === 0) {
    return { label: 'Fuera del plan', tone: 'warning' };
  }

  if (actual > planned && planned > 0) {
    return { label: 'Extra', tone: 'warning' };
  }

  if (actual === planned && planned > 0) {
    return { label: 'Cumplido', tone: 'success' };
  }

  if (actual > 0 && actual < planned) {
    return { label: 'Parcial', tone: 'primary' };
  }

  if (actual === 0 && planned > 0) {
    return { label: 'Pendiente', tone: 'muted' };
  }

  return null;
};

const getStatusToneStyles = (theme: AppTheme, tone: DayStatusTone) => {
  switch (tone) {
    case 'success':
      return {
        backgroundColor: theme.isDark ? 'rgba(52, 211, 153, 0.18)' : '#ecfdf5',
        borderColor: theme.isDark ? 'rgba(52, 211, 153, 0.3)' : '#a7f3d0',
        color: theme.colors.success,
      };
    case 'primary':
      return {
        backgroundColor: theme.colors.primarySoft,
        borderColor: theme.colors.primaryBorder,
        color: theme.colors.primary,
      };
    case 'warning':
      return {
        backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.18)' : '#fffbeb',
        borderColor: theme.isDark ? 'rgba(251, 191, 36, 0.3)' : '#fde68a',
        color: theme.colors.warning,
      };
    default:
      return {
        backgroundColor: theme.colors.surfaceAlt,
        borderColor: theme.colors.border,
        color: theme.colors.textMuted,
      };
  }
};

export const WorkoutAnalyticsDailySessionComparisonChart: React.FC<
  WorkoutAnalyticsDailySessionComparisonChartProps
> = ({ section, contentWidth = 360 }) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const rows = section.points.map((point) => {
    const actual = normalizeCount(point.value);
    const planned = normalizeCount(point.secondary_value);

    return {
      key: point.tooltip_label ?? point.label,
      actual,
      planned,
      label: formatDayLabel(point.tooltip_label, point.label),
      status: getDayStatus(actual, planned),
    };
  });

  if (!rows.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          No hay suficientes datos para mostrar el cumplimiento de este microciclo.
        </Text>
      </View>
    );
  }

  const totalPlanned = rows.reduce((sum, row) => sum + row.planned, 0);
  const completedPlanned = rows.reduce((sum, row) => sum + Math.min(row.actual, row.planned), 0);
  const pendingSessions = Math.max(totalPlanned - completedPlanned, 0);
  const completionPercentage = totalPlanned > 0 ? Math.round((completedPlanned / totalPlanned) * 100) : 0;
  const maxScaleValue = Math.max(1, ...rows.map((row) => Math.max(row.actual, row.planned)));
  const tickValues = Array.from({ length: maxScaleValue + 1 }, (_, index) => maxScaleValue - index);
  const chartWidth = Math.max(contentWidth - 88, rows.length * DAY_COLUMN_WIDTH);

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Realizaste</Text>
          <Text style={styles.summaryValue}>
            {integerFormatter.format(completedPlanned)} de {integerFormatter.format(totalPlanned)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pendientes</Text>
          <Text style={styles.summaryValue}>{integerFormatter.format(pendingSessions)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Cumplimiento</Text>
          <Text style={styles.summaryValue}>{integerFormatter.format(completionPercentage)}%</Text>
        </View>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={styles.legendLabel}>{section.primary_label ?? 'Realizadas'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
          <Text style={styles.legendLabel}>{section.secondary_label ?? 'Programadas'}</Text>
        </View>
      </View>

      <View style={styles.chartShell}>
        <View style={[styles.scaleColumn, { height: CHART_HEIGHT }]}>
          {tickValues.map((tick) => (
            <Text key={tick} style={styles.scaleLabel}>
              {tick}
            </Text>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.chartContent, { width: chartWidth }]}>
            <View style={[styles.chartArea, { height: CHART_HEIGHT }]}>
              <View style={styles.gridOverlay}>
                {tickValues.map((tick, index) => (
                  <View
                    key={`grid-${tick}`}
                    style={[styles.gridRow, index === tickValues.length - 1 ? styles.gridRowLast : null]}
                  />
                ))}
              </View>

              <View style={styles.dayColumns}>
                {rows.map((row) => {
                  const actualHeight = (row.actual / maxScaleValue) * CHART_HEIGHT;
                  const plannedHeight = (row.planned / maxScaleValue) * CHART_HEIGHT;

                  return (
                    <View key={`bars-${row.key}`} style={styles.dayColumn}>
                      <View style={[styles.barsArea, { height: CHART_HEIGHT }]}>
                        <View style={styles.barPair}>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.bar,
                                styles.actualBar,
                                {
                                  height: row.actual > 0 ? Math.max(actualHeight, 6) : 0,
                                },
                              ]}
                            />
                          </View>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.bar,
                                styles.plannedBar,
                                {
                                  height: row.planned > 0 ? Math.max(plannedHeight, 6) : 0,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.dayMetaRow}>
              {rows.map((row) => {
                const statusTone = row.status ? getStatusToneStyles(theme, row.status.tone) : null;

                return (
                  <View key={`meta-${row.key}`} style={styles.dayColumn}>
                    <Text style={styles.dayLabel}>{row.label}</Text>

                    {row.status ? (
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: statusTone?.backgroundColor,
                            borderColor: statusTone?.borderColor,
                          },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: statusTone?.color }]}>{row.status.label}</Text>
                      </View>
                    ) : (
                      <View style={styles.statusSpacer} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpText}>
          Si un día realizaste más de lo programado, lo mostramos como una sesión extra.
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    summaryCard: {
      flex: 1,
      minWidth: 110,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      padding: spacing.sm,
      gap: 4,
    },
    summaryLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    summaryValue: {
      fontSize: fontSize.base,
      fontWeight: '800',
      color: theme.colors.textPrimary,
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
      borderRadius: borderRadius.full,
    },
    legendLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    chartShell: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
    },
    scaleColumn: {
      width: 22,
      justifyContent: 'space-between',
      paddingBottom: 2,
    },
    scaleLabel: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      textAlign: 'right',
    },
    chartContent: {
      gap: spacing.sm,
    },
    chartArea: {
      position: 'relative',
    },
    gridOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'space-between',
      paddingTop: 1,
      pointerEvents: 'none',
    },
    gridRow: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    gridRowLast: {
      borderTopColor: theme.colors.borderStrong,
    },
    dayColumns: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
    dayMetaRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
    },
    dayColumn: {
      width: DAY_COLUMN_WIDTH,
      gap: spacing.xs,
      alignItems: 'center',
    },
    barsArea: {
      width: '100%',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.xs,
    },
    barPair: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: 6,
      height: '100%',
    },
    barTrack: {
      width: BAR_WIDTH,
      height: '100%',
      justifyContent: 'flex-end',
    },
    bar: {
      width: BAR_WIDTH,
      borderTopLeftRadius: borderRadius.sm,
      borderTopRightRadius: borderRadius.sm,
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 4,
    },
    actualBar: {
      backgroundColor: theme.colors.primary,
    },
    plannedBar: {
      backgroundColor: theme.colors.success,
    },
    dayLabel: {
      fontSize: fontSize.xs,
      color: theme.colors.textSecondary,
      fontWeight: '700',
      textAlign: 'center',
    },
    statusPill: {
      minHeight: 28,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      textAlign: 'center',
    },
    statusSpacer: {
      minHeight: 28,
    },
    helpCard: {
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    helpText: {
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textSecondary,
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

export default WorkoutAnalyticsDailySessionComparisonChart;

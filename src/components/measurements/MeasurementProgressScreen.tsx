import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Card, LoadingSpinner } from '../common';
import {
  getMeasurementProgressMetricConfig,
} from '../../constants/measurements';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { listMyMeasurements } from '../../services/measurements';
import { useMeasurementPreferenceStore } from '../../store/measurementPreferenceStore';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { ApiError, MeasurementHistoryItem } from '../../types';
import {
  formatMeasurementDate,
  formatMeasurementNumber,
  getMeasurementDisplayDate,
  parseMeasurementNumber,
} from '../../utils/measurements';
import { convertMeasurementUnitValue, getMeasurementDisplayUnit } from '../../utils/measurementUnits';

type RangePreset = '7d' | '30d' | '90d' | 'all';

type ProgressRecord = {
  id: string;
  date: string;
  timestamp: number;
  value: number;
};

const HISTORY_PAGE_SIZE = 100;
const CHART_HEIGHT = 220;
const CHART_PADDING_X = 24;
const CHART_PADDING_Y = 20;
const RANGE_OPTIONS: { key: RangePreset; label: string }[] = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: '90d', label: '90 dias' },
  { key: 'all', label: 'Todo' },
];

const parseMeasurementDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const normalized = value.includes('T') ? value : `${value}T00:00:00`;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveRangeStart = (range: RangePreset) => {
  if (range === 'all') {
    return null;
  }

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const next = new Date();
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - (days - 1));
  return next.getTime();
};

const buildChartPath = (points: { x: number; y: number }[]) => {
  if (points.length === 0) {
    return '';
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
};

const loadAllMeasurements = async () => {
  const allMeasurements: MeasurementHistoryItem[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await listMyMeasurements(page, HISTORY_PAGE_SIZE);
    allMeasurements.push(...response.data);
    totalPages = response.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);

  return allMeasurements;
};

interface MeasurementProgressScreenProps {
  metricKey?: string | null;
}

export const MeasurementProgressScreen: React.FC<MeasurementProgressScreenProps> = ({
  metricKey,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const measurementPreference = useMeasurementPreferenceStore((state) => state.preference);
  const initializeMeasurementPreference = useMeasurementPreferenceStore((state) => state.initialize);
  const [range, setRange] = useState<RangePreset>('30d');
  const [measurements, setMeasurements] = useState<MeasurementHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metricConfig = useMemo(
    () => getMeasurementProgressMetricConfig(metricKey),
    [metricKey],
  );

  const loadMeasurements = useCallback(async () => {
    try {
      setError(null);
      const allMeasurements = await loadAllMeasurements();
      setMeasurements(allMeasurements);
    } catch (loadError) {
      const apiError = loadError as ApiError;
      setError(apiError.message || 'No fue posible cargar el progreso de esta medida.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void initializeMeasurementPreference();
    void loadMeasurements();
  }, [initializeMeasurementPreference, loadMeasurements]);

  const allRecords = useMemo(() => {
    if (!metricConfig) {
      return [];
    }

    return measurements
      .map((measurement) => {
        const measurementDate = getMeasurementDisplayDate(measurement);
        const parsedDate = parseMeasurementDate(measurementDate);

        if (!parsedDate) {
          return null;
        }

        const metricValue = metricConfig.source === 'field'
          ? parseMeasurementNumber(measurement[metricConfig.fieldKey])
          : metricConfig.getValue(measurement);

        if (metricValue === null) {
          return null;
        }

        const convertedValue = convertMeasurementUnitValue(
          metricValue,
          metricConfig.unit,
          measurementPreference,
        );

        return {
          id: measurement.id,
          date: measurementDate ?? '',
          timestamp: parsedDate.getTime(),
          value: convertedValue.value,
        } satisfies ProgressRecord;
      })
      .filter(Boolean)
      .sort((left, right) => left!.timestamp - right!.timestamp) as ProgressRecord[];
  }, [measurementPreference, measurements, metricConfig]);

  const visibleRecords = useMemo(() => {
    const rangeStart = resolveRangeStart(range);

    if (rangeStart === null) {
      return allRecords;
    }

    return allRecords.filter((record) => record.timestamp >= rangeStart);
  }, [allRecords, range]);

  const recentRecords = useMemo(
    () => [...visibleRecords].sort((left, right) => right.timestamp - left.timestamp).slice(0, 8),
    [visibleRecords],
  );

  const chartWidth = Math.max(Math.min(width - spacing.lg * 2, 520), 260);
  const chartPoints = useMemo(() => {
    if (visibleRecords.length === 0) {
      return [];
    }

    const values = visibleRecords.map((record) => record.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const effectiveRange = maxValue - minValue || 1;
    const usableWidth = chartWidth - CHART_PADDING_X * 2;
    const usableHeight = CHART_HEIGHT - CHART_PADDING_Y * 2;

    if (visibleRecords.length === 1) {
      return [
        {
          x: chartWidth / 2,
          y:
            CHART_PADDING_Y +
            usableHeight -
            ((visibleRecords[0].value - minValue) / effectiveRange) * usableHeight,
        },
      ];
    }

    return visibleRecords.map((record, index) => ({
      x: CHART_PADDING_X + (index / (visibleRecords.length - 1)) * usableWidth,
      y:
        CHART_PADDING_Y +
        usableHeight -
        ((record.value - minValue) / effectiveRange) * usableHeight,
    }));
  }, [chartWidth, visibleRecords]);

  const chartPath = useMemo(() => buildChartPath(chartPoints), [chartPoints]);

  const latestRecord = visibleRecords[visibleRecords.length - 1] ?? null;
  const firstRecord = visibleRecords[0] ?? null;
  const delta = latestRecord && firstRecord
    ? latestRecord.value - firstRecord.value
    : null;
  const displayUnit = metricConfig
    ? getMeasurementDisplayUnit(metricConfig.unit, measurementPreference) ?? metricConfig.unit
    : null;

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Cargando progreso..." />;
  }

  if (!metricConfig) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medidas</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerState}>
          <Ionicons name="analytics-outline" size={40} color={theme.colors.iconMuted} />
          <Text style={styles.centerTitle}>Medida no disponible</Text>
          <Text style={styles.centerText}>
            Esta grafica no esta configurada todavia.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{metricConfig.progressTitle}</Text>
          <Text style={styles.headerSubtitle}>{metricConfig.progressSubtitle}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadMeasurements();
            }}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.rangeChip,
                range === option.key ? styles.rangeChipActive : null,
              ]}
              activeOpacity={0.85}
              onPress={() => setRange(option.key)}
            >
              <Text
                style={[
                  styles.rangeChipText,
                  range === option.key ? styles.rangeChipTextActive : null,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>No fue posible cargar el progreso</Text>
            <Text style={styles.sectionDescription}>{error}</Text>
          </Card>
        ) : null}

        {!error && visibleRecords.length === 0 ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Sin datos para este rango</Text>
            <Text style={styles.sectionDescription}>
              Cambia el filtro o registra nuevas mediciones para ver la tendencia.
            </Text>
          </Card>
        ) : null}

        {!error && visibleRecords.length > 0 ? (
          <>
            <Card style={styles.sectionCard}>
              <View style={styles.kpiRow}>
                <View style={styles.kpiBlock}>
                  <Text style={styles.kpiLabel}>Ultimo valor</Text>
                  <Text style={styles.kpiValue}>
                    {latestRecord ? formatMeasurementNumber(latestRecord.value, metricConfig.decimals ?? 1) : '--'}
                    {displayUnit ? <Text style={styles.kpiUnit}> {displayUnit}</Text> : null}
                  </Text>
                </View>
                <View style={styles.kpiBlock}>
                  <Text style={styles.kpiLabel}>Cambio</Text>
                  <Text
                    style={[
                      styles.kpiValue,
                      delta !== null
                        ? { color: delta >= 0 ? theme.colors.success : theme.colors.warning }
                        : null,
                    ]}
                  >
                    {delta === null
                      ? '--'
                      : `${delta > 0 ? '+' : ''}${formatMeasurementNumber(
                          delta,
                          metricConfig.decimals ?? 1,
                        )}`}
                    {displayUnit ? <Text style={styles.kpiUnit}> {displayUnit}</Text> : null}
                  </Text>
                </View>
              </View>

              <View style={styles.chartWrapper}>
                <Svg width={chartWidth} height={CHART_HEIGHT}>
                  {[0, 1, 2, 3].map((lineIndex) => {
                    const y =
                      CHART_PADDING_Y +
                      (lineIndex / 3) * (CHART_HEIGHT - CHART_PADDING_Y * 2);

                    return (
                      <Line
                        key={lineIndex}
                        x1={CHART_PADDING_X}
                        x2={chartWidth - CHART_PADDING_X}
                        y1={y}
                        y2={y}
                        stroke={theme.colors.border}
                        strokeWidth={1}
                        strokeDasharray="3 4"
                      />
                    );
                  })}
                  {chartPath ? (
                    <Path
                      d={chartPath}
                      stroke={theme.colors.primary}
                      strokeWidth={3}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null}
                  {chartPoints.map((point, index) => (
                    <Circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r={4}
                      fill={theme.colors.primary}
                    />
                  ))}
                </Svg>
              </View>

              <View style={styles.chartAxisLabels}>
                <Text style={styles.axisLabel}>
                  {formatMeasurementDate(visibleRecords[0]?.date, 'short')}
                </Text>
                <Text style={styles.axisLabel}>
                  {formatMeasurementDate(visibleRecords[visibleRecords.length - 1]?.date, 'short')}
                </Text>
              </View>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Historial reciente</Text>
              <Text style={styles.sectionDescription}>
                Ultimos registros dentro del rango seleccionado.
              </Text>
              <View style={styles.historyList}>
                {recentRecords.map((record) => (
                  <View key={record.id} style={styles.historyRow}>
                    <View>
                      <Text style={styles.historyDate}>
                        {formatMeasurementDate(record.date, 'short')}
                      </Text>
                      <Text style={styles.historyHint}>
                        {formatMeasurementDate(record.date, 'long')}
                      </Text>
                    </View>
                    <Text style={styles.historyValue}>
                      {formatMeasurementNumber(record.value, metricConfig.decimals ?? 1)}
                      {displayUnit ? <Text style={styles.historyUnit}> {displayUnit}</Text> : null}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    headerSubtitle: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    headerSpacer: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    rangeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    rangeChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    rangeChipActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
    },
    rangeChipText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    rangeChipTextActive: {
      color: theme.colors.primary,
    },
    sectionCard: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    sectionDescription: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    centerState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.md,
    },
    centerTitle: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    centerText: {
      fontSize: fontSize.base,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    kpiRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    kpiBlock: {
      flex: 1,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    kpiLabel: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    kpiValue: {
      marginTop: spacing.xs,
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    kpiUnit: {
      fontSize: fontSize.sm,
      fontWeight: '400',
      color: theme.colors.textMuted,
    },
    chartWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: spacing.md,
    },
    chartAxisLabels: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    axisLabel: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    historyList: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    historyDate: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    historyHint: {
      marginTop: spacing.xs,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    historyValue: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    historyUnit: {
      fontSize: fontSize.sm,
      fontWeight: '400',
      color: theme.colors.textMuted,
    },
  });

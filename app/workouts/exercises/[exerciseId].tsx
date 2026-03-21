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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, LoadingSpinner } from '../../../src/components/common';
import AnalyticsRangeSelector from '../../../src/components/workout-analytics/AnalyticsRangeSelector';
import ExerciseTrendChart from '../../../src/components/workout-analytics/ExerciseTrendChart';
import { DEFAULT_WORKOUT_ANALYTICS_RANGE } from '../../../src/constants/workoutAnalytics';
import { borderRadius, colors, fontSize, shadows, spacing } from '../../../src/constants/colors';
import { getWorkoutAnalyticsExerciseDetail } from '../../../src/services/workoutAnalytics';
import type {
  ApiError,
  ExerciseTrendDetail,
  RepRangeBucket,
  WorkoutAnalyticsRange,
} from '../../../src/types';
import { formatLocalDate } from '../../../src/utils/date';
import {
  formatVolumeKg,
  formatWeightKg,
  normalizeWorkoutAnalyticsRange,
} from '../../../src/utils/workoutAnalytics';

const DetailSummaryCard = ({
  value,
  label,
}: {
  value: string;
  label: string;
}) => (
  <View style={styles.summaryCard}>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

export default function ExerciseTrendDetailScreen() {
  const { exerciseId, range: rangeParam } = useLocalSearchParams<{
    exerciseId: string;
    range?: string;
  }>();
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<WorkoutAnalyticsRange>(
    normalizeWorkoutAnalyticsRange(rangeParam, DEFAULT_WORKOUT_ANALYTICS_RANGE),
  );
  const [detail, setDetail] = useState<ExerciseTrendDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRange(normalizeWorkoutAnalyticsRange(rangeParam, DEFAULT_WORKOUT_ANALYTICS_RANGE));
  }, [rangeParam]);

  const loadDetail = useCallback(
    async (options?: { refresh?: boolean }) => {
      if (!exerciseId) {
        return;
      }

      const isRefresh = options?.refresh ?? false;
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await getWorkoutAnalyticsExerciseDetail(exerciseId, range);
        setDetail(response);
        setError(null);
      } catch (loadError) {
        const apiError = loadError as ApiError;
        setError(apiError.message || 'No fue posible cargar este ejercicio.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [exerciseId, range],
  );

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const repRangeMap = useMemo(() => {
    const entries = (detail?.preferences.rep_ranges ?? []).map((bucket: RepRangeBucket) => [
      bucket.id,
      bucket.label,
    ]);
    return Object.fromEntries(entries);
  }, [detail?.preferences.rep_ranges]);

  const summaryCards = useMemo(() => {
    if (!detail) {
      return [];
    }

    return [
      { label: 'PR en rango', value: formatWeightKg(detail.summary.personal_best_kg ?? null) },
      { label: 'Sesiones', value: `${detail.summary.total_sessions}` },
      {
        label: 'Primera',
        value: detail.summary.first_logged_at
          ? formatLocalDate(detail.summary.first_logged_at, { day: 'numeric', month: 'short' })
          : '--',
      },
      {
        label: 'Ultima',
        value: detail.summary.last_logged_at
          ? formatLocalDate(detail.summary.last_logged_at, { day: 'numeric', month: 'short' })
          : '--',
      },
    ];
  }, [detail]);

  if (isLoading && !detail) {
    return <LoadingSpinner fullScreen text="Cargando progreso del ejercicio..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.gray[900]} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{detail?.exercise_name ?? 'Ejercicio'}</Text>
          <Text style={styles.subtitle}>Evolucion de carga y volumen a lo largo del tiempo</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadDetail({ refresh: true })}
            tintColor={colors.primary[500]}
          />
        }
      >
        <AnalyticsRangeSelector value={range} onChange={setRange} />

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>No fue posible cargar el ejercicio</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Reintentar" onPress={() => void loadDetail()} />
          </Card>
        ) : null}

        {summaryCards.length ? (
          <View style={styles.summaryGrid}>
            {summaryCards.map((card) => (
              <DetailSummaryCard key={card.label} value={card.value} label={card.label} />
            ))}
          </View>
        ) : null}

        <Card style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Tendencia de mejor carga</Text>
          <Text style={styles.sectionSubtitle}>
            La linea principal sigue la mejor carga registrada; las barras dejan ver el volumen total.
          </Text>
          <ExerciseTrendChart
            series={detail?.series ?? []}
            repRanges={detail?.preferences.rep_ranges ?? []}
            contentWidth={Math.max(width - spacing.lg * 2, 280)}
          />
        </Card>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Registros</Text>
          {detail?.series.length ? (
            detail.series
              .slice()
              .reverse()
              .map((point) => (
                <View key={point.performed_on_date} style={styles.recordCard}>
                  <View style={styles.recordTopRow}>
                    <Text style={styles.recordDate}>
                      {formatLocalDate(point.performed_on_date, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                    <View style={styles.recordBucket}>
                      <Text style={styles.recordBucketText}>
                        {point.reps_bucket_id ? repRangeMap[point.reps_bucket_id] || 'Sin bucket' : 'Sin bucket'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recordStatsRow}>
                    <View style={styles.recordStatPill}>
                      <Text style={styles.recordStatLabel}>Mejor carga</Text>
                      <Text style={styles.recordStatValue}>{formatWeightKg(point.best_weight_kg ?? null)}</Text>
                    </View>
                    <View style={styles.recordStatPill}>
                      <Text style={styles.recordStatLabel}>Volumen</Text>
                      <Text style={styles.recordStatValue}>{formatVolumeKg(point.volume_kg)}</Text>
                    </View>
                  </View>
                </View>
              ))
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="analytics-outline" size={40} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>Sin registros en este rango</Text>
              <Text style={styles.emptyText}>
                Cambia la ventana temporal para revisar mas sesiones de este ejercicio.
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.gray[900],
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 80,
    gap: spacing.lg,
  },
  errorCard: {
    gap: spacing.sm,
  },
  errorTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.gray[900],
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryCard: {
    width: '48%',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
    ...shadows.sm,
  },
  summaryValue: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.gray[900],
  },
  summaryLabel: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.gray[500],
    textTransform: 'uppercase',
  },
  chartCard: {
    padding: spacing.lg,
  },
  sectionContainer: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
  },
  sectionSubtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  recordCard: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
    ...shadows.sm,
  },
  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'center',
  },
  recordDate: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.gray[900],
    textTransform: 'capitalize',
  },
  recordBucket: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  recordBucketText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary[700],
  },
  recordStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  recordStatPill: {
    flex: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    padding: spacing.sm,
  },
  recordStatLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  recordStatValue: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.gray[900],
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.gray[900],
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
  },
});

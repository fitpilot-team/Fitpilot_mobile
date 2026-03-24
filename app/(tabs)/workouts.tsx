import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, LoadingSpinner } from '../../src/components/common';
import AnalyticsRangeSelector from '../../src/components/workout-analytics/AnalyticsRangeSelector';
import ExerciseSparkline from '../../src/components/workout-analytics/ExerciseSparkline';
import RepRangeEditorModal from '../../src/components/workout-analytics/RepRangeEditorModal';
import RepRangeVolumeChart from '../../src/components/workout-analytics/RepRangeVolumeChart';
import { DEFAULT_WORKOUT_ANALYTICS_RANGE } from '../../src/constants/workoutAnalytics';
import { borderRadius, fontSize, shadows, spacing } from '../../src/constants/colors';
import {
  getWorkoutAnalyticsDashboard,
  updateWorkoutAnalyticsPreferences,
} from '../../src/services/workoutAnalytics';
import { useBottomTabBarScroll } from '../../src/hooks/useBottomTabBarVisibility';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../src/theme';
import type {
  ApiError,
  ExerciseTrendSummary,
  RecentWorkoutHistoryItem,
  RepRangeBucket,
  WorkoutAnalyticsDashboard,
  WorkoutAnalyticsRange,
} from '../../src/types';
import { formatLocalDate } from '../../src/utils/date';
import { formatDuration } from '../../src/utils/formatters';
import {
  formatDeltaKg,
  formatVolumeKg,
  formatWeightKg,
} from '../../src/utils/workoutAnalytics';

const getHistoryStatusMeta = (
  status: RecentWorkoutHistoryItem['status'],
  theme: AppTheme,
) => {
  switch (status) {
    case 'completed':
      return { icon: 'checkmark-circle', color: theme.colors.success, label: 'Completado' };
    case 'in_progress':
      return { icon: 'play-circle', color: theme.colors.primary, label: 'En progreso' };
    case 'abandoned':
      return { icon: 'warning', color: theme.colors.warning, label: 'Abandonado' };
    default:
      return { icon: 'barbell', color: theme.colors.iconMuted, label: status };
  }
};

const getDeltaColor = (delta: number | null | undefined, theme: AppTheme) => {
  if (delta == null || delta === 0) {
    return theme.colors.textMuted;
  }
  return delta > 0 ? theme.colors.success : theme.colors.warning;
};

const SummaryCard = ({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
};

const ExerciseCard = ({
  exercise,
  onPress,
}: {
  exercise: ExerciseTrendSummary;
  onPress: () => void;
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const deltaColor = getDeltaColor(exercise.best_weight_delta_kg, theme);

  return (
    <TouchableOpacity style={styles.exerciseCard} activeOpacity={0.86} onPress={onPress}>
      <View style={styles.exerciseCardTop}>
        <View style={styles.exerciseCopy}>
          <Text style={styles.exerciseName} numberOfLines={2}>
            {exercise.exercise_name}
          </Text>
          <Text style={styles.exerciseMeta}>
            {exercise.last_performed_on
              ? `Ultima sesion ${formatLocalDate(exercise.last_performed_on, {
                  day: 'numeric',
                  month: 'short',
                })}`
              : 'Sin fecha reciente'}
          </Text>
        </View>
        <ExerciseSparkline values={exercise.sparkline_points} width={132} />
      </View>

      <View style={styles.exerciseStatsRow}>
        <View style={styles.exerciseStatPill}>
          <Text style={styles.exerciseStatLabel}>Mejor carga</Text>
          <Text style={styles.exerciseStatValue}>
            {formatWeightKg(exercise.latest_best_weight_kg ?? null)}
          </Text>
        </View>
        <View style={[styles.deltaPill, { backgroundColor: `${deltaColor}14` }]}>
          <Text style={[styles.deltaText, { color: deltaColor }]}>
            {formatDeltaKg(exercise.best_weight_delta_kg)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HistoryCard = ({
  workout,
  onPress,
}: {
  workout: RecentWorkoutHistoryItem;
  onPress: () => void;
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const statusMeta = getHistoryStatusMeta(workout.status, theme);

  return (
    <TouchableOpacity style={styles.historyCard} activeOpacity={0.86} onPress={onPress}>
      <View style={styles.historyTopRow}>
        <View style={styles.historyTitleRow}>
          <View style={[styles.historyIcon, { backgroundColor: `${statusMeta.color}14` }]}>
            <Ionicons name={statusMeta.icon as keyof typeof Ionicons.glyphMap} size={18} color={statusMeta.color} />
          </View>
          <View style={styles.historyCopy}>
            <Text style={styles.historyName}>{workout.training_day_name}</Text>
            <Text style={styles.historyDate}>
              {formatLocalDate(
                workout.performed_on_date,
                { weekday: 'long', day: 'numeric', month: 'short' },
                'es-MX',
              )}
            </Text>
          </View>
        </View>
        <Text style={[styles.historyStatus, { color: statusMeta.color }]}>{statusMeta.label}</Text>
      </View>

      <View style={styles.historyStatsRow}>
        <View style={styles.historyStat}>
          <Ionicons name="time-outline" size={14} color={theme.colors.iconMuted} />
          <Text style={styles.historyStatText}>
            {workout.duration_minutes != null
              ? formatDuration(Math.max(1, Math.round(workout.duration_minutes)))
              : 'Sin duracion'}
          </Text>
        </View>
        <View style={styles.historyStat}>
          <Ionicons name="fitness-outline" size={14} color={theme.colors.iconMuted} />
          <Text style={styles.historyStatText}>{workout.exercises_count} ejercicios</Text>
        </View>
        <View style={styles.historyStat}>
          <Ionicons name="trending-up-outline" size={14} color={theme.colors.iconMuted} />
          <Text style={styles.historyStatText}>{formatVolumeKg(workout.volume_kg)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function WorkoutsScreen() {
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const tabBarScroll = useBottomTabBarScroll();
  const [range, setRange] = useState<WorkoutAnalyticsRange>(DEFAULT_WORKOUT_ANALYTICS_RANGE);
  const [dashboard, setDashboard] = useState<WorkoutAnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingRanges, setIsSavingRanges] = useState(false);
  const [isRangeEditorVisible, setIsRangeEditorVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAnyHistory = (dashboard?.summary.total_sessions ?? 0) > 0;
  const hasRangeData = (dashboard?.summary.sessions_in_range ?? 0) > 0;
  const contentWidth = Math.max(width - spacing.lg * 2, 280);

  const loadDashboard = useCallback(
    async (options?: { refresh?: boolean }) => {
      const isRefresh = options?.refresh ?? false;
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const nextDashboard = await getWorkoutAnalyticsDashboard(range);
        setDashboard(nextDashboard);
        setError(null);
      } catch (loadError) {
        const apiError = loadError as ApiError;
        setError(apiError.message || 'No fue posible cargar tus entrenamientos.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [range],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = useCallback(async () => {
    await loadDashboard({ refresh: true });
  }, [loadDashboard]);

  const handleSaveRepRanges = useCallback(async (nextRepRanges: RepRangeBucket[]) => {
    setIsSavingRanges(true);

    try {
      await updateWorkoutAnalyticsPreferences({ rep_ranges: nextRepRanges });
      setIsRangeEditorVisible(false);
      await loadDashboard();
    } catch (saveError) {
      const apiError = saveError as ApiError;
      Alert.alert('Error', apiError.message || 'No fue posible guardar tus rangos.');
    } finally {
      setIsSavingRanges(false);
    }
  }, [loadDashboard]);

  const summaryCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      { label: 'Total', value: `${dashboard.summary.total_sessions}`, icon: 'barbell-outline' as const },
      { label: 'En rango', value: `${dashboard.summary.sessions_in_range}`, icon: 'calendar-outline' as const },
      { label: 'Dias activos', value: `${dashboard.summary.active_days}`, icon: 'flash-outline' as const },
      {
        label: 'Duracion media',
        value:
          dashboard.summary.avg_duration_minutes > 0
            ? formatDuration(Math.max(1, Math.round(dashboard.summary.avg_duration_minutes)))
            : '--',
        icon: 'time-outline' as const,
      },
    ];
  }, [dashboard]);

  if (isLoading && !dashboard) {
    return <LoadingSpinner fullScreen text="Cargando tus entrenamientos..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Entrenamientos</Text>
        <Text style={styles.subtitle}>Historial real y progreso de carga por ejercicio</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={tabBarScroll.onScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        scrollEventThrottle={tabBarScroll.scrollEventThrottle}
      >
        <AnalyticsRangeSelector value={range} onChange={setRange} />

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>No fue posible cargar tus datos</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Reintentar" onPress={() => void loadDashboard()} />
          </Card>
        ) : null}

        {summaryCards.length ? (
          <View style={styles.summaryGrid}>
            {summaryCards.map((card) => (
              <SummaryCard key={card.label} value={card.value} label={card.label} icon={card.icon} />
            ))}
          </View>
        ) : null}

        <Card style={styles.chartCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Kg movidos por rango</Text>
              <Text style={styles.sectionSubtitle}>
                {dashboard?.summary.total_volume_kg
                  ? `${formatVolumeKg(dashboard.summary.total_volume_kg)} acumulados en la ventana`
                  : 'Sin carga registrada en esta ventana'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.85}
              onPress={() => setIsRangeEditorVisible(true)}
            >
              <Ionicons name="options-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <RepRangeVolumeChart
            points={dashboard?.rep_range_chart ?? []}
            repRanges={dashboard?.preferences.rep_ranges ?? []}
            contentWidth={contentWidth}
          />
        </Card>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Ejercicios</Text>
              <Text style={styles.sectionSubtitle}>
                {hasRangeData
                  ? 'Toca un ejercicio para abrir su detalle temporal.'
                  : 'No hay progresos visibles en la ventana actual.'}
              </Text>
            </View>
          </View>

          {!hasAnyHistory ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="analytics-outline" size={42} color={theme.colors.iconMuted} />
              <Text style={styles.emptyTitle}>Todavia no tienes historial</Text>
              <Text style={styles.emptyText}>
                Cuando completes tus primeras sesiones veras aqui tus graficas y ejercicios.
              </Text>
              <Button title="Ir a inicio" onPress={() => router.push('/(tabs)')} />
            </Card>
          ) : null}

          {hasAnyHistory && !hasRangeData ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="filter-outline" size={40} color={theme.colors.iconMuted} />
              <Text style={styles.emptyTitle}>Sin datos en este rango</Text>
              <Text style={styles.emptyText}>
                Cambia la ventana temporal para recuperar el progreso de tus ejercicios.
              </Text>
              <Button title="Ver todo" onPress={() => setRange('all')} />
            </Card>
          ) : null}

          {hasRangeData
            ? dashboard?.exercise_summaries.map((exercise) => (
                <ExerciseCard
                  key={exercise.exercise_id}
                  exercise={exercise}
                  onPress={() =>
                    router.push({
                      pathname: '/workouts/exercises/[exerciseId]',
                      params: { exerciseId: exercise.exercise_id, range },
                    })
                  }
                />
              ))
            : null}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Historial</Text>
              <Text style={styles.sectionSubtitle}>Abre cualquier sesion para revisar o editar el log.</Text>
            </View>
          </View>

          {dashboard?.recent_history.length ? (
            dashboard.recent_history.map((workout) => (
              <HistoryCard
                key={workout.workout_log_id}
                workout={workout}
                onPress={() => router.push(`/workout/${workout.workout_log_id}`)}
              />
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="barbell-outline" size={40} color={theme.colors.iconMuted} />
              <Text style={styles.emptyTitle}>Sin sesiones recientes</Text>
              <Text style={styles.emptyText}>
                Tu historial aparecera aqui en cuanto registres entrenamientos.
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      <RepRangeEditorModal
        visible={isRangeEditorVisible}
        repRanges={dashboard?.preferences.rep_ranges ?? []}
        isSaving={isSavingRanges}
        onClose={() => setIsRangeEditorVisible(false)}
        onSave={handleSaveRepRanges}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: fontSize['2xl'],
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
      color: theme.colors.textPrimary,
    },
    errorText: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    summaryCard: {
      width: '48%',
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.md,
      ...shadows.sm,
    },
    summaryIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryValue: {
      marginTop: spacing.md,
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    summaryLabel: {
      marginTop: spacing.xs,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    chartCard: {
      padding: spacing.lg,
    },
    sectionContainer: {
      gap: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    sectionSubtitle: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    editButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    exerciseCard: {
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.md,
      ...shadows.sm,
    },
    exerciseCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    exerciseCopy: {
      flex: 1,
      minWidth: 0,
    },
    exerciseName: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      lineHeight: 28,
    },
    exerciseMeta: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    exerciseStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.md,
    },
    exerciseStatPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surfaceAlt,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    exerciseStatLabel: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    exerciseStatValue: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    deltaPill: {
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    deltaText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
    },
    historyCard: {
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.md,
      ...shadows.sm,
    },
    historyTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    historyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    historyIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    historyCopy: {
      flex: 1,
    },
    historyName: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    historyDate: {
      marginTop: 2,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      textTransform: 'capitalize',
    },
    historyStatus: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    historyStatsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    historyStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    historyStatText: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    emptyCard: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
    emptyTitle: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
  });

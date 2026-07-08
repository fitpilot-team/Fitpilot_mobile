import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileDetailScreen } from '../../src/components/profile/ProfileDetailScreen';
import { SplitDayCard } from '../../src/components/workouts/SplitDayCard';
import { borderRadius, fontSize, spacing } from '../../src/constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../src/theme';
import { useWorkoutStore } from '../../src/store/workoutStore';
import { getWorkoutMacrocycleDetail } from '../../src/services/workoutAnalytics';
import { buildTrainingSplitView, type SplitDay } from '../../src/utils/trainingSplit';
import { buildProgramTimelineModel, findActionableSession } from '../../src/utils/programTimeline';
import { toast } from '../../src/store/toastStore';
import { formatLocalDate, getTodayDateKey } from '../../src/utils/date';
import type { ApiError, Macrocycle } from '../../src/types';

export default function WorkoutSplitScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isFocused = useIsFocused();

  const dashboardBootstrap = useWorkoutStore((state) => state.dashboardBootstrap);
  const workoutLogsVersion = useWorkoutStore((state) => state.workoutLogsVersion);
  const loadDashboardData = useWorkoutStore((state) => state.loadDashboardData);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);

  const [macrocycle, setMacrocycle] = useState<Macrocycle | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [startingDayId, setStartingDayId] = useState<string | null>(null);
  const lastLoadedVersionRef = useRef<number | null>(null);
  const loadedProgramIdRef = useRef<string | null>(null);
  const didSeedExpansionRef = useRef(false);

  const todayDateKey = useMemo(() => getTodayDateKey(), []);
  const program = dashboardBootstrap?.program ?? null;
  const programId = program?.id ?? null;

  // Keep the live status fresh: load the bootstrap if missing and refresh it when
  // returning from a workout session (workoutLogsVersion changed).
  useEffect(() => {
    if (!isFocused) {
      return;
    }
    if (dashboardBootstrap && lastLoadedVersionRef.current === workoutLogsVersion) {
      return;
    }
    const versionAtCall = workoutLogsVersion;
    void loadDashboardData().then(() => {
      lastLoadedVersionRef.current = versionAtCall;
    });
  }, [dashboardBootstrap, isFocused, loadDashboardData, workoutLogsVersion]);

  const loadDetail = useCallback(async () => {
    if (!programId) {
      setMacrocycle(null);
      setIsLoadingDetail(false);
      return;
    }
    loadedProgramIdRef.current = programId;
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const detail = await getWorkoutMacrocycleDetail(programId);
      setMacrocycle(detail);
    } catch (error) {
      loadedProgramIdRef.current = null;
      setDetailError((error as ApiError)?.message || 'No fue posible cargar tu split de entrenamiento.');
    } finally {
      setIsLoadingDetail(false);
    }
  }, [programId]);

  // Fetch the full macrocycle tree once per active program (structure is stable;
  // live status comes from the bootstrap instead).
  useEffect(() => {
    if (!isFocused || !programId || loadedProgramIdRef.current === programId) {
      return;
    }
    void loadDetail();
  }, [isFocused, programId, loadDetail]);

  // Frente de cola global (mismo cálculo que el dashboard) para bloquear el
  // inicio fuera de orden en el split.
  const actionableTrainingDayId = useMemo(
    () =>
      findActionableSession(
        buildProgramTimelineModel(dashboardBootstrap?.timeline).orderedPlannedSessions,
      )?.training_day_id ?? null,
    [dashboardBootstrap],
  );

  const splitView = useMemo(
    () => buildTrainingSplitView(dashboardBootstrap, macrocycle, todayDateKey, actionableTrainingDayId),
    [dashboardBootstrap, macrocycle, todayDateKey, actionableTrainingDayId],
  );

  // Expand "today" (or the first training day) the first time the split resolves.
  useEffect(() => {
    if (didSeedExpansionRef.current || !splitView) {
      return;
    }
    const target =
      splitView.days.find((day) => day.isToday && !day.isRestDay) ??
      splitView.days.find((day) => !day.isRestDay);
    if (target) {
      setExpandedIds(new Set([target.trainingDayId]));
    }
    didSeedExpansionRef.current = true;
  }, [splitView]);

  const toggleDay = useCallback((trainingDayId: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(trainingDayId)) {
        next.delete(trainingDayId);
      } else {
        next.add(trainingDayId);
      }
      return next;
    });
  }, []);

  const handleAction = useCallback(
    async (day: SplitDay) => {
      if (day.locked) {
        toast.info('Termina primero tu entrenamiento pendiente');
        return;
      }
      if (day.workoutLogId) {
        router.push({ pathname: '/workout/[id]', params: { id: day.workoutLogId } });
        return;
      }
      setStartingDayId(day.trainingDayId);
      try {
        const workoutLogId = await startWorkout(day.trainingDayId);
        if (workoutLogId) {
          router.push({ pathname: '/workout/[id]', params: { id: workoutLogId } });
        }
      } finally {
        setStartingDayId(null);
      }
    },
    [startWorkout],
  );

  const subtitle = useMemo(() => {
    if (!splitView) {
      return 'Todos los días y ejercicios de tu microciclo.';
    }
    const rangeLabel =
      splitView.startDate && splitView.endDate
        ? `${formatLocalDate(splitView.startDate, { day: 'numeric', month: 'short' })} - ${formatLocalDate(
            splitView.endDate,
            { day: 'numeric', month: 'short' },
          )}`
        : null;
    return [splitView.microcycleName, rangeLabel].filter(Boolean).join(' · ') ||
      'Todos los días y ejercicios de tu microciclo.';
  }, [splitView]);

  const hasBootstrap = !!dashboardBootstrap;
  const noProgram = hasBootstrap && !program;
  const isDetailPending = !!programId && !macrocycle;
  const isInitialLoading =
    !detailError && !noProgram && !splitView && (!hasBootstrap || isLoadingDetail || isDetailPending);

  const renderBody = () => {
    if (noProgram) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="calendar-outline" size={32} color={theme.colors.iconMuted} />
          <Text style={styles.centerStateTitle}>Sin programa activo</Text>
          <Text style={styles.centerStateLabel}>
            Cuando tengas un programa de entrenamiento vigente, aquí verás tu split completo.
          </Text>
        </View>
      );
    }

    if (isInitialLoading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.centerStateLabel}>Cargando tu split...</Text>
        </View>
      );
    }

    if (detailError) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={32} color={theme.colors.warning} />
          <Text style={styles.centerStateLabel} selectable>
            {detailError}
          </Text>
          <Pressable onPress={() => void loadDetail()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }

    if (!splitView || splitView.days.length === 0) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="barbell-outline" size={32} color={theme.colors.iconMuted} />
          <Text style={styles.centerStateTitle}>Sin días en el microciclo</Text>
          <Text style={styles.centerStateLabel}>
            Tu microciclo actual todavía no tiene días de entrenamiento configurados.
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.summaryCard}>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>
                {splitView.completedCount}/{splitView.trainingDayCount}
              </Text>
              <Text style={styles.summaryStatLabel}>Días</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{splitView.totalExercises}</Text>
              <Text style={styles.summaryStatLabel}>Ejercicios</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{splitView.totalSets}</Text>
              <Text style={styles.summaryStatLabel}>Series</Text>
            </View>
          </View>
        </View>

        <View style={styles.list}>
          {splitView.days.map((day) => (
            <SplitDayCard
              key={day.trainingDayId}
              day={day}
              expanded={expandedIds.has(day.trainingDayId)}
              onToggle={() => toggleDay(day.trainingDayId)}
              onAction={() => void handleAction(day)}
              isBusy={startingDayId === day.trainingDayId}
            />
          ))}
        </View>
      </>
    );
  };

  return (
    <ProfileDetailScreen title="Mi split de entrenamiento" subtitle={subtitle} contentStyle={styles.content}>
      {renderBody()}
    </ProfileDetailScreen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    content: {
      gap: spacing.md,
    },
    summaryCard: {
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    summaryStats: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    summaryStat: {
      flex: 1,
      minHeight: 62,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.xs,
    },
    summaryStatValue: {
      fontSize: fontSize.lg,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    summaryStatLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    summaryDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    list: {
      gap: spacing.sm,
    },
    centerState: {
      paddingVertical: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    centerStateTitle: {
      fontSize: fontSize.lg,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    centerStateLabel: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    retryButton: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    retryButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '800',
      color: theme.colors.primary,
    },
  });

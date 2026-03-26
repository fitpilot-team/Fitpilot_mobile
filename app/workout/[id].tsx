import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '../../src/components/common';
import {
  ExerciseCard,
  PhaseSeparator,
  RestTimer,
  WorkoutToast,
} from '../../src/components/workout';
import type { ToastConfig } from '../../src/components/workout';
import { borderRadius, colors, fontSize, spacing } from '../../src/constants/colors';
import { useWorkoutStore } from '../../src/store/workoutStore';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../src/theme';
import type {
  DayExercise,
  ExercisePhase,
  ExerciseProgress,
  WorkoutScreenMode,
  WorkoutStatus,
} from '../../src/types';
import {
  clampEffortValue,
  isCardioExercise,
  isEditableEffortType,
  shouldShowStrengthEffort,
} from '../../src/utils/formatters';
import { formatLocalShortWeekday, getLocalDayNumber } from '../../src/utils/date';
import {
  createWorkoutExerciseDraft,
  DEFAULT_WORKOUT_EXERCISE_DRAFT,
  getDayExerciseByProgress,
  getExerciseDraftValues,
  getExerciseTargetSetNumber,
  type WorkoutExerciseDraft,
} from '../../src/utils/workoutSession';

type ExerciseDraftOverrides = Partial<{
  reps: number;
  weight: number;
  effortValue: number | null;
  restSeconds: number;
}>;

type ListItem =
  | { type: 'separator'; data: { phase: ExercisePhase } }
  | {
      type: 'exercise';
      data: {
        exercise: DayExercise;
        progress: ExerciseProgress;
        originalIndex: number;
        indexInPhase: number;
        totalInPhase: number;
      };
    };

const PHASE_ORDER: Record<ExercisePhase, number> = { warmup: 0, main: 1, cooldown: 2 };

const getWorkoutScreenMode = (
  status: WorkoutStatus | undefined,
  openedFromStatus: WorkoutStatus | null,
): WorkoutScreenMode => {
  if (status !== 'in_progress') {
    return 'review';
  }

  return openedFromStatus && openedFromStatus !== 'in_progress' ? 'historicalEdit' : 'live';
};

export default function WorkoutSessionScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { id: workoutLogId } = useLocalSearchParams<{ id: string }>();
  const {
    currentWorkout,
    isLoading,
    isSavingSet,
    error,
    loadWorkoutState,
    reopenWorkout,
    saveSet,
    deleteLoggedSet,
    closeWorkout,
    abandonWorkout,
    clearError,
  } = useWorkoutStore();

  const workoutTrainingDay = currentWorkout?.training_day ?? null;
  const [exerciseDraft, setExerciseDraft] = useState<WorkoutExerciseDraft>(DEFAULT_WORKOUT_EXERCISE_DRAFT);
  const [openedFromStatus, setOpenedFromStatus] = useState<WorkoutStatus | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [collapsedPhases, setCollapsedPhases] = useState<Set<ExercisePhase>>(new Set());
  const [setsInProgress, setSetsInProgress] = useState<Record<number, boolean>>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);
  const loadedWorkoutIdRef = useRef<string | null>(null);
  const syncDraftOptionsRef = useRef<{ exerciseIndex?: number; targetSetNumber?: number } | null>(null);

  const currentExerciseIndex = exerciseDraft.currentExerciseIndex;
  const currentSetNumber = exerciseDraft.currentSetNumber;
  const currentReps = exerciseDraft.currentReps;
  const currentWeight = exerciseDraft.currentWeight;
  const currentEffortValue = exerciseDraft.currentEffortValue;
  const restSeconds = exerciseDraft.restSeconds;

  const screenMode = useMemo(
    () => getWorkoutScreenMode(currentWorkout?.workout_log.status, openedFromStatus),
    [currentWorkout?.workout_log.status, openedFromStatus],
  );
  const isReviewMode = screenMode === 'review';
  const isLiveMode = screenMode === 'live';
  const isHistoricalEditMode = screenMode === 'historicalEdit';

  const showToast = useCallback((config: ToastConfig) => {
    setToastVisible(false);
    setTimeout(() => {
      setToastConfig(config);
      setToastVisible(true);
    }, 50);
  }, []);

  useEffect(() => {
    loadedWorkoutIdRef.current = null;
    syncDraftOptionsRef.current = null;
    setOpenedFromStatus(null);
    setExerciseDraft(DEFAULT_WORKOUT_EXERCISE_DRAFT);
    setCollapsedPhases(new Set());
    setSetsInProgress({});
    setShowRestTimer(false);
    setToastVisible(false);
    setToastConfig(null);

    if (workoutLogId) {
      void loadWorkoutState(workoutLogId);
    }
  }, [loadWorkoutState, workoutLogId]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [clearError, error]);

  useEffect(() => {
    if (!currentWorkout) {
      return;
    }

    if (loadedWorkoutIdRef.current !== currentWorkout.workout_log.id) {
      loadedWorkoutIdRef.current = currentWorkout.workout_log.id;
      setOpenedFromStatus(currentWorkout.workout_log.status);
    }

    const nextDraft = createWorkoutExerciseDraft(currentWorkout, syncDraftOptionsRef.current ?? undefined);
    syncDraftOptionsRef.current = null;
    setExerciseDraft(nextDraft);
  }, [currentWorkout]);

  useEffect(() => {
    if (isLiveMode) {
      return;
    }

    setSetsInProgress({});
    setShowRestTimer(false);
    setToastVisible(false);
    setToastConfig(null);
  }, [isLiveMode]);

  const navigateToOrigin = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)');
  }, []);

  const togglePhaseCollapse = useCallback((phase: ExercisePhase) => {
    setCollapsedPhases((previous) => {
      const next = new Set(previous);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  }, []);

  const getExerciseContext = useCallback(
    (exerciseIndex: number) => {
      if (!currentWorkout || !workoutTrainingDay) {
        return null;
      }

      const progress = currentWorkout.exercises_progress[exerciseIndex];
      if (!progress) {
        return null;
      }

      const exercise = getDayExerciseByProgress(workoutTrainingDay, progress);
      if (!exercise) {
        return null;
      }

      return { exercise, progress };
    },
    [currentWorkout, workoutTrainingDay],
  );

  const getResolvedExerciseDraft = useCallback(
    (exerciseIndex: number, targetSetNumber?: number) => {
      const context = getExerciseContext(exerciseIndex);
      if (!context) {
        return null;
      }

      const resolvedSetNumber = getExerciseTargetSetNumber(
        context.exercise,
        context.progress,
        targetSetNumber,
      );
      const defaults = getExerciseDraftValues(
        context.exercise,
        context.progress,
        resolvedSetNumber,
      );
      const isCurrentExercise = exerciseIndex === currentExerciseIndex;

      return {
        context,
        targetSetNumber: resolvedSetNumber,
        reps: isCurrentExercise ? currentReps : defaults.reps,
        weight: isCurrentExercise ? currentWeight : defaults.weight,
        effortValue: isCurrentExercise ? currentEffortValue ?? defaults.effortValue : defaults.effortValue,
        restSeconds: isCurrentExercise ? restSeconds : defaults.restSeconds,
      };
    },
    [
      currentEffortValue,
      currentExerciseIndex,
      currentReps,
      currentWeight,
      getExerciseContext,
      restSeconds,
    ],
  );

  const applyExerciseDraft = useCallback(
    (
      exerciseIndex: number,
      overrides: ExerciseDraftOverrides = {},
      targetSetNumber?: number,
    ) => {
      const context = getExerciseContext(exerciseIndex);
      if (!context) {
        return null;
      }

      const resolvedSetNumber = getExerciseTargetSetNumber(
        context.exercise,
        context.progress,
        targetSetNumber,
      );
      const defaults = getExerciseDraftValues(
        context.exercise,
        context.progress,
        resolvedSetNumber,
      );

      setExerciseDraft({
        currentExerciseIndex: exerciseIndex,
        currentSetNumber: resolvedSetNumber,
        currentReps: overrides.reps ?? defaults.reps,
        currentWeight: overrides.weight ?? defaults.weight,
        currentEffortValue: overrides.effortValue ?? defaults.effortValue,
        restSeconds: overrides.restSeconds ?? defaults.restSeconds,
      });

      return context;
    },
    [getExerciseContext],
  );

  const handleActivateExercise = useCallback((exerciseIndex: number) => {
    if (isReviewMode) {
      return;
    }

    applyExerciseDraft(exerciseIndex);
  }, [applyExerciseDraft, isReviewMode]);

  const handleSelectSet = useCallback((exerciseIndex: number, setNumber: number) => {
    if (isReviewMode) {
      return;
    }

    const context = getExerciseContext(exerciseIndex);
    if (!context) {
      return;
    }

    const selectedSet = context.progress.sets_data.find((setLog) => setLog.set_number === setNumber);
    const defaults = getExerciseDraftValues(context.exercise, context.progress, setNumber);

    applyExerciseDraft(
      exerciseIndex,
      {
        reps: selectedSet?.reps_completed ?? defaults.reps,
        weight: isCardioExercise(context.exercise) ? 0 : selectedSet?.weight_kg ?? defaults.weight,
        effortValue: selectedSet?.effort_value ?? defaults.effortValue,
      },
      setNumber,
    );
    setSetsInProgress((previous) => ({ ...previous, [exerciseIndex]: false }));
  }, [applyExerciseDraft, getExerciseContext, isReviewMode]);

  const handleDeleteSet = useCallback((exerciseIndex: number, setNumber: number) => {
    if (!currentWorkout || !isHistoricalEditMode) {
      return;
    }

    const progress = currentWorkout.exercises_progress[exerciseIndex];
    const targetSet = progress?.sets_data.find((setLog) => setLog.set_number === setNumber);
    if (!targetSet) {
      return;
    }

    Alert.alert(
      'Eliminar serie',
      `Quieres eliminar la serie ${setNumber}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            syncDraftOptionsRef.current = {
              exerciseIndex,
              targetSetNumber: setNumber,
            };

            const didDeleteSet = await deleteLoggedSet(targetSet.id);
            if (!didDeleteSet) {
              syncDraftOptionsRef.current = null;
            }
          },
        },
      ],
    );
  }, [currentWorkout, deleteLoggedSet, isHistoricalEditMode]);

  const handleRepsChange = useCallback((delta: number, exerciseIndex: number) => {
    if (isReviewMode) {
      return;
    }

    const resolvedDraft = getResolvedExerciseDraft(
      exerciseIndex,
      exerciseIndex === currentExerciseIndex ? currentSetNumber : undefined,
    );
    if (!resolvedDraft) {
      return;
    }

    applyExerciseDraft(
      exerciseIndex,
      { reps: Math.max(1, resolvedDraft.reps + delta) },
      resolvedDraft.targetSetNumber,
    );
  }, [applyExerciseDraft, currentExerciseIndex, currentSetNumber, getResolvedExerciseDraft, isReviewMode]);

  const handleWeightChange = useCallback((delta: number, exerciseIndex: number) => {
    if (isReviewMode) {
      return;
    }

    const resolvedDraft = getResolvedExerciseDraft(
      exerciseIndex,
      exerciseIndex === currentExerciseIndex ? currentSetNumber : undefined,
    );
    if (!resolvedDraft) {
      return;
    }

    applyExerciseDraft(
      exerciseIndex,
      { weight: Math.max(0, resolvedDraft.weight + delta) },
      resolvedDraft.targetSetNumber,
    );
  }, [applyExerciseDraft, currentExerciseIndex, currentSetNumber, getResolvedExerciseDraft, isReviewMode]);

  const handleRepsCommit = useCallback((nextReps: number, exerciseIndex: number) => {
    if (isReviewMode) {
      return;
    }

    applyExerciseDraft(
      exerciseIndex,
      { reps: Math.max(1, Math.round(nextReps)) },
      currentSetNumber,
    );
  }, [applyExerciseDraft, currentSetNumber, isReviewMode]);

  const handleWeightCommit = useCallback((nextWeight: number, exerciseIndex: number) => {
    if (isReviewMode) {
      return;
    }

    applyExerciseDraft(
      exerciseIndex,
      { weight: Math.max(0, nextWeight) },
      currentSetNumber,
    );
  }, [applyExerciseDraft, currentSetNumber, isReviewMode]);

  const handleEffortChange = useCallback((delta: number, exerciseIndex: number) => {
    if (isReviewMode) {
      return;
    }

    const resolvedDraft = getResolvedExerciseDraft(
      exerciseIndex,
      exerciseIndex === currentExerciseIndex ? currentSetNumber : undefined,
    );
    if (
      !resolvedDraft ||
      !shouldShowStrengthEffort(resolvedDraft.context.exercise) ||
      !isEditableEffortType(resolvedDraft.context.exercise.effort_type)
    ) {
      return;
    }

    applyExerciseDraft(
      exerciseIndex,
      { effortValue: clampEffortValue((resolvedDraft.effortValue ?? 0) + delta) },
      resolvedDraft.targetSetNumber,
    );
  }, [applyExerciseDraft, currentExerciseIndex, currentSetNumber, getResolvedExerciseDraft, isReviewMode]);

  const saveResolvedSet = useCallback(
    async (
      exerciseIndex: number,
      targetSetNumber: number,
      options?: { nextExerciseIndex?: number; nextSetNumber?: number },
    ) => {
      const resolvedDraft = getResolvedExerciseDraft(exerciseIndex, targetSetNumber);
      if (!resolvedDraft) {
        return false;
      }

      syncDraftOptionsRef.current = {
        exerciseIndex: options?.nextExerciseIndex ?? exerciseIndex,
        targetSetNumber: options?.nextSetNumber ?? targetSetNumber,
      };

      const isCardio = isCardioExercise(resolvedDraft.context.exercise);
      const didSaveSet = await saveSet({
        dayExerciseId: resolvedDraft.context.progress.day_exercise_id,
        setNumber: targetSetNumber,
        repsCompleted: isCardio ? 1 : resolvedDraft.reps,
        weightKg: isCardio ? undefined : resolvedDraft.weight > 0 ? resolvedDraft.weight : undefined,
        effortValue:
          shouldShowStrengthEffort(resolvedDraft.context.exercise) &&
          isEditableEffortType(resolvedDraft.context.exercise.effort_type)
            ? resolvedDraft.effortValue ?? 0
            : undefined,
      });

      if (!didSaveSet) {
        syncDraftOptionsRef.current = null;
      }

      return didSaveSet;
    },
    [getResolvedExerciseDraft, saveSet],
  );

  const handleHistoricalSaveSet = useCallback(async (exerciseIndex: number, setNumber: number) => {
    if (isSavingSet || !isHistoricalEditMode) {
      return;
    }

    const resolvedDraft = getResolvedExerciseDraft(exerciseIndex, setNumber);
    if (!resolvedDraft) {
      return;
    }

    const hasExistingSet = resolvedDraft.context.progress.sets_data.some(
      (setLog) => setLog.set_number === setNumber,
    );
    const nextPendingSetNumber = Math.min(
      resolvedDraft.context.progress.completed_sets + 1,
      resolvedDraft.context.exercise.sets,
    );

    if (!hasExistingSet && setNumber !== nextPendingSetNumber) {
      Alert.alert(
        'Serie no disponible',
        'Solo puedes editar una serie existente o registrar la siguiente serie pendiente.',
      );
      return;
    }

    await saveResolvedSet(exerciseIndex, setNumber);
  }, [getResolvedExerciseDraft, isHistoricalEditMode, isSavingSet, saveResolvedSet]);

  const handleLiveSetAction = useCallback(async (exerciseIndex: number, setNumber: number, totalSets: number) => {
    if (isSavingSet || !isLiveMode || !currentWorkout) {
      return;
    }

    const resolvedDraft = getResolvedExerciseDraft(exerciseIndex, setNumber);
    if (!resolvedDraft) {
      return;
    }

    if (exerciseIndex !== currentExerciseIndex) {
      applyExerciseDraft(
        exerciseIndex,
        {
          reps: resolvedDraft.reps,
          weight: resolvedDraft.weight,
          effortValue: resolvedDraft.effortValue,
          restSeconds: resolvedDraft.restSeconds,
        },
        setNumber,
      );
    }

    const setIsInProgress = setsInProgress[exerciseIndex] || false;
    const unitLabel = isCardioExercise(resolvedDraft.context.exercise) ? 'Bloque' : 'Serie';

    if (!setIsInProgress) {
      setSetsInProgress((previous) => ({ ...previous, [exerciseIndex]: true }));
      showToast({
        message:
          setNumber === 1 && resolvedDraft.context.progress.completed_sets === 0
            ? 'Empieza'
            : `${unitLabel} ${setNumber} en marcha`,
        subtitle:
          setNumber === 1 && resolvedDraft.context.progress.completed_sets === 0
            ? 'Manten buena forma'
            : 'Tu puedes',
        icon: 'flame-outline',
        iconColor: '#F97316',
      });
      return;
    }

    const nextExerciseIndex = exerciseIndex + 1;
    const hasNextExercise = nextExerciseIndex < currentWorkout.exercises_progress.length;
    const didSaveSet = await saveResolvedSet(exerciseIndex, setNumber, {
      nextExerciseIndex: setNumber >= totalSets && hasNextExercise ? nextExerciseIndex : exerciseIndex,
      nextSetNumber: setNumber >= totalSets ? 1 : Math.min(setNumber + 1, totalSets),
    });

    setSetsInProgress((previous) => ({ ...previous, [exerciseIndex]: false }));

    if (!didSaveSet) {
      return;
    }

    if (setNumber >= totalSets) {
      showToast({
        message: 'Ejercicio completado',
        subtitle: 'Excelente trabajo',
        icon: 'trophy-outline',
        iconColor: '#3B82F6',
      });
      return;
    }

    showToast({
      message: `${unitLabel} completado`,
      subtitle: `${unitLabel} ${setNumber} de ${totalSets}`,
      icon: 'checkmark-circle',
      iconColor: '#10B981',
    });
    setShowRestTimer(true);
  }, [
    applyExerciseDraft,
    currentExerciseIndex,
    currentWorkout,
    getResolvedExerciseDraft,
    isLiveMode,
    isSavingSet,
    saveResolvedSet,
    setsInProgress,
    showToast,
  ]);

  const handleReopen = useCallback(async () => {
    if (!workoutLogId || !isReviewMode) {
      return;
    }

    await reopenWorkout(workoutLogId);
  }, [isReviewMode, reopenWorkout, workoutLogId]);

  const handleCloseHistoricalWorkout = useCallback(async () => {
    if (isSavingSet || isLoading || !isHistoricalEditMode) {
      return;
    }

    const didCloseWorkout = await closeWorkout();
    if (didCloseWorkout) {
      navigateToOrigin();
    }
  }, [closeWorkout, isHistoricalEditMode, isLoading, isSavingSet, navigateToOrigin]);

  const handleFinishLiveWorkout = useCallback(() => {
    Alert.alert(
      'Finalizar entrenamiento',
      'Estas seguro de que quieres finalizar el entrenamiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            const didCloseWorkout = await closeWorkout();
            if (didCloseWorkout) {
              navigateToOrigin();
            }
          },
        },
      ],
    );
  }, [closeWorkout, navigateToOrigin]);

  const handlePrimaryFooterAction = useCallback(() => {
    if (isReviewMode) {
      void handleReopen();
      return;
    }

    if (isHistoricalEditMode) {
      void handleCloseHistoricalWorkout();
      return;
    }

    handleFinishLiveWorkout();
  }, [
    handleCloseHistoricalWorkout,
    handleFinishLiveWorkout,
    handleReopen,
    isHistoricalEditMode,
    isReviewMode,
  ]);

  const handleGoBack = useCallback(() => {
    if (isReviewMode) {
      navigateToOrigin();
      return;
    }

    if (isHistoricalEditMode) {
      void handleCloseHistoricalWorkout();
      return;
    }

    Alert.alert(
      'Salir del entrenamiento',
      'Quieres guardar tu progreso y salir, o abandonar el entrenamiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar y salir',
          onPress: navigateToOrigin,
        },
        {
          text: 'Abandonar',
          style: 'destructive',
          onPress: async () => {
            const didAbandonWorkout = await abandonWorkout();
            if (didAbandonWorkout) {
              navigateToOrigin();
            }
          },
        },
      ],
    );
  }, [
    abandonWorkout,
    handleCloseHistoricalWorkout,
    isHistoricalEditMode,
    isReviewMode,
    navigateToOrigin,
  ]);

  const groupedExercises = useMemo((): ListItem[] => {
    if (!currentWorkout || !workoutTrainingDay) {
      return [];
    }

    const exerciseWithProgress = currentWorkout.exercises_progress
      .map((progress, originalIndex) => {
        const exercise = getDayExerciseByProgress(workoutTrainingDay, progress);
        return exercise ? { exercise, progress, originalIndex } : null;
      })
      .filter(
        (item): item is { exercise: DayExercise; progress: ExerciseProgress; originalIndex: number } =>
          item !== null,
      )
      .sort((left, right) => {
        const phaseCompare = PHASE_ORDER[left.exercise.phase] - PHASE_ORDER[right.exercise.phase];
        if (phaseCompare !== 0) {
          return phaseCompare;
        }

        return left.exercise.order_index - right.exercise.order_index;
      });

    const phaseCounts: Record<ExercisePhase, number> = { warmup: 0, main: 0, cooldown: 0 };
    exerciseWithProgress.forEach((item) => {
      phaseCounts[item.exercise.phase] += 1;
    });

    const phaseCounters: Record<ExercisePhase, number> = { warmup: 0, main: 0, cooldown: 0 };
    const result: ListItem[] = [];
    let currentPhase: ExercisePhase | null = null;

    exerciseWithProgress.forEach((item) => {
      if (item.exercise.phase !== currentPhase) {
        currentPhase = item.exercise.phase;
        result.push({ type: 'separator', data: { phase: currentPhase } });
      }

      phaseCounters[item.exercise.phase] += 1;
      result.push({
        type: 'exercise',
        data: {
          ...item,
          indexInPhase: phaseCounters[item.exercise.phase],
          totalInPhase: phaseCounts[item.exercise.phase],
        },
      });
    });

    return result;
  }, [currentWorkout, workoutTrainingDay]);

  const phaseCompletionStatus = useMemo(() => {
    const status: Record<ExercisePhase, boolean> = {
      warmup: true,
      main: true,
      cooldown: true,
    };

    groupedExercises.forEach((item) => {
      if (item.type === 'exercise' && !item.data.progress.is_completed) {
        status[item.data.exercise.phase] = false;
      }
    });

    return status;
  }, [groupedExercises]);

  const currentExercisePhase = useMemo(() => {
    if (!currentWorkout || !workoutTrainingDay) {
      return null;
    }

    const currentExercise = currentWorkout.exercises_progress[currentExerciseIndex];
    const dayExercise = getDayExerciseByProgress(workoutTrainingDay, currentExercise);
    return dayExercise?.phase || null;
  }, [currentExerciseIndex, currentWorkout, workoutTrainingDay]);

  useEffect(() => {
    if (!groupedExercises.length) {
      return;
    }

    const nextCollapsed = new Set<ExercisePhase>();
    (Object.entries(phaseCompletionStatus) as [ExercisePhase, boolean][]).forEach(([phase, completed]) => {
      if (completed && phase !== currentExercisePhase) {
        nextCollapsed.add(phase);
      }
    });

    setCollapsedPhases(nextCollapsed);
  }, [currentExercisePhase, groupedExercises.length, phaseCompletionStatus]);

  const modeBanner = useMemo(() => {
    if (isReviewMode) {
      return {
        title: 'Ver registro',
        subtitle: 'Este entrenamiento esta cerrado. Reabrelo solo si necesitas corregir series.',
        buttonLabel: 'Editar registro',
      };
    }

    if (isHistoricalEditMode) {
      return {
        title: 'Edicion historica',
        subtitle: 'Los cambios se guardan en este log y se cerrara al salir.',
        buttonLabel: null,
      };
    }

    return null;
  }, [isHistoricalEditMode, isReviewMode]);

  const footerConfig = useMemo(() => {
    if (isReviewMode) {
      return {
        label: 'Editar registro',
        iconName: 'create-outline' as const,
        colors: ['#0f766e', '#34d399'] as const,
        iconColor: '#0f766e',
      };
    }

    if (isHistoricalEditMode) {
      return {
        label: 'Guardar cambios y cerrar',
        iconName: 'checkmark-outline' as const,
        colors: ['#0f766e', '#34d399'] as const,
        iconColor: '#0f766e',
      };
    }

    return {
      label: 'Finalizar entrenamiento',
      iconName: 'arrow-forward' as const,
      colors: ['#182f50', '#67b6df'] as const,
      iconColor: theme.isDark ? theme.colors.primary : '#182f50',
    };
  }, [isHistoricalEditMode, isReviewMode, theme.colors.primary, theme.isDark]);

  if (isLoading || !currentWorkout || !workoutTrainingDay) {
    return <LoadingSpinner fullScreen text="Cargando entrenamiento..." />;
  }

  const workoutDate =
    currentWorkout.workout_log.performed_on_date ||
    workoutTrainingDay.date ||
    new Date();
  const weekdayLabel = formatLocalShortWeekday(workoutDate);
  const dayNumberLabel = getLocalDayNumber(workoutDate);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={theme.isDark ? [theme.colors.surface, theme.colors.background] : [colors.white, colors.background]}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle}>{currentWorkout.training_day_name}</Text>
          {currentWorkout.training_day_focus ? (
            <Text style={styles.workoutFocus}>{currentWorkout.training_day_focus}</Text>
          ) : null}
        </View>

        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeDay}>{weekdayLabel}</Text>
          <Text style={styles.dateBadgeNumber}>{dayNumberLabel}</Text>
        </View>
      </LinearGradient>

      {modeBanner ? (
        <View style={styles.modeBanner}>
          <View style={styles.modeBannerCopy}>
            <Text style={styles.modeBannerTitle}>{modeBanner.title}</Text>
            <Text style={styles.modeBannerSubtitle}>{modeBanner.subtitle}</Text>
          </View>
          {modeBanner.buttonLabel ? (
            <TouchableOpacity style={styles.modeBannerButton} onPress={handleReopen}>
              <Text style={styles.modeBannerButtonText}>{modeBanner.buttonLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <FlatList
        data={groupedExercises}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) =>
          item.type === 'separator' ? `separator-${item.data.phase}` : `exercise-${item.data.exercise.id}`
        }
        renderItem={({ item }) => {
          if (item.type === 'separator') {
            const phase = item.data.phase;
            const exercisesInPhase = groupedExercises.filter(
              (entry) => entry.type === 'exercise' && entry.data.exercise.phase === phase,
            );
            const completedCount = exercisesInPhase.filter(
              (entry) => entry.type === 'exercise' && entry.data.progress.is_completed,
            ).length;

            return (
              <PhaseSeparator
                phase={phase}
                isCollapsed={collapsedPhases.has(phase)}
                isCompleted={phaseCompletionStatus[phase]}
                onToggle={() => togglePhaseCollapse(phase)}
                completedCount={completedCount}
                totalCount={exercisesInPhase.length}
              />
            );
          }

          const { exercise, progress, originalIndex, indexInPhase, totalInPhase } = item.data;
          if (collapsedPhases.has(exercise.phase)) {
            return null;
          }

          const isActive = originalIndex === currentExerciseIndex;
          const displaySetNumber = isActive
            ? currentSetNumber
            : getExerciseTargetSetNumber(exercise, progress);
          const defaults = getExerciseDraftValues(exercise, progress, displaySetNumber);

          return (
            <ExerciseCard
              mode={screenMode}
              dayExercise={exercise}
              progress={progress}
              currentSetNumber={displaySetNumber}
              currentReps={isActive ? currentReps : defaults.reps}
              currentWeight={isActive ? currentWeight : defaults.weight}
              currentEffortValue={isActive ? currentEffortValue : defaults.effortValue}
              isActive={isActive}
              exerciseNumber={indexInPhase}
              totalExercises={totalInPhase}
              setInProgress={setsInProgress[originalIndex] || false}
              isSavingSet={isSavingSet}
              onActivateExercise={isReviewMode ? undefined : () => handleActivateExercise(originalIndex)}
              onRepsChange={(delta) => handleRepsChange(delta, originalIndex)}
              onRepsCommit={(value) => handleRepsCommit(value, originalIndex)}
              onWeightChange={(delta) => handleWeightChange(delta, originalIndex)}
              onWeightCommit={(value) => handleWeightCommit(value, originalIndex)}
              onEffortChange={(delta) => handleEffortChange(delta, originalIndex)}
              onAdvanceSet={
                isLiveMode
                  ? () => void handleLiveSetAction(originalIndex, displaySetNumber, exercise.sets)
                  : undefined
              }
              onSaveSet={
                isHistoricalEditMode
                  ? () => void handleHistoricalSaveSet(originalIndex, displaySetNumber)
                  : undefined
              }
              onSelectSet={isReviewMode ? undefined : (setNumber) => handleSelectSet(originalIndex, setNumber)}
              onDeleteSet={
                isHistoricalEditMode ? (setNumber) => handleDeleteSet(originalIndex, setNumber) : undefined
              }
            />
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.finishButtonWrapper} onPress={handlePrimaryFooterAction} activeOpacity={0.82}>
          <LinearGradient
            colors={footerConfig.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.finishButton}
          >
            <Text style={styles.finishButtonTextActive}>{footerConfig.label}</Text>
            <View style={styles.finishArrowActive}>
              <Ionicons
                name={footerConfig.iconName}
                size={16}
                color={footerConfig.iconColor}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <RestTimer
        visible={showRestTimer}
        initialSeconds={restSeconds}
        onComplete={() => setShowRestTimer(false)}
        onSkip={() => setShowRestTimer(false)}
      />

      <WorkoutToast
        visible={toastVisible}
        config={toastConfig}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerCenter: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  workoutTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  workoutFocus: {
    fontSize: fontSize.sm,
    color: theme.colors.textMuted,
  },
  dateBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    transform: [{ rotate: '-5deg' }],
  },
  dateBadgeDay: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '600',
  },
  dateBadgeNumber: {
    fontSize: fontSize.xl,
    color: colors.white,
    fontWeight: '700',
  },
  modeBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modeBannerCopy: {
    flex: 1,
  },
  modeBannerTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  modeBannerSubtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: theme.colors.textMuted,
  },
  modeBannerButton: {
    borderRadius: borderRadius.full,
    backgroundColor: '#0f766e',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modeBannerButtonText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: theme.colors.background,
  },
  finishButtonWrapper: {
    shadowColor: '#182f50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  finishButtonTextActive: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.white,
    marginRight: spacing.sm,
    letterSpacing: 0.4,
  },
  finishArrowActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.isDark ? theme.colors.surface : colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

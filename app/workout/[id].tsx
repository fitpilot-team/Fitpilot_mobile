import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
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
  getCardioEffectiveSets,
  isCardioExercise,
  isEditableEffortType,
  shouldShowStrengthEffort,
} from '../../src/utils/formatters';
import {
  adjustWorkoutMetricValue,
  normalizeWorkoutMetricValue,
} from '../../src/utils/workoutMetricInputs';
import { formatLocalShortWeekday, getLocalDayNumber } from '../../src/utils/date';
import {
  createNextSegmentDraft,
  createWorkoutExerciseDraft,
  DEFAULT_WORKOUT_EXERCISE_DRAFT,
  findNextIncompleteExerciseIndex,
  getDayExerciseByProgress,
  getExerciseDraftValues,
  getSetGroupByNumber,
  getExerciseTargetSetNumber,
  normalizeWorkoutSetDraft,
  toWorkoutSetSegmentInputs,
  validateWorkoutSetDraft,
  type WorkoutExerciseDraft,
  type WorkoutSetSegmentDraft,
} from '../../src/utils/workoutSession';

type ExerciseDraftOverrides = Partial<{
  segments: WorkoutSetSegmentDraft[];
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

type ExerciseCardLayout = {
  y: number;
  height: number;
};

const PHASE_ORDER: Record<ExercisePhase, number> = { warmup: 0, main: 1, cooldown: 2 };

const areExerciseIdListsEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

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
    deleteSetGroup,
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
  const [cardLayouts, setCardLayouts] = useState<Record<string, ExerciseCardLayout>>({});
  const [visibleExerciseIds, setVisibleExerciseIds] = useState<string[]>([]);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollOffsetY, setScrollOffsetY] = useState(0);
  const [autoplayExerciseId, setAutoplayExerciseId] = useState<string | null>(null);
  const loadedWorkoutIdRef = useRef<string | null>(null);
  const syncDraftOptionsRef = useRef<{ exerciseIndex?: number; targetSetNumber?: number } | null>(null);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 45 });

  const currentExerciseIndex = exerciseDraft.currentExerciseIndex;
  const currentSetNumber = exerciseDraft.currentSetNumber;
  const currentSegments = exerciseDraft.currentSegments;
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
    setCardLayouts({});
    setVisibleExerciseIds([]);
    setViewportHeight(0);
    setScrollOffsetY(0);
    setAutoplayExerciseId(null);

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
        segments: isCurrentExercise ? currentSegments : defaults.segments,
        restSeconds: isCurrentExercise ? restSeconds : defaults.restSeconds,
      };
    },
    [
      currentExerciseIndex,
      currentSegments,
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
        currentSegments: normalizeWorkoutSetDraft(
          context.exercise,
          overrides.segments ?? defaults.segments,
        ),
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

    const defaults = getExerciseDraftValues(context.exercise, context.progress, setNumber);
    applyExerciseDraft(
      exerciseIndex,
      { segments: defaults.segments },
      setNumber,
    );
    setSetsInProgress((previous) => ({ ...previous, [exerciseIndex]: false }));
  }, [applyExerciseDraft, getExerciseContext, isReviewMode]);

  const handleDeleteSet = useCallback((exerciseIndex: number, setNumber: number) => {
    if (!currentWorkout || !isHistoricalEditMode) {
      return;
    }

    const progress = currentWorkout.exercises_progress[exerciseIndex];
    const targetSet = getSetGroupByNumber(progress, setNumber);
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

            const didDeleteSet = await deleteSetGroup(targetSet.day_exercise_id, setNumber);
            if (!didDeleteSet) {
              syncDraftOptionsRef.current = null;
            }
          },
        },
      ],
    );
  }, [currentWorkout, deleteSetGroup, isHistoricalEditMode]);

  const updateDraftSegments = useCallback((
    exerciseIndex: number,
    updater: (segments: WorkoutSetSegmentDraft[]) => WorkoutSetSegmentDraft[],
  ) => {
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
      { segments: updater(resolvedDraft.segments) },
      resolvedDraft.targetSetNumber,
    );
  }, [applyExerciseDraft, currentExerciseIndex, currentSetNumber, getResolvedExerciseDraft, isReviewMode]);

  const handleSegmentRepsCommit = useCallback((exerciseIndex: number, segmentIndex: number, nextValue: number) => {
    const normalizedValue = normalizeWorkoutMetricValue('reps', nextValue);
    if (normalizedValue == null) {
      return;
    }

    updateDraftSegments(exerciseIndex, (segments) =>
      segments.map((segment, index) =>
        index === segmentIndex
          ? {
              ...segment,
              reps_completed: normalizedValue,
            }
          : segment,
      ),
    );
  }, [updateDraftSegments]);

  const handleSegmentRepsChange = useCallback((exerciseIndex: number, segmentIndex: number, delta: number) => {
    updateDraftSegments(exerciseIndex, (segments) =>
      segments.map((segment, index) =>
        index === segmentIndex
          ? {
              ...segment,
              reps_completed: adjustWorkoutMetricValue(
                'reps',
                segment.reps_completed,
                delta,
              ) ?? segment.reps_completed,
            }
          : segment,
      ),
    );
  }, [updateDraftSegments]);

  const handleSegmentWeightCommit = useCallback((exerciseIndex: number, segmentIndex: number, nextValue: number) => {
    const normalizedValue = normalizeWorkoutMetricValue('weight', nextValue);
    if (normalizedValue == null) {
      return;
    }

    updateDraftSegments(exerciseIndex, (segments) =>
      segments.map((segment, index) =>
        index === segmentIndex
          ? {
              ...segment,
              weight_kg: normalizedValue,
            }
          : segment,
      ),
    );
  }, [updateDraftSegments]);

  const handleSegmentWeightChange = useCallback((exerciseIndex: number, segmentIndex: number, delta: number) => {
    updateDraftSegments(exerciseIndex, (segments) =>
      segments.map((segment, index) =>
        index === segmentIndex
          ? {
              ...segment,
              weight_kg: adjustWorkoutMetricValue(
                'weight',
                segment.weight_kg ?? 0,
                delta,
              ) ?? segment.weight_kg ?? 0,
            }
          : segment,
      ),
    );
  }, [updateDraftSegments]);

  const handleSegmentEffortCommit = useCallback((exerciseIndex: number, segmentIndex: number, nextValue: number) => {
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

    const normalizedValue = clampEffortValue(nextValue);
    updateDraftSegments(exerciseIndex, (segments) =>
      segments.map((segment, index) =>
        index === segmentIndex
          ? {
              ...segment,
              effort_value: normalizedValue,
            }
          : segment,
      ),
    );
  }, [currentExerciseIndex, currentSetNumber, getResolvedExerciseDraft, updateDraftSegments]);

  const handleSegmentEffortChange = useCallback((exerciseIndex: number, segmentIndex: number, delta: number) => {
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

    updateDraftSegments(exerciseIndex, (segments) =>
      segments.map((segment, index) =>
        index === segmentIndex
          ? {
              ...segment,
              effort_value: adjustWorkoutMetricValue(
                'effort',
                segment.effort_value ?? 0,
                delta,
              ) ?? segment.effort_value ?? 0,
            }
          : segment,
      ),
    );
  }, [currentExerciseIndex, currentSetNumber, getResolvedExerciseDraft, updateDraftSegments]);

  const handleRepsChange = useCallback((delta: number, exerciseIndex: number) => {
    handleSegmentRepsChange(exerciseIndex, 0, delta);
  }, [handleSegmentRepsChange]);

  const handleRepsCommit = useCallback((nextValue: number, exerciseIndex: number) => {
    handleSegmentRepsCommit(exerciseIndex, 0, nextValue);
  }, [handleSegmentRepsCommit]);

  const handleWeightChange = useCallback((delta: number, exerciseIndex: number) => {
    handleSegmentWeightChange(exerciseIndex, 0, delta);
  }, [handleSegmentWeightChange]);

  const handleWeightCommit = useCallback((nextValue: number, exerciseIndex: number) => {
    handleSegmentWeightCommit(exerciseIndex, 0, nextValue);
  }, [handleSegmentWeightCommit]);

  const handleEffortChange = useCallback((delta: number, exerciseIndex: number) => {
    handleSegmentEffortChange(exerciseIndex, 0, delta);
  }, [handleSegmentEffortChange]);

  const handleEffortCommit = useCallback((nextValue: number, exerciseIndex: number) => {
    handleSegmentEffortCommit(exerciseIndex, 0, nextValue);
  }, [handleSegmentEffortCommit]);

  const handleAddSegment = useCallback((exerciseIndex: number) => {
    const resolvedDraft = getResolvedExerciseDraft(
      exerciseIndex,
      exerciseIndex === currentExerciseIndex ? currentSetNumber : undefined,
    );
    if (!resolvedDraft) {
      return;
    }

    applyExerciseDraft(
      exerciseIndex,
      {
        segments: [
          ...resolvedDraft.segments,
          createNextSegmentDraft(resolvedDraft.context.exercise, resolvedDraft.segments),
        ],
      },
      resolvedDraft.targetSetNumber,
    );
  }, [applyExerciseDraft, currentExerciseIndex, currentSetNumber, getResolvedExerciseDraft]);

  const handleRemoveSegment = useCallback((exerciseIndex: number, segmentIndex: number) => {
    const resolvedDraft = getResolvedExerciseDraft(
      exerciseIndex,
      exerciseIndex === currentExerciseIndex ? currentSetNumber : undefined,
    );
    if (!resolvedDraft) {
      return;
    }

    const nextSegments = resolvedDraft.segments.filter((_, index) => index !== segmentIndex);
    const validationMessage = validateWorkoutSetDraft(resolvedDraft.context.exercise, nextSegments);
    if (validationMessage) {
      Alert.alert('Segmentos insuficientes', validationMessage);
      return;
    }

    applyExerciseDraft(
      exerciseIndex,
      { segments: nextSegments },
      resolvedDraft.targetSetNumber,
    );
  }, [applyExerciseDraft, currentExerciseIndex, currentSetNumber, getResolvedExerciseDraft]);

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

      const validationMessage = validateWorkoutSetDraft(
        resolvedDraft.context.exercise,
        resolvedDraft.segments,
      );
      if (validationMessage) {
        Alert.alert('No se pudo guardar la serie', validationMessage);
        return false;
      }

      syncDraftOptionsRef.current = {
        exerciseIndex: options?.nextExerciseIndex ?? exerciseIndex,
        targetSetNumber: options?.nextSetNumber ?? targetSetNumber,
      };

      const didSaveSet = await saveSet({
        dayExerciseId: resolvedDraft.context.progress.day_exercise_id,
        setNumber: targetSetNumber,
        segments: toWorkoutSetSegmentInputs(resolvedDraft.segments),
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
    const maxSets = isCardioExercise(resolvedDraft.context.exercise)
      ? getCardioEffectiveSets(resolvedDraft.context.exercise)
      : resolvedDraft.context.exercise.sets;

    const nextPendingSetNumber = Math.min(
      resolvedDraft.context.progress.completed_sets + 1,
      maxSets,
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
          segments: resolvedDraft.segments,
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

    const nextIncompleteIndex = findNextIncompleteExerciseIndex(
      currentWorkout.exercises_progress,
      exerciseIndex,
    );
    const didSaveSet = await saveResolvedSet(exerciseIndex, setNumber, {
      nextExerciseIndex: setNumber >= totalSets ? nextIncompleteIndex : exerciseIndex,
      nextSetNumber: setNumber >= totalSets ? undefined : Math.min(setNumber + 1, totalSets),
    });

    setSetsInProgress((previous) => ({ ...previous, [exerciseIndex]: false }));

    if (!didSaveSet) {
      return;
    }

    const latestWorkout = useWorkoutStore.getState().currentWorkout;
    const refreshedProgress = latestWorkout?.exercises_progress[exerciseIndex];
    const isExerciseCompleted = refreshedProgress?.is_completed ?? false;

    if (isExerciseCompleted) {
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

  const recalculateAutoplayExercise = useCallback((
    nextVisibleExerciseIds: string[] = visibleExerciseIds,
    nextCardLayouts: Record<string, ExerciseCardLayout> = cardLayouts,
    nextViewportHeight: number = viewportHeight,
    nextScrollOffsetY: number = scrollOffsetY,
  ) => {
    if (!nextVisibleExerciseIds.length || nextViewportHeight <= 0) {
      setAutoplayExerciseId(null);
      return;
    }

    const viewportCenter = nextScrollOffsetY + nextViewportHeight / 2;
    let bestExerciseId: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    nextVisibleExerciseIds.forEach((exerciseId) => {
      const layout = nextCardLayouts[exerciseId];
      if (!layout) {
        return;
      }

      const cardCenter = layout.y + layout.height / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestExerciseId = exerciseId;
      }
    });

    setAutoplayExerciseId((previous) => (previous === bestExerciseId ? previous : bestExerciseId));
  }, [cardLayouts, scrollOffsetY, viewportHeight, visibleExerciseIds]);

  useEffect(() => {
    recalculateAutoplayExercise();
  }, [recalculateAutoplayExercise]);

  useEffect(() => {
    const validExerciseIds = new Set(
      groupedExercises
        .filter((item): item is Extract<ListItem, { type: 'exercise' }> => item.type === 'exercise')
        .map((item) => item.data.exercise.id),
    );

    setVisibleExerciseIds((previous) => {
      const next = previous.filter((exerciseId) => validExerciseIds.has(exerciseId));
      return areExerciseIdListsEqual(previous, next) ? previous : next;
    });
    setAutoplayExerciseId((previous) => (previous && validExerciseIds.has(previous) ? previous : null));
    setCardLayouts((previous) => {
      const nextEntries = Object.entries(previous).filter(([exerciseId]) => validExerciseIds.has(exerciseId));
      if (nextEntries.length === Object.keys(previous).length) {
        return previous;
      }

      return Object.fromEntries(nextEntries);
    });
  }, [groupedExercises]);

  const handleExerciseCardLayout = useCallback((exerciseId: string, y: number, height: number) => {
    setCardLayouts((previous) => {
      const currentLayout = previous[exerciseId];
      if (currentLayout && currentLayout.y === y && currentLayout.height === height) {
        return previous;
      }

      return {
        ...previous,
        [exerciseId]: { y, height },
      };
    });
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextOffset = event.nativeEvent.contentOffset.y;
    setScrollOffsetY((previous) => (Math.abs(previous - nextOffset) < 1 ? previous : nextOffset));
  }, []);

  const handleListLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    setViewportHeight((previous) => (Math.abs(previous - nextHeight) < 1 ? previous : nextHeight));
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<ListItem>[] }) => {
    const nextVisibleExerciseIds = viewableItems.flatMap((viewableItem) =>
      viewableItem.item?.type === 'exercise' ? [viewableItem.item.data.exercise.id] : [],
    );

    setVisibleExerciseIds((previous) =>
      areExerciseIdListsEqual(previous, nextVisibleExerciseIds) ? previous : nextVisibleExerciseIds,
    );
  });

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
        onLayout={handleListLayout}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfigRef.current}
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
          const effectiveSets = isCardioExercise(exercise) ? getCardioEffectiveSets(exercise) : exercise.sets;
          const displaySetNumber = isActive
            ? currentSetNumber
            : getExerciseTargetSetNumber(exercise, progress);
          const defaults = getExerciseDraftValues(exercise, progress, displaySetNumber);
          const displaySegments = isActive ? currentSegments : defaults.segments;
          const primarySegment = displaySegments[0] ?? null;

          return (
            <View
              onLayout={(event) =>
                handleExerciseCardLayout(
                  exercise.id,
                  event.nativeEvent.layout.y,
                  event.nativeEvent.layout.height,
                )
              }
            >
              <ExerciseCard
                mode={screenMode}
                dayExercise={exercise}
                progress={progress}
                currentSetNumber={displaySetNumber}
                currentReps={primarySegment?.reps_completed ?? (isCardioExercise(exercise) ? 1 : exercise.reps_min ?? 12)}
                currentWeight={primarySegment?.weight_kg ?? 0}
                currentEffortValue={primarySegment?.effort_value ?? exercise.effort_value}
                currentSegments={displaySegments}
                isActive={isActive}
                exerciseNumber={indexInPhase}
                totalExercises={totalInPhase}
                setInProgress={setsInProgress[originalIndex] || false}
                isSavingSet={isSavingSet}
                shouldAutoplayPreview={exercise.id === autoplayExerciseId}
                onActivateExercise={isReviewMode ? undefined : () => handleActivateExercise(originalIndex)}
                onRepsChange={(delta) => handleRepsChange(delta, originalIndex)}
                onRepsCommit={(nextValue) => handleRepsCommit(nextValue, originalIndex)}
                onWeightChange={(delta) => handleWeightChange(delta, originalIndex)}
                onWeightCommit={(nextValue) => handleWeightCommit(nextValue, originalIndex)}
                onEffortChange={(delta) => handleEffortChange(delta, originalIndex)}
                onEffortCommit={(nextValue) => handleEffortCommit(nextValue, originalIndex)}
                onSegmentRepsChange={(segmentIndex, delta) => handleSegmentRepsChange(originalIndex, segmentIndex, delta)}
                onSegmentRepsCommit={(segmentIndex, nextValue) => handleSegmentRepsCommit(originalIndex, segmentIndex, nextValue)}
                onSegmentWeightChange={(segmentIndex, delta) => handleSegmentWeightChange(originalIndex, segmentIndex, delta)}
                onSegmentWeightCommit={(segmentIndex, nextValue) => handleSegmentWeightCommit(originalIndex, segmentIndex, nextValue)}
                onSegmentEffortChange={(segmentIndex, delta) => handleSegmentEffortChange(originalIndex, segmentIndex, delta)}
                onSegmentEffortCommit={(segmentIndex, nextValue) => handleSegmentEffortCommit(originalIndex, segmentIndex, nextValue)}
                onAddSegment={() => handleAddSegment(originalIndex)}
                onRemoveSegment={(segmentIndex) => handleRemoveSegment(originalIndex, segmentIndex)}
                onAdvanceSet={
                  isLiveMode
                    ? () => void handleLiveSetAction(originalIndex, displaySetNumber, effectiveSets)
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
            </View>
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

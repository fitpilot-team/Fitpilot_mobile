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
import type { DayExercise, ExercisePhase, ExerciseProgress } from '../../src/types';
import {
  clampEffortValue,
  isCardioExercise,
  isEditableEffortType,
  shouldShowStrengthEffort,
} from '../../src/utils/formatters';
import { formatLocalShortWeekday, getLocalDayNumber } from '../../src/utils/date';

type ExerciseDraftValues = {
  reps: number;
  weight: number;
  effortValue: number | null;
  rest: number;
};

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

export default function WorkoutSessionScreen() {
  const { id: workoutLogId } = useLocalSearchParams<{ id: string }>();
  const {
    currentWorkout,
    isLoading,
    isSavingSet,
    error,
    currentExerciseIndex,
    currentSetNumber,
    currentReps,
    currentWeight,
    currentEffortValue,
    loadWorkoutState,
    reopenWorkout,
    logSet,
    deleteLoggedSet,
    completeWorkout,
    abandonWorkout,
    setCurrentReps,
    setCurrentWeight,
    setCurrentEffortValue,
    setCurrentExerciseIndex,
    setCurrentSetNumber,
    clearError,
  } = useWorkoutStore();

  const workoutTrainingDay = currentWorkout?.training_day ?? null;
  const isWorkoutReadOnly = currentWorkout?.workout_log.status === 'completed';

  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);
  const [collapsedPhases, setCollapsedPhases] = useState<Set<ExercisePhase>>(new Set());
  const [setsInProgress, setSetsInProgress] = useState<Record<number, boolean>>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);
  const skipExerciseDraftSyncRef = useRef(false);

  const showToast = useCallback((config: ToastConfig) => {
    setToastVisible(false);
    setTimeout(() => {
      setToastConfig(config);
      setToastVisible(true);
    }, 50);
  }, []);

  const getExerciseEffortDefault = useCallback((exercise: DayExercise | undefined) => {
    if (!shouldShowStrengthEffort(exercise) || exercise?.effort_value == null) {
      return null;
    }

    if (isEditableEffortType(exercise.effort_type)) {
      return clampEffortValue(exercise.effort_value);
    }

    return exercise.effort_value;
  }, []);

  const getExerciseDefaults = useCallback(
    (
      exercise: DayExercise | undefined,
      progress: ExerciseProgress | undefined,
      targetSetNumber?: number,
    ): ExerciseDraftValues => {
      const selectedSet = targetSetNumber
        ? progress?.sets_data?.find((setLog) => setLog.set_number === targetSetNumber)
        : undefined;
      const lastSet = selectedSet ?? progress?.sets_data?.[progress.sets_data.length - 1];
      const isCardio = isCardioExercise(exercise);

      return {
        reps: lastSet?.reps_completed ?? (isCardio ? 1 : exercise?.reps_min ?? 12),
        weight: isCardio ? 0 : lastSet?.weight_kg ?? 0,
        effortValue: lastSet?.effort_value ?? getExerciseEffortDefault(exercise),
        rest: exercise?.interval_rest_seconds || exercise?.rest_seconds || 90,
      };
    },
    [getExerciseEffortDefault],
  );

  useEffect(() => {
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
    if (!currentWorkout || !workoutTrainingDay) {
      return;
    }

    if (skipExerciseDraftSyncRef.current) {
      skipExerciseDraftSyncRef.current = false;
      return;
    }

    const currentExercise = currentWorkout.exercises_progress[currentExerciseIndex];
    if (!currentExercise) {
      return;
    }

    const dayExercise = workoutTrainingDay.exercises.find(
      (exercise) => exercise.id === currentExercise.day_exercise_id,
    );
    if (!dayExercise) {
      return;
    }

    const defaults = getExerciseDefaults(dayExercise, currentExercise, currentSetNumber);
    setCurrentReps(defaults.reps);
    setCurrentWeight(defaults.weight);
    setCurrentEffortValue(defaults.effortValue);
    setRestSeconds(defaults.rest);
  }, [
    currentExerciseIndex,
    currentSetNumber,
    currentWorkout,
    getExerciseDefaults,
    setCurrentEffortValue,
    setCurrentReps,
    setCurrentWeight,
    workoutTrainingDay,
  ]);

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

      const exercise = workoutTrainingDay.exercises.find(
        (item) => item.id === progress.day_exercise_id,
      );
      if (!exercise) {
        return null;
      }

      return { exercise, progress };
    },
    [currentWorkout, workoutTrainingDay],
  );

  const applyExerciseDraft = useCallback(
    (
      exerciseIndex: number,
      overrides: Partial<ExerciseDraftValues> = {},
      targetSetNumber?: number,
    ) => {
      const context = getExerciseContext(exerciseIndex);
      if (!context) {
        return null;
      }

      const defaults = getExerciseDefaults(context.exercise, context.progress, targetSetNumber);
      const nextDraft = { ...defaults, ...overrides };

      skipExerciseDraftSyncRef.current = exerciseIndex !== currentExerciseIndex;

      if (exerciseIndex !== currentExerciseIndex) {
        setCurrentExerciseIndex(exerciseIndex);
      }

      setCurrentSetNumber(
        targetSetNumber ?? Math.min((context.progress.completed_sets || 0) + 1, context.exercise.sets || 1),
      );
      setCurrentReps(nextDraft.reps);
      setCurrentWeight(nextDraft.weight);
      setCurrentEffortValue(nextDraft.effortValue);
      setRestSeconds(nextDraft.rest);

      return context;
    },
    [
      currentExerciseIndex,
      getExerciseContext,
      getExerciseDefaults,
      setCurrentEffortValue,
      setCurrentExerciseIndex,
      setCurrentSetNumber,
      setCurrentReps,
      setCurrentWeight,
    ],
  );

  const handleActivateExercise = useCallback((exerciseIndex: number) => {
    applyExerciseDraft(exerciseIndex);
  }, [applyExerciseDraft]);

  const handleSelectSet = useCallback((exerciseIndex: number, setNumber: number) => {
    const context = getExerciseContext(exerciseIndex);
    if (!context) {
      return;
    }

    const selectedSet = context.progress.sets_data.find((setLog) => setLog.set_number === setNumber);
    const defaults = getExerciseDefaults(context.exercise, context.progress, setNumber);
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
  }, [applyExerciseDraft, getExerciseContext, getExerciseDefaults]);

  const handleDeleteSet = useCallback((exerciseIndex: number, setNumber: number) => {
    if (!currentWorkout || isWorkoutReadOnly) {
      return;
    }

    const progress = currentWorkout.exercises_progress[exerciseIndex];
    const targetSet = progress?.sets_data.find((setLog) => setLog.set_number === setNumber);
    if (!targetSet) {
      return;
    }

    Alert.alert(
      'Eliminar serie',
      `¿Quieres eliminar la serie ${setNumber}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setCurrentExerciseIndex(exerciseIndex);
            setCurrentSetNumber(Math.max(1, setNumber - 1));
            setSetsInProgress((previous) => ({ ...previous, [exerciseIndex]: false }));
            await deleteLoggedSet(targetSet.id);
          },
        },
      ],
    );
  }, [
    currentWorkout,
    deleteLoggedSet,
    isWorkoutReadOnly,
    setCurrentExerciseIndex,
    setCurrentSetNumber,
  ]);

  const handleRepsChange = useCallback((delta: number, exerciseIndex: number) => {
    const context = getExerciseContext(exerciseIndex);
    if (!context) {
      return;
    }

    const defaults = getExerciseDefaults(context.exercise, context.progress, currentSetNumber);
    const baseReps = exerciseIndex === currentExerciseIndex ? currentReps : defaults.reps;
    applyExerciseDraft(exerciseIndex, { reps: Math.max(1, baseReps + delta) }, currentSetNumber);
  }, [
    applyExerciseDraft,
    currentExerciseIndex,
    currentReps,
    currentSetNumber,
    getExerciseContext,
    getExerciseDefaults,
  ]);

  const handleWeightChange = useCallback((delta: number, exerciseIndex: number) => {
    const context = getExerciseContext(exerciseIndex);
    if (!context) {
      return;
    }

    const defaults = getExerciseDefaults(context.exercise, context.progress, currentSetNumber);
    const baseWeight = exerciseIndex === currentExerciseIndex ? currentWeight : defaults.weight;
    applyExerciseDraft(exerciseIndex, { weight: Math.max(0, baseWeight + delta) }, currentSetNumber);
  }, [
    applyExerciseDraft,
    currentExerciseIndex,
    currentSetNumber,
    currentWeight,
    getExerciseContext,
    getExerciseDefaults,
  ]);

  const handleRepsCommit = useCallback((nextReps: number, exerciseIndex: number) => {
    applyExerciseDraft(
      exerciseIndex,
      { reps: Math.max(1, Math.round(nextReps)) },
      currentSetNumber,
    );
  }, [applyExerciseDraft, currentSetNumber]);

  const handleWeightCommit = useCallback((nextWeight: number, exerciseIndex: number) => {
    applyExerciseDraft(
      exerciseIndex,
      { weight: Math.max(0, nextWeight) },
      currentSetNumber,
    );
  }, [applyExerciseDraft, currentSetNumber]);

  const handleEffortChange = useCallback((delta: number, exerciseIndex: number) => {
    const context = getExerciseContext(exerciseIndex);
    if (
      !context ||
      !shouldShowStrengthEffort(context.exercise) ||
      !isEditableEffortType(context.exercise.effort_type)
    ) {
      return;
    }

    const defaults = getExerciseDefaults(context.exercise, context.progress, currentSetNumber);
    const baseEffort = exerciseIndex === currentExerciseIndex
      ? currentEffortValue ?? defaults.effortValue ?? 0
      : defaults.effortValue ?? 0;

    applyExerciseDraft(
      exerciseIndex,
      { effortValue: clampEffortValue(baseEffort + delta) },
      currentSetNumber,
    );
  }, [
    applyExerciseDraft,
    currentEffortValue,
    currentExerciseIndex,
    currentSetNumber,
    getExerciseContext,
    getExerciseDefaults,
  ]);

  const handleNextSet = useCallback(async (exerciseIndex: number, setNumber: number, totalSets: number) => {
    if (isSavingSet || isWorkoutReadOnly || !currentWorkout || !workoutTrainingDay) {
      return;
    }

    const exerciseProgress = currentWorkout.exercises_progress[exerciseIndex];
    if (!exerciseProgress) {
      return;
    }

    const dayExercise = workoutTrainingDay.exercises.find(
      (exercise) => exercise.id === exerciseProgress.day_exercise_id,
    );
    if (!dayExercise) {
      return;
    }

    if (exerciseIndex !== currentExerciseIndex) {
      setCurrentExerciseIndex(exerciseIndex);
    }

    const setIsInProgress = setsInProgress[exerciseIndex] || false;
    const unitLabel = isCardioExercise(dayExercise) ? 'Bloque' : 'Serie';

    if (!setIsInProgress) {
      setSetsInProgress((previous) => ({ ...previous, [exerciseIndex]: true }));
      showToast({
        message:
          setNumber === 1 && exerciseProgress.completed_sets === 0
            ? '¡Empieza!'
            : `${unitLabel} ${setNumber} en marcha`,
        subtitle: setNumber === 1 && exerciseProgress.completed_sets === 0 ? 'Mantén buena forma' : 'Tú puedes',
        icon: 'flame-outline',
        iconColor: '#F97316',
      });
      return;
    }

    await logSet({
      dayExerciseId: exerciseProgress.day_exercise_id,
      setNumber,
      repsCompleted: isCardioExercise(dayExercise) ? 1 : currentReps,
      weightKg: isCardioExercise(dayExercise) ? undefined : currentWeight > 0 ? currentWeight : undefined,
      effortValue:
        shouldShowStrengthEffort(dayExercise) && isEditableEffortType(dayExercise.effort_type)
          ? currentEffortValue ?? getExerciseDefaults(dayExercise, exerciseProgress, setNumber).effortValue ?? 0
          : undefined,
    });

    setSetsInProgress((previous) => ({ ...previous, [exerciseIndex]: false }));

    if (setNumber >= totalSets) {
      showToast({
        message: '¡Ejercicio completado!',
        subtitle: 'Excelente trabajo',
        icon: 'trophy-outline',
        iconColor: '#3B82F6',
      });

      const nextIndex = exerciseIndex + 1;
      if (nextIndex < currentWorkout.exercises_progress.length) {
        setCurrentExerciseIndex(nextIndex);
        setCurrentSetNumber(1);
      }
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
    currentEffortValue,
    currentExerciseIndex,
    currentReps,
    currentWeight,
    currentWorkout,
    getExerciseDefaults,
    isSavingSet,
    isWorkoutReadOnly,
    logSet,
    setCurrentExerciseIndex,
    setCurrentSetNumber,
    showToast,
    setsInProgress,
    workoutTrainingDay,
  ]);

  const handleReopen = useCallback(async () => {
    await reopenWorkout(workoutLogId);
  }, [reopenWorkout, workoutLogId]);

  const handleFinishWorkout = useCallback(() => {
    if (isWorkoutReadOnly) {
      void handleReopen();
      return;
    }

    Alert.alert(
      'Finalizar entrenamiento',
      '¿Estás seguro de que quieres finalizar el entrenamiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            await completeWorkout();
            router.replace('/(tabs)');
          },
        },
      ],
    );
  }, [completeWorkout, handleReopen, isWorkoutReadOnly]);

  const handleGoBack = useCallback(() => {
    if (isWorkoutReadOnly) {
      router.back();
      return;
    }

    Alert.alert(
      'Salir del entrenamiento',
      '¿Quieres guardar tu progreso y salir, o abandonar el entrenamiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar y salir',
          onPress: () => router.back(),
        },
        {
          text: 'Abandonar',
          style: 'destructive',
          onPress: async () => {
            await abandonWorkout();
            router.replace('/(tabs)');
          },
        },
      ],
    );
  }, [abandonWorkout, isWorkoutReadOnly]);

  const groupedExercises = useMemo((): ListItem[] => {
    if (!currentWorkout || !workoutTrainingDay) {
      return [];
    }

    const exerciseWithProgress = currentWorkout.exercises_progress
      .map((progress, originalIndex) => {
        const exercise = workoutTrainingDay.exercises.find(
          (item) => item.id === progress.day_exercise_id,
        );
        return exercise ? { exercise, progress, originalIndex } : null;
      })
      .filter((item): item is { exercise: DayExercise; progress: ExerciseProgress; originalIndex: number } => item !== null)
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
    const dayExercise = workoutTrainingDay.exercises.find(
      (exercise) => exercise.id === currentExercise?.day_exercise_id,
    );
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
      <LinearGradient colors={[colors.white, colors.background]} style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
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

      {isWorkoutReadOnly ? (
        <View style={styles.readOnlyBanner}>
          <View style={styles.readOnlyCopy}>
            <Text style={styles.readOnlyTitle}>Entrenamiento cerrado</Text>
            <Text style={styles.readOnlySubtitle}>
              Reábrelo para editar o eliminar series ya registradas.
            </Text>
          </View>
          <TouchableOpacity style={styles.readOnlyButton} onPress={handleReopen}>
            <Text style={styles.readOnlyButtonText}>Reabrir</Text>
          </TouchableOpacity>
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
          const displaySetNumber = progress.is_completed
            ? currentSetNumber && isActive
              ? currentSetNumber
              : exercise.sets
            : isActive
              ? currentSetNumber
              : Math.min(progress.completed_sets + 1, exercise.sets);
          const defaults = getExerciseDefaults(exercise, progress, displaySetNumber);

          return (
            <ExerciseCard
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
              readOnly={isWorkoutReadOnly}
              onActivateExercise={() => handleActivateExercise(originalIndex)}
              onRepsChange={(delta) => handleRepsChange(delta, originalIndex)}
              onRepsCommit={(value) => handleRepsCommit(value, originalIndex)}
              onWeightChange={(delta) => handleWeightChange(delta, originalIndex)}
              onWeightCommit={(value) => handleWeightCommit(value, originalIndex)}
              onEffortChange={(delta) => handleEffortChange(delta, originalIndex)}
              onNextSet={() => void handleNextSet(originalIndex, displaySetNumber, exercise.sets)}
              onSelectSet={(setNumber) => handleSelectSet(originalIndex, setNumber)}
              onDeleteSet={(setNumber) => handleDeleteSet(originalIndex, setNumber)}
            />
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.finishButtonWrapper} onPress={handleFinishWorkout} activeOpacity={0.82}>
          <LinearGradient
            colors={isWorkoutReadOnly ? ['#0f766e', '#34d399'] : ['#182f50', '#67b6df']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.finishButton}
          >
            <Text style={styles.finishButtonTextActive}>
              {isWorkoutReadOnly ? 'Reabrir para editar' : 'Finalizar entrenamiento'}
            </Text>
            <View style={styles.finishArrowActive}>
              <Ionicons
                name={isWorkoutReadOnly ? 'create-outline' : 'arrow-forward'}
                size={16}
                color={isWorkoutReadOnly ? '#0f766e' : '#182f50'}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.gray[900],
  },
  workoutFocus: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
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
  readOnlyBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  readOnlyCopy: {
    flex: 1,
  },
  readOnlyTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.gray[900],
  },
  readOnlySubtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  readOnlyButton: {
    borderRadius: borderRadius.full,
    backgroundColor: '#0f766e',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  readOnlyButtonText: {
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

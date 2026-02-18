import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '../../src/store/workoutStore';
import { LoadingSpinner } from '../../src/components/common';
import {
  ExerciseCard,
  RestTimer,
  PhaseSeparator,
} from '../../src/components/workout';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/colors';
import type { DayExercise, ExercisePhase, ExerciseProgress } from '../../src/types';

export default function WorkoutSessionScreen() {
  const { id: workoutLogId } = useLocalSearchParams<{ id: string }>();
  const {
    currentWorkout,
    todayTrainingDay,
    isLoading,
    isSavingSet,
    error,
    currentExerciseIndex,
    currentSetNumber,
    currentReps,
    currentWeight,
    loadWorkoutState,
    logSet,
    completeWorkout,
    abandonWorkout,
    setCurrentReps,
    setCurrentWeight,
    setCurrentExerciseIndex,
    setCurrentSetNumber,
    clearError,
  } = useWorkoutStore();

  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);
  const [collapsedPhases, setCollapsedPhases] = useState<Set<ExercisePhase>>(new Set());
  // Track which exercises have a set in progress (for Iniciar/Finalizar flow)
  const [setsInProgress, setSetsInProgress] = useState<Record<number, boolean>>({});

  const getExerciseDefaults = useCallback(
    (exercise: DayExercise | undefined, progress: ExerciseProgress | undefined) => {
      const lastSet = progress?.sets_data?.[progress.sets_data.length - 1];
      return {
        reps: lastSet?.reps_completed || exercise?.reps_min || 12,
        weight: lastSet?.weight_kg ?? 0,
        rest: exercise?.rest_seconds || 90,
      };
    },
    []
  );

  useEffect(() => {
    if (workoutLogId) {
      loadWorkoutState(workoutLogId);
    }
  }, [workoutLogId]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  // Initialize reps when exercise changes
  useEffect(() => {
    if (currentWorkout && todayTrainingDay) {
      const currentExProgress = currentWorkout.exercises_progress[currentExerciseIndex];
      if (currentExProgress) {
        const dayExercise = todayTrainingDay.exercises.find(
          (e) => e.id === currentExProgress.day_exercise_id
        );
        if (dayExercise) {
          const defaults = getExerciseDefaults(dayExercise, currentExProgress);
          setCurrentReps(defaults.reps);
          setCurrentWeight(defaults.weight);
          setRestSeconds(defaults.rest);
        }
      }
    }
  }, [currentExerciseIndex, currentWorkout, todayTrainingDay, getExerciseDefaults]);

  // Toggle collapse for a phase
  const togglePhaseCollapse = useCallback((phase: ExercisePhase) => {
    setCollapsedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phase)) {
        newSet.delete(phase);
      } else {
        newSet.add(phase);
      }
      return newSet;
    });
  }, []);

  // Handlers para reps/weight que sincronizan el ejercicio activo primero
  const handleRepsChange = useCallback((delta: number, exerciseIdx: number) => {
    if (exerciseIdx !== currentExerciseIndex) {
      setCurrentExerciseIndex(exerciseIdx);
    }
    setCurrentReps(Math.max(1, currentReps + delta));
  }, [currentExerciseIndex, currentReps]);

  const handleWeightChange = useCallback((delta: number, exerciseIdx: number) => {
    if (exerciseIdx !== currentExerciseIndex) {
      setCurrentExerciseIndex(exerciseIdx);
    }
    setCurrentWeight(Math.max(0, currentWeight + delta));
  }, [currentExerciseIndex, currentWeight]);

  const handleNextSet = useCallback(async (exerciseIndex: number, setNumber: number, totalSets: number) => {
    // Guard contra double-clicks mientras se guarda
    if (isSavingSet) return;
    if (!currentWorkout || !todayTrainingDay) return;

    const exerciseProgress = currentWorkout.exercises_progress[exerciseIndex];
    if (!exerciseProgress) return;

    const dayExercise = todayTrainingDay.exercises.find(
      (e) => e.id === exerciseProgress.day_exercise_id
    );
    if (!dayExercise) return;

    // Sincronizar el índice actual si el usuario presionó en otro ejercicio
    if (exerciseIndex !== currentExerciseIndex) {
      setCurrentExerciseIndex(exerciseIndex);
    }

    const isSetInProgress = setsInProgress[exerciseIndex] || false;

    if (!isSetInProgress) {
      // INICIAR serie - solo marcar como en progreso, no guardar aún
      setSetsInProgress(prev => ({ ...prev, [exerciseIndex]: true }));
    } else {
      // FINALIZAR serie - guardar y resetear
      await logSet({
        dayExerciseId: exerciseProgress.day_exercise_id,
        setNumber: setNumber,
        repsCompleted: currentReps,
        weightKg: currentWeight > 0 ? currentWeight : undefined,
      });

      // Marcar serie como NO en progreso
      setSetsInProgress(prev => ({ ...prev, [exerciseIndex]: false }));

      // Check if this was the last set of this exercise
      const wasLastSet = setNumber >= totalSets;

      if (wasLastSet) {
        // Move to next exercise
        const nextIndex = exerciseIndex + 1;
        if (nextIndex < currentWorkout.exercises_progress.length) {
          setCurrentExerciseIndex(nextIndex);
          setCurrentSetNumber(1);
        }
        // No rest timer after last set of an exercise
      } else {
        // Show rest timer - logSet ya actualizó currentSetNumber
        setShowRestTimer(true);
      }
    }
  }, [isSavingSet, currentWorkout, todayTrainingDay, currentExerciseIndex, currentReps, currentWeight, setsInProgress]);

  const handleFinishWorkout = useCallback(async () => {
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
      ]
    );
  }, []);

  const handleGoBack = useCallback(() => {
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
      ]
    );
  }, []);

  // Phase ordering: warmup -> main -> cooldown
  const phaseOrder: Record<ExercisePhase, number> = { warmup: 0, main: 1, cooldown: 2 };

  // Group exercises by phase with separators - MUST be before any early return
  type ListItem =
    | { type: 'separator'; data: { phase: ExercisePhase } }
    | { type: 'exercise'; data: { exercise: DayExercise; progress: ExerciseProgress; originalIndex: number; indexInPhase: number; totalInPhase: number } };

  const groupedExercises = useMemo((): ListItem[] => {
    if (!todayTrainingDay || !currentWorkout) return [];

    // Create pairs of exercise + progress, then sort by phase and order_index
    const exerciseWithProgress = currentWorkout.exercises_progress
      .map((progress, originalIndex) => {
        const exercise = todayTrainingDay.exercises.find(
          (e) => e.id === progress.day_exercise_id
        );
        return exercise ? { exercise, progress, originalIndex } : null;
      })
      .filter((item): item is { exercise: DayExercise; progress: ExerciseProgress; originalIndex: number } => item !== null)
      .sort((a, b) => {
        const phaseCompare = phaseOrder[a.exercise.phase] - phaseOrder[b.exercise.phase];
        if (phaseCompare !== 0) return phaseCompare;
        return a.exercise.order_index - b.exercise.order_index;
      });

    // Count exercises per phase for totals
    const phaseCounts: Record<ExercisePhase, number> = { warmup: 0, main: 0, cooldown: 0 };
    exerciseWithProgress.forEach((item) => {
      phaseCounts[item.exercise.phase]++;
    });

    // Build list with separators and phase indices
    const result: ListItem[] = [];
    let currentPhase: ExercisePhase | null = null;
    const phaseCounters: Record<ExercisePhase, number> = { warmup: 0, main: 0, cooldown: 0 };

    exerciseWithProgress.forEach((item) => {
      if (item.exercise.phase !== currentPhase) {
        currentPhase = item.exercise.phase;
        result.push({ type: 'separator', data: { phase: currentPhase } });
      }

      // Increment counter for this phase
      phaseCounters[item.exercise.phase]++;

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
  }, [todayTrainingDay, currentWorkout]);

  // Calculate phase completion status
  const phaseCompletionStatus = useMemo(() => {
    const status: Record<ExercisePhase, boolean> = {
      warmup: true,
      main: true,
      cooldown: true,
    };

    groupedExercises.forEach(item => {
      if (item.type === 'exercise') {
        const { exercise, progress } = item.data;
        if (!progress.is_completed) {
          status[exercise.phase] = false;
        }
      }
    });

    return status;
  }, [groupedExercises]);

  // Get current exercise's phase for auto-collapse logic
  const currentExercisePhase = useMemo(() => {
    if (!currentWorkout || !todayTrainingDay) return null;
    const currentExProgress = currentWorkout.exercises_progress[currentExerciseIndex];
    if (!currentExProgress) return null;
    const exercise = todayTrainingDay.exercises.find(
      (e) => e.id === currentExProgress.day_exercise_id
    );
    return exercise?.phase || null;
  }, [currentWorkout, todayTrainingDay, currentExerciseIndex]);

  // Auto-collapse completed phases (except the current one)
  useEffect(() => {
    if (!groupedExercises.length) return;

    const newCollapsed = new Set<ExercisePhase>();

    (Object.entries(phaseCompletionStatus) as [ExercisePhase, boolean][]).forEach(([phase, isCompleted]) => {
      // Auto-collapse if completed AND not the current exercise's phase
      if (isCompleted && phase !== currentExercisePhase) {
        newCollapsed.add(phase);
      }
    });

    setCollapsedPhases(newCollapsed);
  }, [phaseCompletionStatus, currentExercisePhase]);

  // Early return AFTER all hooks
  if (isLoading || !currentWorkout) {
    return <LoadingSpinner fullScreen text="Cargando entrenamiento..." />;
  }

  const currentExProgress = currentWorkout.exercises_progress[currentExerciseIndex];
  const dayExercise = todayTrainingDay?.exercises.find(
    (e) => e.id === currentExProgress?.day_exercise_id
  );

  // Get today's date info
  const today = new Date();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle}>{currentWorkout.training_day_name}</Text>
          {currentWorkout.training_day_focus && (
            <Text style={styles.workoutFocus}>{currentWorkout.training_day_focus}</Text>
          )}
        </View>

        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeDay}>{dayNames[today.getDay()]}</Text>
          <Text style={styles.dateBadgeNumber}>{today.getDate()}</Text>
        </View>
      </View>

      {/* Exercise list grouped by phase - No ProgressStepper, show all exercises */}
      <FlatList
        data={groupedExercises}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) =>
          item.type === 'separator'
            ? `sep-${item.data.phase}`
            : `ex-${item.data.exercise.id}`
        }
        renderItem={({ item }) => {
          if (item.type === 'separator') {
            const phase = item.data.phase;
            return (
              <PhaseSeparator
                phase={phase}
                isCollapsed={collapsedPhases.has(phase)}
                isCompleted={phaseCompletionStatus[phase]}
                onToggle={() => togglePhaseCollapse(phase)}
              />
            );
          }

          const { exercise, progress, originalIndex, indexInPhase, totalInPhase } = item.data;

          // If the phase is collapsed, don't render the exercise
          if (collapsedPhases.has(exercise.phase)) {
            return null;
          }

          const isActive = originalIndex === currentExerciseIndex;

          // Calculate the correct set number to display
          let displaySetNumber: number;
          if (progress.is_completed) {
            // Completed: show total sets
            displaySetNumber = exercise.sets;
          } else if (isActive) {
            // Active: show current set from store
            displaySetNumber = currentSetNumber;
          } else {
            // Not started or in progress but not active: show next set to do
            displaySetNumber = Math.min(progress.completed_sets + 1, exercise.sets);
          }

          const defaults = getExerciseDefaults(exercise, progress);

          return (
            <ExerciseCard
              dayExercise={exercise}
              progress={progress}
              currentSetNumber={displaySetNumber}
              currentReps={isActive ? currentReps : defaults.reps}
              currentWeight={isActive ? currentWeight : defaults.weight}
              isActive={isActive}
              exerciseNumber={indexInPhase}
              totalExercises={totalInPhase}
              setInProgress={setsInProgress[originalIndex] || false}
              isSavingSet={isSavingSet}
              onRepsChange={(delta) => handleRepsChange(delta, originalIndex)}
              onWeightChange={(delta) => handleWeightChange(delta, originalIndex)}
              onNextSet={() => handleNextSet(originalIndex, displaySetNumber, exercise.sets)}
            />
          );
        }}
      />

      {/* Footer with finish button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout}>
          <Text style={styles.finishButtonText}>finalizar</Text>
          <View style={styles.finishArrow}>
            <Ionicons name="arrow-forward" size={16} color={colors.primary[600]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Rest Timer */}
      <RestTimer
        visible={showRestTimer}
        initialSeconds={restSeconds}
        onComplete={() => setShowRestTimer(false)}
        onSkip={() => setShowRestTimer(false)}
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
    fontWeight: 'bold',
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
    fontWeight: '500',
  },
  dateBadgeNumber: {
    fontSize: fontSize.xl,
    color: colors.white,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  finishButtonText: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    marginRight: spacing.sm,
  },
  finishArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

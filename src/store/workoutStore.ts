import { create } from 'zustand';
import { trainingClient } from '../services/api';
import type {
  Macrocycle,
  TrainingDay,
  WorkoutLog,
  WeeklyProgress,
  CurrentWorkoutState,
  ExerciseSetLog,
  DayExercise,
  NextWorkoutResponse,
  NextWorkoutReason,
  MissedWorkout,
  AbandonReason,
  ExerciseProgress,
} from '../types';

interface WorkoutState {
  // Data
  activeMacrocycle: Macrocycle | null;
  todayTrainingDay: TrainingDay | null;
  weeklyProgress: WeeklyProgress | null;
  currentWorkout: CurrentWorkoutState | null;
  missedWorkouts: MissedWorkout[];

  // Next Workout (Sistema Secuencial)
  workoutPosition: number | null; // Ej: 5 (de 24)
  workoutTotal: number | null; // Ej: 24
  nextWorkoutReason: NextWorkoutReason | null;
  allCompleted: boolean; // True si completó todo el programa

  // UI State
  isLoading: boolean;
  isStartingWorkout: boolean;
  isSavingSet: boolean;
  isLoadingMissed: boolean;
  error: string | null;

  // Current exercise tracking
  currentExerciseIndex: number;
  currentSetNumber: number;
  currentReps: number;
  currentWeight: number;

  // Actions
  loadDashboardData: () => Promise<void>;
  loadNextWorkout: () => Promise<void>; // Sistema secuencial
  loadTodayWorkout: () => Promise<void>; // Deprecated: usar loadNextWorkout
  loadMissedWorkouts: (daysBack?: number) => Promise<void>;
  startWorkout: (trainingDayId: string) => Promise<string | null>;
  loadWorkoutState: (workoutLogId: string) => Promise<void>;
  logSet: (data: {
    dayExerciseId: string;
    setNumber: number;
    repsCompleted: number;
    weightKg?: number;
  }) => Promise<void>;
  completeWorkout: () => Promise<void>;
  abandonWorkout: (reason?: AbandonReason, notes?: string) => Promise<void>;
  dismissMissedWorkouts: () => void;

  // UI Actions
  setCurrentExerciseIndex: (index: number) => void;
  setCurrentSetNumber: (setNumber: number) => void;
  setCurrentReps: (reps: number) => void;
  setCurrentWeight: (weight: number) => void;
  nextExercise: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => {
  const getExerciseDefaults = (
    dayExercise?: DayExercise,
    progress?: ExerciseProgress
  ) => {
    const lastSet = progress?.sets_data?.[progress.sets_data.length - 1];
    return {
      reps: lastSet?.reps_completed || dayExercise?.reps_min || 12,
      weight: lastSet?.weight_kg ?? 0,
      restSeconds: dayExercise?.rest_seconds || 90,
    };
  };

  const getTodayDateKey = () => new Date().toISOString().split('T')[0];

  const getWeeklyTrainingDayIds = (progress: WeeklyProgress | null): string[] =>
    progress?.days
      ?.map((day) => day.training_day_id)
      .filter((value): value is string => !!value) ?? [];

  const logDashboardDiagnostics = (
    progress: WeeklyProgress | null,
    activeMacrocycleCount: number,
  ) => {
    if (!__DEV__) {
      return;
    }

    console.log('[Workout] dashboard diagnostics', {
      hasWeeklyProgress: !!progress,
      weeklyTrainingDayIds: getWeeklyTrainingDayIds(progress),
      activeMacrocycleCount,
    });
  };

  const logNextWorkoutDiagnostics = (
    nextReason: NextWorkoutReason | null,
    nextTrainingDayId: string | null,
    progress: WeeklyProgress | null,
  ) => {
    if (!__DEV__) {
      return;
    }

    console.log('[Workout] next workout diagnostics', {
      hasWeeklyProgress: !!progress,
      weeklyTrainingDayIds: getWeeklyTrainingDayIds(progress),
      nextReason,
      nextTrainingDayId,
      activeMacrocycleCount: get().activeMacrocycle ? 1 : 0,
    });
  };

  const pickFallbackTrainingDayIdFromWeeklyProgress = (
    progress: WeeklyProgress | null,
  ): string | null => {
    if (!progress?.days?.length) {
      return null;
    }

    const today = getTodayDateKey();
    const candidates = progress.days.filter(
      (day) => day.has_workout && !day.is_rest_day && !!day.training_day_id,
    );

    if (candidates.length === 0) {
      return null;
    }

    const fallbackDay =
      candidates.find(
        (day) =>
          day.date >= today &&
          day.completion_percentage < 100 &&
          !!day.training_day_id,
      ) ||
      candidates.find((day) => day.date >= today && !!day.training_day_id) ||
      candidates.find(
        (day) => day.completion_percentage < 100 && !!day.training_day_id,
      ) ||
      candidates[0];

    return fallbackDay?.training_day_id ?? null;
  };

  const loadFallbackNextWorkoutFromWeeklyProgress = async () => {
    const trainingDayId = pickFallbackTrainingDayIdFromWeeklyProgress(
      get().weeklyProgress,
    );

    if (!trainingDayId) {
      if (__DEV__) {
        console.log('[Workout] next workout fallback unavailable', {
          weeklyTrainingDayIds: getWeeklyTrainingDayIds(get().weeklyProgress),
        });
      }
      return false;
    }

    try {
      const fullDay = await trainingClient.get<TrainingDay>(`/training-days/${trainingDayId}`);

      set({
        todayTrainingDay: fullDay,
        workoutPosition: null,
        workoutTotal: null,
        allCompleted: false,
        nextWorkoutReason: null,
        isLoading: false,
        error: null,
      });

      if (__DEV__) {
        console.log('[Workout] next workout fallback resolved', {
          trainingDayId,
        });
      }

      return true;
    } catch {
      if (__DEV__) {
        console.log('[Workout] next workout fallback failed', {
          trainingDayId,
        });
      }
      return false;
    }
  };

  return {
    // Initial state
    activeMacrocycle: null,
    todayTrainingDay: null,
    weeklyProgress: null,
    currentWorkout: null,
    missedWorkouts: [],
    workoutPosition: null,
    workoutTotal: null,
    allCompleted: false,
    nextWorkoutReason: null,
    isLoading: false,
    isStartingWorkout: false,
    isSavingSet: false,
    isLoadingMissed: false,
    error: null,
    currentExerciseIndex: 0,
    currentSetNumber: 1,
    currentReps: 12,
    currentWeight: 0,

    loadDashboardData: async () => {
      set({ isLoading: true, error: null });

      try {
        // Load weekly progress
        const progress = await trainingClient.get<WeeklyProgress>('/workout-logs/progress/weekly');
        set({ weeklyProgress: progress });

        // Load active macrocycle
        const response = await trainingClient.get<{ total: number; macrocycles: Macrocycle[] }>(
          '/mesocycles?status=active&limit=1'
        );

        set({
          activeMacrocycle: response.macrocycles[0] ?? null,
        });

        logDashboardDiagnostics(progress, response.total);

        set({ isLoading: false });
      } catch (err: any) {
        set({
          weeklyProgress: null,
          activeMacrocycle: null,
          isLoading: false,
          error: err.message || 'Error al cargar datos',
        });
      }
    },

    loadNextWorkout: async () => {
      set({ isLoading: true, error: null });

      try {
        // Usar el nuevo endpoint secuencial
        const response = await trainingClient.get<NextWorkoutResponse>('/workout-logs/next');
        const nextReason =
          (response as NextWorkoutResponse & { reason?: NextWorkoutReason | null }).reason ?? null;
        const resolvedFromFallback = async () => loadFallbackNextWorkoutFromWeeklyProgress();

        logNextWorkoutDiagnostics(
          nextReason,
          response.training_day?.id ?? null,
          get().weeklyProgress,
        );

        if (response.training_day) {
          // Obtener detalles completos del training day con ejercicios
          const fullDay = await trainingClient.get<TrainingDay>(
            `/training-days/${response.training_day.id}`
          );

          set({
            todayTrainingDay: fullDay,
            workoutPosition: response.position,
            workoutTotal: response.total,
            allCompleted: false,
            nextWorkoutReason: null,
            isLoading: false,
          });
        } else if (response.all_completed) {
          // El cliente completó todo el programa
          set({
            todayTrainingDay: null,
            workoutPosition: response.position,
            workoutTotal: response.total,
            allCompleted: true,
            nextWorkoutReason: nextReason ?? 'all_completed',
            isLoading: false,
          });
        } else {
          if (await resolvedFromFallback()) {
            return;
          }
          // No hay programa activo o no hay entrenamientos
          set({
            todayTrainingDay: null,
            workoutPosition: null,
            workoutTotal: null,
            allCompleted: false,
            nextWorkoutReason: nextReason,
            isLoading: false,
          });
        }
      } catch (err: any) {
        if (await loadFallbackNextWorkoutFromWeeklyProgress()) {
          return;
        }

        set({
          nextWorkoutReason: null,
          isLoading: false,
          error: err.message || 'Error al cargar próximo entrenamiento',
        });
      }
    },

    // Deprecated: usar loadNextWorkout en su lugar
    loadTodayWorkout: async () => {
      const { activeMacrocycle } = get();
      if (!activeMacrocycle) return;

      try {
        // Find today's training day from the macrocycle
        const today = new Date().toISOString().split('T')[0];

        for (const mesocycle of activeMacrocycle.mesocycles) {
          for (const microcycle of mesocycle.microcycles) {
            const trainingDay = microcycle.training_days.find(
              (td) => td.date === today && !td.rest_day
            );
            if (trainingDay) {
              // Load full training day with exercises
              const fullDay = await trainingClient.get<TrainingDay>(
                `/training-days/${trainingDay.id}`
              );
              set({ todayTrainingDay: fullDay });
              return;
            }
          }
        }

        set({ todayTrainingDay: null });
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    loadMissedWorkouts: async (daysBack = 14) => {
      set({ isLoadingMissed: true });

      try {
        const response = await trainingClient.get<{ missed_workouts: MissedWorkout[]; total: number }>(
          `/workout-logs/missed?days_back=${daysBack}`
        );

        set({
          missedWorkouts: response.missed_workouts,
          isLoadingMissed: false,
        });
      } catch (err: any) {
        set({
          isLoadingMissed: false,
          // No establecer error global para no bloquear la UI
          missedWorkouts: [],
        });
      }
    },

    startWorkout: async (trainingDayId: string) => {
      set({ isStartingWorkout: true, error: null });

      try {
        const workoutLog = await trainingClient.post<WorkoutLog>('/workout-logs', {
          training_day_id: trainingDayId,
        });

        // Load full workout state
        const state = await trainingClient.get<CurrentWorkoutState>(
          `/workout-logs/${workoutLog.id}/state`
        );

        const firstExercise = state.exercises_progress[0];
        const dayExercise = get().todayTrainingDay?.exercises.find(
          (e) => e.id === firstExercise?.day_exercise_id
        );
        const defaults = getExerciseDefaults(dayExercise, firstExercise);

        set({
          currentWorkout: state,
          isStartingWorkout: false,
          currentExerciseIndex: 0,
          currentSetNumber: (firstExercise?.completed_sets || 0) + 1,
          currentReps: defaults.reps,
          currentWeight: defaults.weight,
        });

        return workoutLog.id;
      } catch (err: any) {
        set({
          isStartingWorkout: false,
          error: err.message || 'Error al iniciar entrenamiento',
        });
        return null;
      }
    },

    loadWorkoutState: async (workoutLogId: string) => {
      set({ isLoading: true, error: null });

      try {
        const state = await trainingClient.get<CurrentWorkoutState>(
          `/workout-logs/${workoutLogId}/state`
        );

        // Find current exercise (first non-completed)
        const currentIndex = state.exercises_progress.findIndex((e) => !e.is_completed);
        const safeIndex = currentIndex >= 0 ? currentIndex : 0;
        const currentExercise = state.exercises_progress[safeIndex];
        const dayExercise = get().todayTrainingDay?.exercises.find(
          (e) => e.id === currentExercise?.day_exercise_id
        );
        const defaults = getExerciseDefaults(dayExercise, currentExercise);

        set({
          currentWorkout: state,
          isLoading: false,
          currentExerciseIndex: safeIndex,
          currentSetNumber: (currentExercise?.completed_sets || 0) + 1,
          currentReps: defaults.reps,
          currentWeight: defaults.weight,
        });
      } catch (err: any) {
        set({
          isLoading: false,
          error: err.message,
        });
      }
    },

    logSet: async (data) => {
      const { currentWorkout } = get();
      if (!currentWorkout) return;

      set({ isSavingSet: true, error: null });

      try {
        await trainingClient.post<ExerciseSetLog>(
          `/workout-logs/${currentWorkout.workout_log.id}/sets`,
          {
            day_exercise_id: data.dayExerciseId,
            set_number: data.setNumber,
            reps_completed: data.repsCompleted,
            weight_kg: data.weightKg,
          }
        );

        // Reload workout state
        const state = await trainingClient.get<CurrentWorkoutState>(
          `/workout-logs/${currentWorkout.workout_log.id}/state`
        );

        // Update current set number and defaults
        const currentExercise = state.exercises_progress[get().currentExerciseIndex];
        const dayExercise = get().todayTrainingDay?.exercises.find(
          (e) => e.id === currentExercise?.day_exercise_id
        );
        const defaults = getExerciseDefaults(dayExercise, currentExercise);
        const nextSetNumber = (currentExercise?.completed_sets || 0) + 1;

        set({
          currentWorkout: state,
          isSavingSet: false,
          currentSetNumber: nextSetNumber,
          currentReps: defaults.reps,
          currentWeight: defaults.weight,
        });
      } catch (err: any) {
        set({
          isSavingSet: false,
          error: err.message,
        });
      }
    },

    completeWorkout: async () => {
      const { currentWorkout } = get();
      if (!currentWorkout) return;

      set({ isLoading: true, error: null });

      try {
        await trainingClient.patch(`/workout-logs/${currentWorkout.workout_log.id}`, {
          status: 'completed',
        });

        set({
          currentWorkout: null,
          isLoading: false,
          currentExerciseIndex: 0,
          currentSetNumber: 1,
          currentReps: 12,
          currentWeight: 0,
        });
      } catch (err: any) {
        set({
          isLoading: false,
          error: err.message,
        });
      }
    },

    abandonWorkout: async (reason?: AbandonReason, notes?: string) => {
      const { currentWorkout } = get();
      if (!currentWorkout) return;

      try {
        await trainingClient.patch(`/workout-logs/${currentWorkout.workout_log.id}`, {
          status: 'abandoned',
          abandon_reason: reason,
          abandon_notes: notes,
        });

        set({
          currentWorkout: null,
          currentExerciseIndex: 0,
          currentSetNumber: 1,
          currentReps: 12,
          currentWeight: 0,
        });
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    dismissMissedWorkouts: () => {
      set({ missedWorkouts: [] });
    },

    setCurrentExerciseIndex: (index) => set({ currentExerciseIndex: index }),
    setCurrentSetNumber: (setNumber) => set({ currentSetNumber: setNumber }),
    setCurrentReps: (reps) => set({ currentReps: reps }),
    setCurrentWeight: (weight) => set({ currentWeight: weight }),

    nextExercise: () => {
      const { currentExerciseIndex, currentWorkout, todayTrainingDay } = get();
      if (!currentWorkout) return;

      const nextIndex = currentExerciseIndex + 1;
      if (nextIndex < currentWorkout.exercises_progress.length) {
        const nextProgress = currentWorkout.exercises_progress[nextIndex];
        const dayExercise = todayTrainingDay?.exercises.find(
          (e) => e.id === nextProgress?.day_exercise_id
        );
        const defaults = getExerciseDefaults(dayExercise, nextProgress);
        set({
          currentExerciseIndex: nextIndex,
          currentSetNumber: (nextProgress?.completed_sets || 0) + 1,
          currentReps: defaults.reps,
          currentWeight: defaults.weight,
        });
      }
    },

    clearError: () => set({ error: null }),

    reset: () =>
      set({
        activeMacrocycle: null,
        todayTrainingDay: null,
        weeklyProgress: null,
        currentWorkout: null,
        missedWorkouts: [],
        workoutPosition: null,
        workoutTotal: null,
        allCompleted: false,
        nextWorkoutReason: null,
        isLoading: false,
        isLoadingMissed: false,
        error: null,
        currentExerciseIndex: 0,
        currentSetNumber: 1,
        currentReps: 12,
        currentWeight: 0,
      }),
  };
});


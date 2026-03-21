import { create } from 'zustand';
import { trainingClient } from '../services/api';
import type {
  AbandonReason,
  CurrentWorkoutState,
  DayExercise,
  ExerciseProgress,
  ExerciseSetLog,
  Macrocycle,
  MicrocycleProgress,
  MissedWorkout,
  NextWorkoutResponse,
  TrainingDay,
  WorkoutLog,
} from '../types';
import {
  clampEffortValue,
  isCardioExercise,
  isEditableEffortType,
  shouldShowStrengthEffort,
} from '../utils/formatters';

interface WorkoutState {
  activeMacrocycle: Macrocycle | null;
  nextPlannedSession: TrainingDay | null;
  microcycleProgress: MicrocycleProgress | null;
  currentWorkout: CurrentWorkoutState | null;
  missedWorkouts: MissedWorkout[];

  workoutPosition: number | null;
  workoutTotal: number | null;
  allCompleted: boolean;

  isLoading: boolean;
  isStartingWorkout: boolean;
  isSavingSet: boolean;
  isLoadingMissed: boolean;
  error: string | null;

  currentExerciseIndex: number;
  currentSetNumber: number;
  currentReps: number;
  currentWeight: number;
  currentEffortValue: number | null;

  loadDashboardData: () => Promise<void>;
  loadNextWorkout: () => Promise<void>;
  loadMissedWorkouts: (daysBack?: number) => Promise<void>;
  startWorkout: (trainingDayId: string) => Promise<string | null>;
  loadWorkoutState: (workoutLogId: string) => Promise<void>;
  reopenWorkout: (workoutLogId?: string) => Promise<void>;
  logSet: (data: {
    dayExerciseId: string;
    setNumber: number;
    repsCompleted: number;
    weightKg?: number;
    effortValue?: number;
  }) => Promise<void>;
  deleteLoggedSet: (setLogId: string) => Promise<void>;
  completeWorkout: () => Promise<void>;
  abandonWorkout: (reason?: AbandonReason, notes?: string) => Promise<void>;
  dismissMissedWorkouts: () => void;

  setCurrentExerciseIndex: (index: number) => void;
  setCurrentSetNumber: (setNumber: number) => void;
  setCurrentReps: (reps: number) => void;
  setCurrentWeight: (weight: number) => void;
  setCurrentEffortValue: (effortValue: number | null) => void;
  nextExercise: () => void;
  clearError: () => void;
  reset: () => void;
}

type ExerciseDefaults = {
  reps: number;
  weight: number;
  effortValue: number | null;
  restSeconds: number;
};

const getExerciseEffortDefault = (dayExercise?: DayExercise): number | null => {
  if (!shouldShowStrengthEffort(dayExercise) || dayExercise?.effort_value == null) {
    return null;
  }

  if (isEditableEffortType(dayExercise.effort_type)) {
    return clampEffortValue(dayExercise.effort_value);
  }

  return dayExercise.effort_value;
};

const getExerciseDefaults = (
  dayExercise?: DayExercise,
  progress?: ExerciseProgress,
  targetSetNumber?: number,
): ExerciseDefaults => {
  const preferredSet = targetSetNumber
    ? progress?.sets_data?.find((setLog) => setLog.set_number === targetSetNumber)
    : undefined;
  const lastSet = preferredSet ?? progress?.sets_data?.[progress.sets_data.length - 1];
  const isCardio = isCardioExercise(dayExercise);

  return {
    reps: lastSet?.reps_completed ?? (isCardio ? 1 : dayExercise?.reps_min ?? 12),
    weight: isCardio ? 0 : lastSet?.weight_kg ?? 0,
    effortValue: lastSet?.effort_value ?? getExerciseEffortDefault(dayExercise),
    restSeconds: dayExercise?.interval_rest_seconds || dayExercise?.rest_seconds || 90,
  };
};

const getDayExerciseByProgress = (
  trainingDay: TrainingDay | null | undefined,
  progress?: ExerciseProgress,
): DayExercise | undefined =>
  trainingDay?.exercises.find((exercise) => exercise.id === progress?.day_exercise_id);

const hydrateWorkoutDraft = (
  workoutState: CurrentWorkoutState,
  exerciseIndex?: number,
  targetSetNumber?: number,
) => {
  const safeIndex = Math.max(
    0,
    Math.min(
      exerciseIndex ?? workoutState.exercises_progress.findIndex((exercise) => !exercise.is_completed),
      Math.max(workoutState.exercises_progress.length - 1, 0),
    ),
  );
  const normalizedIndex = safeIndex < 0 ? 0 : safeIndex;
  const currentExercise = workoutState.exercises_progress[normalizedIndex];
  const dayExercise = getDayExerciseByProgress(workoutState.training_day, currentExercise);
  const defaults = getExerciseDefaults(dayExercise, currentExercise, targetSetNumber);

  return {
    currentExerciseIndex: normalizedIndex,
    currentSetNumber: targetSetNumber ?? Math.min((currentExercise?.completed_sets || 0) + 1, dayExercise?.sets || 1),
    currentReps: defaults.reps,
    currentWeight: defaults.weight,
    currentEffortValue: defaults.effortValue,
  };
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeMacrocycle: null,
  nextPlannedSession: null,
  microcycleProgress: null,
  currentWorkout: null,
  missedWorkouts: [],

  workoutPosition: null,
  workoutTotal: null,
  allCompleted: false,

  isLoading: false,
  isStartingWorkout: false,
  isSavingSet: false,
  isLoadingMissed: false,
  error: null,

  currentExerciseIndex: 0,
  currentSetNumber: 1,
  currentReps: 12,
  currentWeight: 0,
  currentEffortValue: null,

  loadDashboardData: async () => {
    set({ isLoading: true, error: null });

    try {
      const [microcycleProgress, macrocycleResponse] = await Promise.all([
        trainingClient.get<MicrocycleProgress>('/workout-logs/progress/microcycle/current'),
        trainingClient.get<{ total: number; macrocycles: Macrocycle[] }>('/mesocycles?status=active&limit=1'),
      ]);

      set({
        microcycleProgress,
        activeMacrocycle: macrocycleResponse.macrocycles[0] ?? null,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        microcycleProgress: null,
        activeMacrocycle: null,
        isLoading: false,
        error: error.message || 'Error al cargar el dashboard',
      });
    }
  },

  loadNextWorkout: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await trainingClient.get<NextWorkoutResponse>('/workout-logs/next');
      if (response.training_day) {
        const fullDay = await trainingClient.get<TrainingDay>(
          `/training-days/${response.training_day.id}`,
        );

        set({
          nextPlannedSession: fullDay,
          workoutPosition: response.position,
          workoutTotal: response.total,
          allCompleted: false,
          isLoading: false,
        });
        return;
      }

      set({
        nextPlannedSession: null,
        workoutPosition: response.position,
        workoutTotal: response.total,
        allCompleted: response.all_completed,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar la siguiente sesi\u00f3n',
      });
    }
  },

  loadMissedWorkouts: async (daysBack = 14) => {
    set({ isLoadingMissed: true });

    try {
      const response = await trainingClient.get<{ missed_workouts: MissedWorkout[]; total: number }>(
        `/workout-logs/missed?days_back=${daysBack}`,
      );

      set({
        missedWorkouts: response.missed_workouts,
        isLoadingMissed: false,
      });
    } catch {
      set({
        missedWorkouts: [],
        isLoadingMissed: false,
      });
    }
  },

  startWorkout: async (trainingDayId: string) => {
    set({ isStartingWorkout: true, error: null });

    try {
      const workoutLog = await trainingClient.post<WorkoutLog>('/workout-logs', {
        training_day_id: trainingDayId,
      });
      const state = await trainingClient.get<CurrentWorkoutState>(
        `/workout-logs/${workoutLog.id}/state`,
      );
      const draft = hydrateWorkoutDraft(state);

      set({
        currentWorkout: state,
        isStartingWorkout: false,
        ...draft,
      });

      return workoutLog.id;
    } catch (error: any) {
      set({
        isStartingWorkout: false,
        error: error.message || 'Error al abrir la sesi\u00f3n',
      });
      return null;
    }
  },

  loadWorkoutState: async (workoutLogId: string) => {
    set({ isLoading: true, error: null });

    try {
      const state = await trainingClient.get<CurrentWorkoutState>(
        `/workout-logs/${workoutLogId}/state`,
      );
      const draft = hydrateWorkoutDraft(state);

      set({
        currentWorkout: state,
        isLoading: false,
        ...draft,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar la sesi\u00f3n',
      });
    }
  },

  reopenWorkout: async (workoutLogId?: string) => {
    const targetWorkoutLogId = workoutLogId ?? get().currentWorkout?.workout_log.id;
    if (!targetWorkoutLogId) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await trainingClient.post<WorkoutLog>(`/workout-logs/${targetWorkoutLogId}/reopen`);
      const state = await trainingClient.get<CurrentWorkoutState>(
        `/workout-logs/${targetWorkoutLogId}/state`,
      );
      const draft = hydrateWorkoutDraft(state);

      set({
        currentWorkout: state,
        isLoading: false,
        ...draft,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'No fue posible reabrir el entrenamiento',
      });
    }
  },

  logSet: async (data) => {
    const { currentWorkout } = get();
    if (!currentWorkout) {
      return;
    }

    set({ isSavingSet: true, error: null });

    try {
      await trainingClient.post<ExerciseSetLog>(
        `/workout-logs/${currentWorkout.workout_log.id}/sets`,
        {
          day_exercise_id: data.dayExerciseId,
          set_number: data.setNumber,
          reps_completed: data.repsCompleted,
          weight_kg: data.weightKg,
          effort_value: data.effortValue,
        },
      );

      const state = await trainingClient.get<CurrentWorkoutState>(
        `/workout-logs/${currentWorkout.workout_log.id}/state`,
      );
      const currentExercise = state.exercises_progress[get().currentExerciseIndex];
      const dayExercise = getDayExerciseByProgress(state.training_day, currentExercise);
      const defaults = getExerciseDefaults(dayExercise, currentExercise);

      set({
        currentWorkout: state,
        isSavingSet: false,
        currentSetNumber: Math.min(
          (currentExercise?.completed_sets || 0) + 1,
          dayExercise?.sets || 1,
        ),
        currentReps: defaults.reps,
        currentWeight: defaults.weight,
        currentEffortValue: defaults.effortValue,
      });
    } catch (error: any) {
      set({
        isSavingSet: false,
        error: error.message || 'No fue posible guardar la serie',
      });
    }
  },

  deleteLoggedSet: async (setLogId: string) => {
    const { currentWorkout } = get();
    if (!currentWorkout) {
      return;
    }

    set({ isSavingSet: true, error: null });

    try {
      await trainingClient.delete<void>(
        `/workout-logs/${currentWorkout.workout_log.id}/sets/${setLogId}`,
      );

      const state = await trainingClient.get<CurrentWorkoutState>(
        `/workout-logs/${currentWorkout.workout_log.id}/state`,
      );
      const draft = hydrateWorkoutDraft(
        state,
        get().currentExerciseIndex,
        Math.max(1, get().currentSetNumber - 1),
      );

      set({
        currentWorkout: state,
        isSavingSet: false,
        ...draft,
      });
    } catch (error: any) {
      set({
        isSavingSet: false,
        error: error.message || 'No fue posible eliminar la serie',
      });
    }
  },

  completeWorkout: async () => {
    const { currentWorkout } = get();
    if (!currentWorkout) {
      return;
    }

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
        currentEffortValue: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'No fue posible finalizar el entrenamiento',
      });
    }
  },

  abandonWorkout: async (reason?: AbandonReason, notes?: string) => {
    const { currentWorkout } = get();
    if (!currentWorkout) {
      return;
    }

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
        currentEffortValue: null,
      });
    } catch (error: any) {
      set({ error: error.message || 'No fue posible abandonar el entrenamiento' });
    }
  },

  dismissMissedWorkouts: () => {
    set({ missedWorkouts: [] });
  },

  setCurrentExerciseIndex: (index) => set({ currentExerciseIndex: index }),
  setCurrentSetNumber: (setNumber) => set({ currentSetNumber: setNumber }),
  setCurrentReps: (reps) => set({ currentReps: reps }),
  setCurrentWeight: (weight) => set({ currentWeight: weight }),
  setCurrentEffortValue: (effortValue) => set({ currentEffortValue: effortValue }),

  nextExercise: () => {
    const { currentExerciseIndex, currentWorkout } = get();
    if (!currentWorkout) {
      return;
    }

    const nextIndex = currentExerciseIndex + 1;
    if (nextIndex < currentWorkout.exercises_progress.length) {
      const nextProgress = currentWorkout.exercises_progress[nextIndex];
      const dayExercise = getDayExerciseByProgress(currentWorkout.training_day, nextProgress);
      const defaults = getExerciseDefaults(dayExercise, nextProgress);

      set({
        currentExerciseIndex: nextIndex,
        currentSetNumber: Math.min(
          (nextProgress?.completed_sets || 0) + 1,
          dayExercise?.sets || 1,
        ),
        currentReps: defaults.reps,
        currentWeight: defaults.weight,
        currentEffortValue: defaults.effortValue,
      });
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      activeMacrocycle: null,
      nextPlannedSession: null,
      microcycleProgress: null,
      currentWorkout: null,
      missedWorkouts: [],
      workoutPosition: null,
      workoutTotal: null,
      allCompleted: false,
      isLoading: false,
      isStartingWorkout: false,
      isSavingSet: false,
      isLoadingMissed: false,
      error: null,
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      currentReps: 12,
      currentWeight: 0,
      currentEffortValue: null,
    }),
}));

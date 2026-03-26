import { create } from 'zustand';
import { trainingClient } from '../services/api';
import type {
  AbandonReason,
  CurrentWorkoutState,
  ExerciseSetLog,
  Macrocycle,
  MicrocycleProgress,
  MissedWorkout,
  WorkoutLog,
} from '../types';
import {
  removeSetFromWorkoutState,
  reopenWorkoutState,
  upsertSetInWorkoutState,
} from '../utils/workoutSession';

interface WorkoutState {
  activeMacrocycle: Macrocycle | null;
  dashboardWorkoutLogs: WorkoutLog[];
  microcycleProgress: MicrocycleProgress | null;
  currentWorkout: CurrentWorkoutState | null;
  missedWorkouts: MissedWorkout[];
  dashboardDataVersion: number;
  workoutLogsVersion: number;

  isLoading: boolean;
  isStartingWorkout: boolean;
  isSavingSet: boolean;
  isLoadingMissed: boolean;
  error: string | null;

  loadDashboardData: (clientId: string) => Promise<void>;
  loadMissedWorkouts: (daysBack?: number) => Promise<void>;
  startWorkout: (trainingDayId: string) => Promise<string | null>;
  loadWorkoutState: (workoutLogId: string) => Promise<void>;
  reopenWorkout: (workoutLogId?: string) => Promise<boolean>;
  saveSet: (data: {
    dayExerciseId: string;
    setNumber: number;
    repsCompleted: number;
    weightKg?: number;
    effortValue?: number;
  }) => Promise<boolean>;
  deleteLoggedSet: (setLogId: string) => Promise<boolean>;
  closeWorkout: () => Promise<boolean>;
  abandonWorkout: (reason?: AbandonReason, notes?: string) => Promise<boolean>;
  dismissMissedWorkouts: () => void;
  clearError: () => void;
  reset: () => void;
}

const CLOSED_WORKOUT_EDIT_ERROR = 'Workout must be reopened before editing sets';
const CLOSED_WORKOUT_CLIENT_MESSAGE = 'El entrenamiento esta cerrado. Reabrelo para editar.';

const fetchWorkoutState = async (workoutLogId: string) =>
  trainingClient.get<CurrentWorkoutState>(`/workout-logs/${workoutLogId}/state`);

const isClosedWorkoutEditError = (error: { status?: number; message?: string } | null | undefined) =>
  error?.status === 409 &&
  typeof error.message === 'string' &&
  error.message.toLowerCase().includes(CLOSED_WORKOUT_EDIT_ERROR.toLowerCase());

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeMacrocycle: null,
  dashboardWorkoutLogs: [],
  microcycleProgress: null,
  currentWorkout: null,
  missedWorkouts: [],
  dashboardDataVersion: 0,
  workoutLogsVersion: 0,

  isLoading: false,
  isStartingWorkout: false,
  isSavingSet: false,
  isLoadingMissed: false,
  error: null,

  loadDashboardData: async (clientId: string) => {
    set({ isLoading: true, error: null });

    try {
      const [microcycleProgress, macrocycleResponse] = await Promise.all([
        trainingClient.get<MicrocycleProgress>('/workout-logs/progress/microcycle/current'),
        trainingClient.get<{ total: number; macrocycles: Macrocycle[] }>('/mesocycles?status=active&limit=1'),
      ]);
      const activeMacrocycleSummary = macrocycleResponse.macrocycles[0] ?? null;

      if (!activeMacrocycleSummary) {
        set((state) => ({
          microcycleProgress,
          activeMacrocycle: null,
          dashboardWorkoutLogs: [],
          dashboardDataVersion: state.dashboardDataVersion + 1,
          isLoading: false,
        }));
        return;
      }

      const [activeMacrocycle, workoutLogsResponse] = await Promise.all([
        trainingClient.get<Macrocycle>(`/mesocycles/${activeMacrocycleSummary.id}`),
        trainingClient.get<{ total: number; workout_logs: WorkoutLog[] }>(
          `/workout-logs/client/${clientId}?limit=500`,
        ),
      ]);

      set((state) => ({
        microcycleProgress,
        activeMacrocycle,
        dashboardWorkoutLogs: workoutLogsResponse.workout_logs,
        dashboardDataVersion: state.dashboardDataVersion + 1,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        microcycleProgress: null,
        activeMacrocycle: null,
        dashboardWorkoutLogs: [],
        isLoading: false,
        error: error.message || 'Error al cargar el dashboard',
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
      const state = await fetchWorkoutState(workoutLog.id);

      set((previousState) => ({
        currentWorkout: state,
        isStartingWorkout: false,
        workoutLogsVersion: previousState.workoutLogsVersion + 1,
      }));

      return workoutLog.id;
    } catch (error: any) {
      set({
        isStartingWorkout: false,
        error: error.message || 'Error al abrir la sesion',
      });
      return null;
    }
  },

  loadWorkoutState: async (workoutLogId: string) => {
    set({ isLoading: true, error: null });

    try {
      const state = await fetchWorkoutState(workoutLogId);

      set({
        currentWorkout: state,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar la sesion',
      });
    }
  },

  reopenWorkout: async (workoutLogId?: string) => {
    const targetWorkoutLogId = workoutLogId ?? get().currentWorkout?.workout_log.id;
    if (!targetWorkoutLogId) {
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      await trainingClient.post<WorkoutLog>(`/workout-logs/${targetWorkoutLogId}/reopen`);

      set((state) => {
        const currentWorkout =
          state.currentWorkout?.workout_log.id === targetWorkoutLogId && state.currentWorkout
            ? reopenWorkoutState(state.currentWorkout)
            : state.currentWorkout;

        return {
          currentWorkout,
          isLoading: false,
          workoutLogsVersion: state.workoutLogsVersion + 1,
        };
      });

      if (get().currentWorkout?.workout_log.id !== targetWorkoutLogId) {
        const state = await fetchWorkoutState(targetWorkoutLogId);
        set({ currentWorkout: state });
      }

      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'No fue posible reabrir el entrenamiento',
      });
      return false;
    }
  },

  saveSet: async (data) => {
    const { currentWorkout } = get();
    if (!currentWorkout) {
      return false;
    }

    set({ isSavingSet: true, error: null });

    try {
      const savedSetLog = await trainingClient.post<ExerciseSetLog>(
        `/workout-logs/${currentWorkout.workout_log.id}/sets`,
        {
          day_exercise_id: data.dayExerciseId,
          set_number: data.setNumber,
          reps_completed: data.repsCompleted,
          weight_kg: data.weightKg,
          effort_value: data.effortValue,
        },
      );

      set((state) => ({
        currentWorkout: state.currentWorkout
          ? upsertSetInWorkoutState(state.currentWorkout, savedSetLog)
          : state.currentWorkout,
        isSavingSet: false,
        workoutLogsVersion: state.workoutLogsVersion + 1,
      }));

      return true;
    } catch (error: any) {
      if (isClosedWorkoutEditError(error)) {
        try {
          const state = await fetchWorkoutState(currentWorkout.workout_log.id);

          set({
            currentWorkout: state,
            isSavingSet: false,
            error: CLOSED_WORKOUT_CLIENT_MESSAGE,
          });
        } catch {
          set({
            isSavingSet: false,
            error: CLOSED_WORKOUT_CLIENT_MESSAGE,
          });
        }

        return false;
      }

      set({
        isSavingSet: false,
        error: error.message || 'No fue posible guardar la serie',
      });

      return false;
    }
  },

  deleteLoggedSet: async (setLogId: string) => {
    const { currentWorkout } = get();
    if (!currentWorkout) {
      return false;
    }

    set({ isSavingSet: true, error: null });

    try {
      await trainingClient.delete<void>(
        `/workout-logs/${currentWorkout.workout_log.id}/sets/${setLogId}`,
      );

      set((state) => ({
        currentWorkout: state.currentWorkout
          ? removeSetFromWorkoutState(state.currentWorkout, setLogId)
          : state.currentWorkout,
        isSavingSet: false,
        workoutLogsVersion: state.workoutLogsVersion + 1,
      }));

      return true;
    } catch (error: any) {
      if (isClosedWorkoutEditError(error)) {
        try {
          const state = await fetchWorkoutState(currentWorkout.workout_log.id);

          set({
            currentWorkout: state,
            isSavingSet: false,
            error: CLOSED_WORKOUT_CLIENT_MESSAGE,
          });
        } catch {
          set({
            isSavingSet: false,
            error: CLOSED_WORKOUT_CLIENT_MESSAGE,
          });
        }

        return false;
      }

      set({
        isSavingSet: false,
        error: error.message || 'No fue posible eliminar la serie',
      });

      return false;
    }
  },

  closeWorkout: async () => {
    const { currentWorkout } = get();
    if (!currentWorkout) {
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      await trainingClient.patch(`/workout-logs/${currentWorkout.workout_log.id}`, {
        status: 'completed',
      });

      set((state) => ({
        currentWorkout: null,
        isLoading: false,
        workoutLogsVersion: state.workoutLogsVersion + 1,
      }));

      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'No fue posible finalizar el entrenamiento',
      });
      return false;
    }
  },

  abandonWorkout: async (reason?: AbandonReason, notes?: string) => {
    const { currentWorkout } = get();
    if (!currentWorkout) {
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      await trainingClient.patch(`/workout-logs/${currentWorkout.workout_log.id}`, {
        status: 'abandoned',
        abandon_reason: reason,
        abandon_notes: notes,
      });

      set((state) => ({
        currentWorkout: null,
        isLoading: false,
        workoutLogsVersion: state.workoutLogsVersion + 1,
      }));

      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'No fue posible abandonar el entrenamiento',
      });
      return false;
    }
  },

  dismissMissedWorkouts: () => {
    set({ missedWorkouts: [] });
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      activeMacrocycle: null,
      dashboardWorkoutLogs: [],
      microcycleProgress: null,
      currentWorkout: null,
      missedWorkouts: [],
      dashboardDataVersion: 0,
      workoutLogsVersion: 0,
      isLoading: false,
      isStartingWorkout: false,
      isSavingSet: false,
      isLoadingMissed: false,
      error: null,
    }),
}));

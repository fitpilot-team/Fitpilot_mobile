import { trainingClient } from './api';
import type {
  ExerciseTrendDetail,
  WorkoutAnalyticsDashboard,
  WorkoutAnalyticsHistoryPage,
  WorkoutAnalyticsHistoryStatusFilter,
  WorkoutAnalyticsModules,
  WorkoutAnalyticsPreferences,
  WorkoutAnalyticsRange,
  WorkoutAnalyticsScopeKind,
} from '../types';

export const getWorkoutAnalyticsDashboard = (
  range: WorkoutAnalyticsRange,
  anchorDate?: string,
) =>
  trainingClient.get<WorkoutAnalyticsDashboard>('/workout-analytics/me/dashboard', {
    params: {
      range,
      ...(anchorDate ? { anchor_date: anchorDate } : {}),
    },
  });

export const getWorkoutAnalyticsModules = ({
  scopeKind,
  range,
  anchorDate,
  macrocycleId,
  mesocycleId,
  microcycleId,
}: {
  scopeKind: WorkoutAnalyticsScopeKind;
  range: WorkoutAnalyticsRange;
  anchorDate?: string;
  macrocycleId?: string | null;
  mesocycleId?: string | null;
  microcycleId?: string | null;
}) =>
  trainingClient.get<WorkoutAnalyticsModules>('/workout-analytics/me/modules', {
    params: {
      scope_kind: scopeKind,
      ...(scopeKind === 'range' ? { range } : {}),
      ...(anchorDate ? { anchor_date: anchorDate } : {}),
      ...(macrocycleId ? { macrocycle_id: macrocycleId } : {}),
      ...(mesocycleId ? { mesocycle_id: mesocycleId } : {}),
      ...(microcycleId ? { microcycle_id: microcycleId } : {}),
    },
  });

export const getWorkoutAnalyticsExerciseDetail = (
  exerciseId: string,
  range: WorkoutAnalyticsRange,
  anchorDate?: string,
  options?: {
    scopeKind?: WorkoutAnalyticsScopeKind;
    macrocycleId?: string | null;
    mesocycleId?: string | null;
    microcycleId?: string | null;
  },
) =>
  trainingClient.get<ExerciseTrendDetail>(`/workout-analytics/me/exercises/${exerciseId}`, {
    params: {
      range,
      scope_kind: options?.scopeKind ?? 'range',
      ...(anchorDate ? { anchor_date: anchorDate } : {}),
      ...(options?.macrocycleId ? { macrocycle_id: options.macrocycleId } : {}),
      ...(options?.mesocycleId ? { mesocycle_id: options.mesocycleId } : {}),
      ...(options?.microcycleId ? { microcycle_id: options.microcycleId } : {}),
    },
  });

export const getWorkoutAnalyticsPreferences = () =>
  trainingClient.get<WorkoutAnalyticsPreferences>('/workout-analytics/me/preferences');

export const getWorkoutAnalyticsHistory = ({
  scopeKind = 'range',
  range,
  status,
  skip = 0,
  limit = 20,
  anchorDate,
  macrocycleId,
  mesocycleId,
  microcycleId,
}: {
  scopeKind?: WorkoutAnalyticsScopeKind;
  range: WorkoutAnalyticsRange;
  status: WorkoutAnalyticsHistoryStatusFilter;
  skip?: number;
  limit?: number;
  anchorDate?: string;
  macrocycleId?: string | null;
  mesocycleId?: string | null;
  microcycleId?: string | null;
}) =>
  trainingClient.get<WorkoutAnalyticsHistoryPage>('/workout-analytics/me/history', {
    params: {
      scope_kind: scopeKind,
      range,
      status,
      skip,
      limit,
      ...(anchorDate ? { anchor_date: anchorDate } : {}),
      ...(macrocycleId ? { macrocycle_id: macrocycleId } : {}),
      ...(mesocycleId ? { mesocycle_id: mesocycleId } : {}),
      ...(microcycleId ? { microcycle_id: microcycleId } : {}),
    },
  });

export const updateWorkoutAnalyticsPreferences = (preferences: WorkoutAnalyticsPreferences) =>
  trainingClient.put<WorkoutAnalyticsPreferences>(
    '/workout-analytics/me/preferences',
    preferences,
  );

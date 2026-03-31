import { trainingClient } from './api';
import type {
  ExerciseTrendDetail,
  WorkoutAnalyticsDashboard,
  WorkoutAnalyticsHistoryPage,
  WorkoutAnalyticsHistoryStatusFilter,
  WorkoutAnalyticsPreferences,
  WorkoutAnalyticsRange,
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

export const getWorkoutAnalyticsExerciseDetail = (
  exerciseId: string,
  range: WorkoutAnalyticsRange,
  anchorDate?: string,
) =>
  trainingClient.get<ExerciseTrendDetail>(`/workout-analytics/me/exercises/${exerciseId}`, {
    params: {
      range,
      ...(anchorDate ? { anchor_date: anchorDate } : {}),
    },
  });

export const getWorkoutAnalyticsPreferences = () =>
  trainingClient.get<WorkoutAnalyticsPreferences>('/workout-analytics/me/preferences');

export const getWorkoutAnalyticsHistory = ({
  range,
  status,
  skip = 0,
  limit = 20,
  anchorDate,
}: {
  range: WorkoutAnalyticsRange;
  status: WorkoutAnalyticsHistoryStatusFilter;
  skip?: number;
  limit?: number;
  anchorDate?: string;
}) =>
  trainingClient.get<WorkoutAnalyticsHistoryPage>('/workout-analytics/me/history', {
    params: {
      range,
      status,
      skip,
      limit,
      ...(anchorDate ? { anchor_date: anchorDate } : {}),
    },
  });

export const updateWorkoutAnalyticsPreferences = (preferences: WorkoutAnalyticsPreferences) =>
  trainingClient.put<WorkoutAnalyticsPreferences>(
    '/workout-analytics/me/preferences',
    preferences,
  );

import { trainingClient } from './api';
import type {
  ExerciseTrendDetail,
  WorkoutAnalyticsDashboard,
  WorkoutAnalyticsHistoryPage,
  WorkoutAnalyticsHistoryStatusFilter,
  WorkoutAnalyticsPreferences,
  WorkoutAnalyticsRange,
} from '../types';

export const getWorkoutAnalyticsDashboard = (range: WorkoutAnalyticsRange) =>
  trainingClient.get<WorkoutAnalyticsDashboard>(`/workout-analytics/me/dashboard?range=${range}`);

export const getWorkoutAnalyticsExerciseDetail = (
  exerciseId: string,
  range: WorkoutAnalyticsRange,
) =>
  trainingClient.get<ExerciseTrendDetail>(
    `/workout-analytics/me/exercises/${exerciseId}?range=${range}`,
  );

export const getWorkoutAnalyticsPreferences = () =>
  trainingClient.get<WorkoutAnalyticsPreferences>('/workout-analytics/me/preferences');

export const getWorkoutAnalyticsHistory = ({
  range,
  status,
  skip = 0,
  limit = 20,
}: {
  range: WorkoutAnalyticsRange;
  status: WorkoutAnalyticsHistoryStatusFilter;
  skip?: number;
  limit?: number;
}) =>
  trainingClient.get<WorkoutAnalyticsHistoryPage>(
    `/workout-analytics/me/history?range=${range}&status=${status}&skip=${skip}&limit=${limit}`,
  );

export const updateWorkoutAnalyticsPreferences = (preferences: WorkoutAnalyticsPreferences) =>
  trainingClient.put<WorkoutAnalyticsPreferences>(
    '/workout-analytics/me/preferences',
    preferences,
  );

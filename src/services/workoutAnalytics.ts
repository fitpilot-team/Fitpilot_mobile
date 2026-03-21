import { trainingClient } from './api';
import type {
  ExerciseTrendDetail,
  WorkoutAnalyticsDashboard,
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

export const updateWorkoutAnalyticsPreferences = (preferences: WorkoutAnalyticsPreferences) =>
  trainingClient.put<WorkoutAnalyticsPreferences>(
    '/workout-analytics/me/preferences',
    preferences,
  );

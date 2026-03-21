import type { WorkoutAnalyticsColorToken, WorkoutAnalyticsRange } from '../types';
import { brandColors, colors } from './colors';

export const DEFAULT_WORKOUT_ANALYTICS_RANGE: WorkoutAnalyticsRange = '12w';

export const WORKOUT_ANALYTICS_RANGE_OPTIONS: Array<{
  value: WorkoutAnalyticsRange;
  label: string;
}> = [
  { value: '4w', label: '4 sem' },
  { value: '8w', label: '8 sem' },
  { value: '12w', label: '12 sem' },
  { value: '24w', label: '24 sem' },
  { value: 'all', label: 'Todo' },
];

export const WORKOUT_ANALYTICS_COLOR_MAP: Record<WorkoutAnalyticsColorToken, string> = {
  navy: brandColors.navy,
  sky: brandColors.sky,
  emerald: colors.success,
  amber: colors.warning,
  rose: '#E96A7C',
  violet: '#7C5CFC',
};

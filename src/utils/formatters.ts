import type { DayExercise, EffortType } from '../types';

/**
 * Format seconds to MM:SS string
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins} min` : `${hours}h`;
}

/**
 * Get exercise name in user's preferred language
 */
export function getExerciseName(
  exercise: { name_es?: string | null; name_en: string },
  language: 'es' | 'en' = 'es'
): string {
  if (language === 'es' && exercise.name_es) {
    return exercise.name_es;
  }
  return exercise.name_en;
}

/**
 * Format weight with unit
 */
export function formatWeight(kg: number): string {
  return `${kg} kg`;
}

/**
 * Get day name in Spanish
 */
export function getDayNameEs(dayIndex: number): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mier', 'Jue', 'Vie', 'Sab'];
  return days[dayIndex % 7];
}

/**
 * Calculate workout completion percentage
 */
export function calculateCompletionPercentage(
  completedSets: number,
  totalSets: number
): number {
  if (totalSets === 0) return 0;
  return Math.round((completedSets / totalSets) * 100);
}

function formatCompactNumber(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(/\.0$/, '');
}

export function formatDurationSeconds(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} s`;
  }

  if (seconds % 60 === 0) {
    return formatDuration(seconds / 60);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')} min`;
}

export function formatDistanceMeters(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    const km = distanceMeters / 1000;
    return `${formatCompactNumber(km)} km`;
  }

  return `${formatCompactNumber(distanceMeters)} m`;
}

export function isEditableEffortType(effortType: EffortType): boolean {
  return effortType === 'RIR' || effortType === 'RPE';
}

export function clampEffortValue(value: number): number {
  return Math.min(10, Math.max(0, Math.round(value * 2) / 2));
}

export function formatEffortValue(
  effortType: EffortType,
  effortValue: number | null | undefined,
): string {
  if (effortValue == null || Number.isNaN(effortValue)) {
    return effortType === 'percentage' ? '--%' : `${effortType} --`;
  }

  const formattedValue = formatCompactNumber(effortValue);
  return effortType === 'percentage'
    ? `${formattedValue}%`
    : `${effortType} ${formattedValue}`;
}

export function formatZoneLabel(zone: number | null | undefined): string | null {
  if (zone == null || Number.isNaN(zone)) {
    return null;
  }

  return `Z${zone}`;
}

export function isCardioExercise(dayExercise: Partial<DayExercise> | null | undefined): boolean {
  if (!dayExercise) {
    return false;
  }

  return (
    dayExercise.exercise?.exercise_class === 'cardio' ||
    !!dayExercise.exercise?.cardio_subclass ||
    dayExercise.duration_seconds != null ||
    dayExercise.intensity_zone != null ||
    dayExercise.distance_meters != null ||
    dayExercise.target_calories != null ||
    dayExercise.intervals != null ||
    dayExercise.work_seconds != null ||
    dayExercise.interval_rest_seconds != null
  );
}

export function shouldShowStrengthEffort(
  dayExercise: Partial<DayExercise> | null | undefined,
): boolean {
  return !!dayExercise && !isCardioExercise(dayExercise);
}

export function getCardioSummaryLabel(
  dayExercise: Partial<DayExercise> | null | undefined,
): string {
  if (!dayExercise) {
    return 'Cardio';
  }

  const primaryParts: string[] = [];

  if (dayExercise.duration_seconds != null) {
    primaryParts.push(formatDurationSeconds(dayExercise.duration_seconds));
  } else if (dayExercise.intervals && dayExercise.work_seconds) {
    const restLabel = dayExercise.interval_rest_seconds
      ? `/${formatDurationSeconds(dayExercise.interval_rest_seconds)}`
      : '';
    primaryParts.push(
      `${dayExercise.intervals} x ${formatDurationSeconds(dayExercise.work_seconds)}${restLabel}`,
    );
  } else if (dayExercise.distance_meters != null) {
    primaryParts.push(formatDistanceMeters(dayExercise.distance_meters));
  } else if (dayExercise.target_calories != null) {
    primaryParts.push(`${formatCompactNumber(dayExercise.target_calories)} cal`);
  }

  const zoneLabel = formatZoneLabel(
    dayExercise.intensity_zone ?? dayExercise.exercise?.intensity_zone,
  );
  if (zoneLabel) {
    primaryParts.push(zoneLabel);
  }

  if (!primaryParts.length && dayExercise.exercise?.cardio_subclass) {
    return dayExercise.exercise.cardio_subclass.toUpperCase();
  }

  return primaryParts.slice(0, 2).join(' / ') || 'Cardio';
}

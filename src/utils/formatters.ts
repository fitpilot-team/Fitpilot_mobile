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

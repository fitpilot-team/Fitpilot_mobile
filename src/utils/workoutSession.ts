import { getWorkoutSetTypeDefinition, validateSegmentedWeightFlow } from '../constants/workoutSetTypes';
import type {
  CurrentWorkoutState,
  DayExercise,
  ExerciseProgress,
  TrainingDay,
  WorkoutSetGroup,
  WorkoutSetSegmentInput,
} from '../types';
import {
  clampEffortValue,
  getCardioEffectiveSets,
  isCardioExercise,
  isEditableEffortType,
  shouldShowStrengthEffort,
} from './formatters';

export type WorkoutSetSegmentDraft = {
  segment_index: number;
  reps_completed: number;
  weight_kg: number;
  effort_value: number | null;
};

export type WorkoutExerciseDraft = {
  currentExerciseIndex: number;
  currentSetNumber: number;
  currentSegments: WorkoutSetSegmentDraft[];
  restSeconds: number;
};

type ExerciseDraftValues = {
  segments: WorkoutSetSegmentDraft[];
  restSeconds: number;
};

const DEFAULT_SEGMENT_DRAFT: WorkoutSetSegmentDraft = {
  segment_index: 1,
  reps_completed: 12,
  weight_kg: 0,
  effort_value: null,
};

export const DEFAULT_WORKOUT_EXERCISE_DRAFT: WorkoutExerciseDraft = {
  currentExerciseIndex: 0,
  currentSetNumber: 1,
  currentSegments: [DEFAULT_SEGMENT_DRAFT],
  restSeconds: 90,
};

export const getExerciseEffortDefault = (dayExercise?: DayExercise): number | null => {
  if (!shouldShowStrengthEffort(dayExercise) || dayExercise?.effort_value == null) {
    return null;
  }

  if (isEditableEffortType(dayExercise.effort_type)) {
    return clampEffortValue(dayExercise.effort_value);
  }

  return dayExercise.effort_value;
};

export const getDayExerciseByProgress = (
  trainingDay: TrainingDay | null | undefined,
  progress?: ExerciseProgress,
): DayExercise | undefined =>
  trainingDay?.exercises.find((exercise) => exercise.id === progress?.day_exercise_id);

export const getExerciseTargetSetNumber = (
  dayExercise?: DayExercise,
  _progress?: ExerciseProgress,
  targetSetNumber?: number,
) => {
  const maxSets = dayExercise && isCardioExercise(dayExercise)
    ? getCardioEffectiveSets(dayExercise)
    : (dayExercise?.sets || 1);
  if (targetSetNumber != null) {
    return Math.max(1, Math.min(targetSetNumber, maxSets));
  }

  return 1;
};

const cloneSegmentDraft = (segment: WorkoutSetSegmentDraft, segmentIndex: number): WorkoutSetSegmentDraft => ({
  segment_index: segmentIndex,
  reps_completed: segment.reps_completed,
  weight_kg: segment.weight_kg,
  effort_value: segment.effort_value,
});

const buildBaseSegmentDraft = (
  dayExercise?: DayExercise,
  sourceSegment?: {
    reps_completed?: number | null;
    weight_kg?: number | null;
    effort_value?: number | null;
  } | null,
): WorkoutSetSegmentDraft => {
  const isCardio = isCardioExercise(dayExercise);
  return {
    segment_index: 1,
    reps_completed: sourceSegment?.reps_completed ?? (isCardio ? 1 : dayExercise?.reps_min ?? 12),
    weight_kg: isCardio ? 0 : sourceSegment?.weight_kg ?? 0,
    effort_value: sourceSegment?.effort_value ?? getExerciseEffortDefault(dayExercise),
  };
};

const normalizeSegmentDrafts = (
  dayExercise: DayExercise | undefined,
  sourceSegments?: readonly {
    segment_index?: number | null;
    reps_completed?: number | null;
    weight_kg?: number | null;
    effort_value?: number | null;
  }[] | null,
): WorkoutSetSegmentDraft[] => {
  const { captureMode, minimumSegments } = getWorkoutSetTypeDefinition(dayExercise?.set_type);
  let normalizedSegments = (sourceSegments ?? [])
    .slice()
    .sort((left, right) => (left.segment_index ?? 1) - (right.segment_index ?? 1))
    .map((segment, index) => ({
      segment_index: index + 1,
      reps_completed: segment.reps_completed ?? (dayExercise?.reps_min ?? 12),
      weight_kg: isCardioExercise(dayExercise) ? 0 : segment.weight_kg ?? 0,
      effort_value: segment.effort_value ?? getExerciseEffortDefault(dayExercise),
    }));

  if (!normalizedSegments.length) {
    normalizedSegments = [buildBaseSegmentDraft(dayExercise)];
  }

  if (captureMode === 'single') {
    return [cloneSegmentDraft(normalizedSegments[0], 1)];
  }

  while (normalizedSegments.length < minimumSegments) {
    normalizedSegments.push(
      cloneSegmentDraft(
        normalizedSegments[normalizedSegments.length - 1] ?? buildBaseSegmentDraft(dayExercise),
        normalizedSegments.length + 1,
      ),
    );
  }

  return normalizedSegments.map((segment, index) => cloneSegmentDraft(segment, index + 1));
};

export const getExerciseDraftValues = (
  dayExercise?: DayExercise,
  progress?: ExerciseProgress,
  targetSetNumber?: number,
): ExerciseDraftValues => {
  const preferredSet = targetSetNumber
    ? progress?.sets_data?.find((setGroup) => setGroup.set_number === targetSetNumber)
    : undefined;
  const templateSegments = preferredSet?.segments ?? null;

  return {
    segments: normalizeSegmentDrafts(dayExercise, templateSegments),
    restSeconds: dayExercise?.interval_rest_seconds || dayExercise?.rest_seconds || 90,
  };
};

export const createWorkoutExerciseDraft = (
  workoutState: CurrentWorkoutState,
  options?: { exerciseIndex?: number; targetSetNumber?: number },
): WorkoutExerciseDraft => {
  const safeIndex = Math.max(
    0,
    Math.min(
      options?.exerciseIndex ?? workoutState.exercises_progress.findIndex((exercise) => !exercise.is_completed),
      Math.max(workoutState.exercises_progress.length - 1, 0),
    ),
  );
  const currentExerciseIndex = safeIndex < 0 ? 0 : safeIndex;
  const currentExercise = workoutState.exercises_progress[currentExerciseIndex];
  const dayExercise = getDayExerciseByProgress(workoutState.training_day, currentExercise);
  const currentSetNumber = getExerciseTargetSetNumber(dayExercise, currentExercise, options?.targetSetNumber);
  const defaults = getExerciseDraftValues(dayExercise, currentExercise, currentSetNumber);

  return {
    currentExerciseIndex,
    currentSetNumber,
    currentSegments: defaults.segments,
    restSeconds: defaults.restSeconds,
  };
};

export const toWorkoutSetSegmentInputs = (
  segments: WorkoutSetSegmentDraft[],
): WorkoutSetSegmentInput[] =>
  segments.map((segment, index) => ({
    segment_index: index + 1,
    reps_completed: Math.max(0, Math.round(segment.reps_completed)),
    weight_kg: segment.weight_kg > 0 ? segment.weight_kg : 0,
    effort_value: segment.effort_value ?? undefined,
  }));

export const createNextSegmentDraft = (
  dayExercise: DayExercise | undefined,
  currentSegments: WorkoutSetSegmentDraft[],
): WorkoutSetSegmentDraft => {
  const lastSegment = currentSegments[currentSegments.length - 1] ?? buildBaseSegmentDraft(dayExercise);
  return cloneSegmentDraft(lastSegment, currentSegments.length + 1);
};

export const normalizeWorkoutSetDraft = (
  dayExercise: DayExercise | undefined,
  segments: WorkoutSetSegmentDraft[],
): WorkoutSetSegmentDraft[] => normalizeSegmentDrafts(dayExercise, segments);

export const validateWorkoutSetDraft = (
  dayExercise: DayExercise | undefined,
  segments: WorkoutSetSegmentDraft[],
): string | null => {
  const definition = getWorkoutSetTypeDefinition(dayExercise?.set_type);
  if (segments.length < definition.minimumSegments) {
    return `Este tipo de serie requiere al menos ${definition.minimumSegments} segmentos.`;
  }

  return validateSegmentedWeightFlow(dayExercise?.set_type, toWorkoutSetSegmentInputs(segments));
};

export const getSetGroupByNumber = (
  progress: ExerciseProgress | undefined,
  setNumber: number,
): WorkoutSetGroup | undefined =>
  progress?.sets_data.find((setGroup) => setGroup.set_number === setNumber);

/**
 * Find the next incomplete exercise index starting from `currentIndex + 1`.
 * Wraps around circularly so exercises before `currentIndex` are also
 * considered if nothing is found after it. Returns `currentIndex` when
 * every exercise is already completed.
 */
export const findNextIncompleteExerciseIndex = (
  exercisesProgress: ExerciseProgress[],
  currentIndex: number,
): number => {
  const count = exercisesProgress.length;
  if (count === 0) {
    return currentIndex;
  }

  for (let offset = 1; offset < count; offset++) {
    const candidateIndex = (currentIndex + offset) % count;
    if (!exercisesProgress[candidateIndex]?.is_completed) {
      return candidateIndex;
    }
  }

  return currentIndex;
};

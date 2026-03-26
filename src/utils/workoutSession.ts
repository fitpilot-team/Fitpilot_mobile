import type {
  CurrentWorkoutState,
  DayExercise,
  ExerciseProgress,
  ExerciseSetLog,
  TrainingDay,
} from '../types';
import {
  clampEffortValue,
  isCardioExercise,
  isEditableEffortType,
  shouldShowStrengthEffort,
} from './formatters';

export type WorkoutExerciseDraft = {
  currentExerciseIndex: number;
  currentSetNumber: number;
  currentReps: number;
  currentWeight: number;
  currentEffortValue: number | null;
  restSeconds: number;
};

type ExerciseDraftValues = {
  reps: number;
  weight: number;
  effortValue: number | null;
  restSeconds: number;
};

export const DEFAULT_WORKOUT_EXERCISE_DRAFT: WorkoutExerciseDraft = {
  currentExerciseIndex: 0,
  currentSetNumber: 1,
  currentReps: 12,
  currentWeight: 0,
  currentEffortValue: null,
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
  progress?: ExerciseProgress,
  targetSetNumber?: number,
) =>
  targetSetNumber ?? Math.min((progress?.completed_sets ?? 0) + 1, dayExercise?.sets || 1);

export const getExerciseDraftValues = (
  dayExercise?: DayExercise,
  progress?: ExerciseProgress,
  targetSetNumber?: number,
): ExerciseDraftValues => {
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
    currentReps: defaults.reps,
    currentWeight: defaults.weight,
    currentEffortValue: defaults.effortValue,
    restSeconds: defaults.restSeconds,
  };
};

const sortSetLogs = (left: ExerciseSetLog, right: ExerciseSetLog) =>
  left.set_number - right.set_number ||
  left.completed_at.localeCompare(right.completed_at) ||
  left.id.localeCompare(right.id);

const countContiguousCompletedSets = (setLogs: ExerciseSetLog[]) => {
  const completedSetNumbers = new Set(setLogs.map((setLog) => setLog.set_number));
  let completedSets = 0;

  while (completedSetNumbers.has(completedSets + 1)) {
    completedSets += 1;
  }

  return completedSets;
};

const syncProgressWithSetLogs = (
  progress: ExerciseProgress,
  nextSetLogs: ExerciseSetLog[],
): ExerciseProgress => {
  const setsData = [...nextSetLogs].sort(sortSetLogs);
  const completedSets = Math.min(countContiguousCompletedSets(setsData), progress.total_sets);

  return {
    ...progress,
    sets_data: setsData,
    completed_sets: completedSets,
    is_completed: completedSets >= progress.total_sets,
  };
};

const syncWorkoutSummary = (
  workoutState: CurrentWorkoutState,
  nextProgressList: ExerciseProgress[],
): CurrentWorkoutState => ({
  ...workoutState,
  exercises_progress: nextProgressList,
  completed_exercises: nextProgressList.filter((progress) => progress.is_completed).length,
});

export const upsertSetInWorkoutState = (
  workoutState: CurrentWorkoutState,
  setLog: ExerciseSetLog,
): CurrentWorkoutState => {
  const nextProgressList = workoutState.exercises_progress.map((progress) => {
    if (progress.day_exercise_id !== setLog.day_exercise_id) {
      return progress;
    }

    const nextSetLogs = [
      ...progress.sets_data.filter(
        (existingSetLog) =>
          existingSetLog.id !== setLog.id &&
          existingSetLog.set_number !== setLog.set_number,
      ),
      setLog,
    ];

    return syncProgressWithSetLogs(progress, nextSetLogs);
  });

  const nextWorkoutLogSetLogs = [
    ...workoutState.workout_log.exercise_sets.filter(
      (existingSetLog) =>
        existingSetLog.id !== setLog.id ||
        existingSetLog.day_exercise_id !== setLog.day_exercise_id,
    ).filter(
      (existingSetLog) =>
        !(
          existingSetLog.day_exercise_id === setLog.day_exercise_id &&
          existingSetLog.set_number === setLog.set_number
        ),
    ),
    setLog,
  ].sort(sortSetLogs);

  return {
    ...syncWorkoutSummary(workoutState, nextProgressList),
    workout_log: {
      ...workoutState.workout_log,
      exercise_sets: nextWorkoutLogSetLogs,
    },
  };
};

export const removeSetFromWorkoutState = (
  workoutState: CurrentWorkoutState,
  setLogId: string,
): CurrentWorkoutState => {
  const nextProgressList = workoutState.exercises_progress.map((progress) =>
    syncProgressWithSetLogs(
      progress,
      progress.sets_data.filter((setLog) => setLog.id !== setLogId),
    ),
  );

  return {
    ...syncWorkoutSummary(workoutState, nextProgressList),
    workout_log: {
      ...workoutState.workout_log,
      exercise_sets: workoutState.workout_log.exercise_sets
        .filter((setLog) => setLog.id !== setLogId)
        .sort(sortSetLogs),
    },
  };
};

export const reopenWorkoutState = (workoutState: CurrentWorkoutState): CurrentWorkoutState => ({
  ...workoutState,
  workout_log: {
    ...workoutState.workout_log,
    status: 'in_progress',
    completed_at: null,
  },
});

import type {
  ActualSessionStatus,
  Macrocycle,
  Mesocycle,
  Microcycle,
  MicrocycleMode,
  MicrocycleSessionProgress,
  TrainingDay,
  WorkoutLog,
  WorkoutStatus,
} from '../types';
import {
  addDaysToDateKey,
  compareDateKeys,
  formatLocalDate,
  formatLocalShortWeekday,
  getLocalDayNumber,
  getLocalWeekDateKeys,
  getStartOfLocalWeekDateKey,
  getTodayDateKey,
  toLocalDateKey,
} from './date';

export type ProgramTimelineVariant = 'default' | 'partial' | 'complete' | 'rest' | 'missed';

export interface ProgramTimelineSession extends MicrocycleSessionProgress {
  trainingDay: TrainingDay;
  position: number;
  totalSessions: number;
  scheduledDateKey: string;
  performedDateKey: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ProgramTimelineDay {
  dateKey: string;
  isInProgramRange: boolean;
  isRestDay: boolean;
  sessions: ProgramTimelineSession[];
  statusText: string;
  compliancePercentage: number;
  variant: ProgramTimelineVariant;
  showHero: boolean;
  isSelected: boolean;
  isToday: boolean;
}

export interface ProgramTimelineCardSessionState {
  kind: 'session';
  dateKey: string;
  dateLabel: string;
  trainingDay: TrainingDay;
  session: ProgramTimelineSession;
  sessions: ProgramTimelineSession[];
  hasMultipleSessions: boolean;
  position: number;
  total: number;
  actionLabel: string;
  recommendation: 'focused' | 'overdue';
  sourceMode: MicrocycleMode;
  scheduledDateKey: string;
}

export interface ProgramTimelineCardEmptyState {
  kind: 'empty';
  reason: 'no-program' | 'rest' | 'no-scheduled' | 'no-pending' | 'no-executed';
  dateKey: string | null;
  dateLabel: string;
  title: string;
  subtitle: string;
}

export type ProgramTimelineCardState =
  | ProgramTimelineCardSessionState
  | ProgramTimelineCardEmptyState;

export interface ProgramTimelineView {
  initialFocusedDateKey: string | null;
  effectiveFocusedDateKey: string | null;
  currentWeekStartDateKey: string | null;
  canGoToPreviousWeek: boolean;
  canGoToNextWeek: boolean;
  days: ProgramTimelineDay[];
  focusedDay: ProgramTimelineDay | null;
  cardState: ProgramTimelineCardState;
  highlightedSession: ProgramTimelineSession | null;
  highlightedTrainingDay: TrainingDay | null;
  workoutPosition: number | null;
  workoutTotal: number | null;
  allCompleted: boolean;
}

export interface ProgramTimelineActualAdherenceMetrics {
  onSchedule: number;
  rescheduled: number;
  overdue: number;
}

interface ProgramTimelineDayEntry {
  dateKey: string;
  isInProgramRange: boolean;
  hasRestMarker: boolean;
  sessions: ProgramTimelineSession[];
}

export interface ProgramTimelineModel {
  plannedDaysByDateKey: Map<string, ProgramTimelineDayEntry>;
  actualDaysByDateKey: Map<string, ProgramTimelineDayEntry>;
  orderedPlannedSessions: ProgramTimelineSession[];
  actualAdherenceMetrics: ProgramTimelineActualAdherenceMetrics;
  initialFocusedDateKey: string | null;
  calendarStartDateKey: string | null;
  calendarEndDateKey: string | null;
  firstWeekStartDateKey: string | null;
  lastWeekStartDateKey: string | null;
  totalSessions: number;
  allCompleted: boolean;
}

const getWorkoutStatus = (status: WorkoutLog['status'] | ActualSessionStatus | undefined | null) =>
  (status ?? 'not_started') as ActualSessionStatus | WorkoutStatus;

const getTrainingDayTotalSets = (trainingDay: TrainingDay) =>
  trainingDay.exercises.reduce((sum, exercise) => sum + (exercise.sets || 0), 0);

const roundPercentage = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

const calculateSessionCompletionPercentage = (
  trainingDay: TrainingDay,
  workoutLog: WorkoutLog | null,
) => {
  if (!workoutLog) {
    return 0;
  }

  if (workoutLog.status === 'completed') {
    return 100;
  }

  const totalSets = getTrainingDayTotalSets(trainingDay);
  if (totalSets <= 0) {
    return 0;
  }

  return roundPercentage((workoutLog.exercise_sets.length / totalSets) * 100);
};

const resolvePlannedStatus = (
  actualStatus: ActualSessionStatus,
  completionPercentage: number,
): MicrocycleSessionProgress['planned_status'] => {
  if (actualStatus === 'completed') {
    return 'completed';
  }

  if (actualStatus === 'in_progress' || actualStatus === 'abandoned' || completionPercentage > 0) {
    return 'partial';
  }

  return 'pending';
};

const compareDayId = (left: TrainingDay, right: TrainingDay) => {
  const leftId = Number.parseInt(left.id, 10);
  const rightId = Number.parseInt(right.id, 10);

  if (Number.isFinite(leftId) && Number.isFinite(rightId)) {
    return leftId - rightId;
  }

  return left.id.localeCompare(right.id);
};

const compareMesocycleId = (left: Mesocycle, right: Mesocycle) => {
  const leftId = Number.parseInt(left.id, 10);
  const rightId = Number.parseInt(right.id, 10);

  if (Number.isFinite(leftId) && Number.isFinite(rightId)) {
    return leftId - rightId;
  }

  return left.id.localeCompare(right.id);
};

const compareMicrocycleId = (left: Microcycle, right: Microcycle) => {
  const leftId = Number.parseInt(left.id, 10);
  const rightId = Number.parseInt(right.id, 10);

  if (Number.isFinite(leftId) && Number.isFinite(rightId)) {
    return leftId - rightId;
  }

  return left.id.localeCompare(right.id);
};

const flattenOrderedTrainingDays = (macrocycle: Macrocycle) => {
  return [...(macrocycle.mesocycles ?? [])]
    .sort((left, right) => left.block_number - right.block_number || compareMesocycleId(left, right))
    .flatMap((mesocycle) =>
      [...(mesocycle.microcycles ?? [])]
        .sort((left, right) => left.week_number - right.week_number || compareMicrocycleId(left, right))
        .flatMap((microcycle) =>
          [...(microcycle.training_days ?? [])].sort(
            (left, right) =>
              (left.day_number ?? 0) - (right.day_number ?? 0) ||
              left.session_index - right.session_index ||
              compareDayId(left, right),
          ),
        ),
    );
};

const getWorkoutLogSortKey = (workoutLog: WorkoutLog) =>
  workoutLog.completed_at ?? workoutLog.started_at ?? workoutLog.performed_on_date ?? '';

const buildWorkoutLogMap = (workoutLogs: WorkoutLog[]) => {
  const logsByTrainingDayId = new Map<string, WorkoutLog>();

  for (const workoutLog of workoutLogs) {
    const existing = logsByTrainingDayId.get(workoutLog.training_day_id);
    if (!existing || getWorkoutLogSortKey(workoutLog).localeCompare(getWorkoutLogSortKey(existing)) > 0) {
      logsByTrainingDayId.set(workoutLog.training_day_id, workoutLog);
    }
  }

  return logsByTrainingDayId;
};

const clampDateKeyToRange = (
  dateKey: string | null,
  minDateKey: string | null,
  maxDateKey: string | null,
) => {
  if (!dateKey || !minDateKey || !maxDateKey) {
    return null;
  }

  if (compareDateKeys(dateKey, minDateKey) < 0) {
    return minDateKey;
  }

  if (compareDateKeys(dateKey, maxDateKey) > 0) {
    return maxDateKey;
  }

  return dateKey;
};

const minDateKey = (left: string, right: string) =>
  compareDateKeys(left, right) <= 0 ? left : right;

const maxDateKey = (left: string, right: string) =>
  compareDateKeys(left, right) >= 0 ? left : right;

const createDayEntryMap = (
  rangeStartDateKey: string,
  rangeEndDateKey: string,
  programStartDateKey: string,
  programEndDateKey: string,
) => {
  const daysByDateKey = new Map<string, ProgramTimelineDayEntry>();

  for (
    let currentDateKey: string | null = rangeStartDateKey;
    currentDateKey && compareDateKeys(currentDateKey, rangeEndDateKey) <= 0;
    currentDateKey = addDaysToDateKey(currentDateKey, 1)
  ) {
    daysByDateKey.set(currentDateKey, {
      dateKey: currentDateKey,
      isInProgramRange:
        compareDateKeys(currentDateKey, programStartDateKey) >= 0 &&
        compareDateKeys(currentDateKey, programEndDateKey) <= 0,
      hasRestMarker: false,
      sessions: [],
    });
  }

  return daysByDateKey;
};

const buildEmptyCardState = (
  reason: ProgramTimelineCardEmptyState['reason'],
  dateKey: string | null,
): ProgramTimelineCardEmptyState => {
  const dateLabel = dateKey
    ? formatLocalDate(dateKey, { weekday: 'long', month: 'short', day: 'numeric' })
    : '';

  switch (reason) {
    case 'rest':
      return {
        kind: 'empty',
        reason,
        dateKey,
        dateLabel,
        title: 'Dia de descanso',
        subtitle: dateLabel
          ? `No tienes sesiones programadas para ${dateLabel}.`
          : 'No tienes sesiones programadas para esta fecha.',
      };
    case 'no-scheduled':
      return {
        kind: 'empty',
        reason,
        dateKey,
        dateLabel,
        title: 'Sin entrenamiento programado',
        subtitle: dateLabel
          ? `No hay sesiones programadas para ${dateLabel}.`
          : 'No hay sesiones programadas para esta fecha.',
      };
    case 'no-pending':
      return {
        kind: 'empty',
        reason,
        dateKey,
        dateLabel,
        title: 'Sin entrenamiento pendiente',
        subtitle: dateLabel
          ? `Las sesiones de ${dateLabel} ya estan completadas.`
          : 'Las sesiones de esta fecha ya estan completadas.',
      };
    case 'no-executed':
      return {
        kind: 'empty',
        reason,
        dateKey,
        dateLabel,
        title: 'Sin entrenamiento ejecutado',
        subtitle: dateLabel
          ? `No hay sesiones registradas en ${dateLabel}.`
          : 'No hay sesiones registradas para esta fecha.',
      };
    default:
      return {
        kind: 'empty',
        reason: 'no-program',
        dateKey,
        dateLabel,
        title: 'No tienes un programa activo',
        subtitle: 'Cuando exista una programacion vigente, aparecera aqui.',
      };
  }
};

const getSessionActionLabel = (session: ProgramTimelineSession) => {
  if (session.actual_status === 'completed') {
    return 'ver registro';
  }

  if (session.actual_status === 'abandoned') {
    return 'retomar';
  }

  if (session.actual_status === 'in_progress' || session.workout_log_id) {
    return 'continuar';
  }

  return 'empezar';
};

const getDailyCompliancePercentage = (sessions: ProgramTimelineSession[]) => {
  if (sessions.length === 0) {
    return 0;
  }

  const total = sessions.reduce((sum, session) => {
    if (session.actual_status === 'completed') {
      return sum + 100;
    }

    if (session.actual_status === 'not_started') {
      return sum;
    }

    return sum + roundPercentage(session.completion_percentage);
  }, 0);

  return roundPercentage(total / sessions.length);
};

const getDayVariant = (
  entry: ProgramTimelineDayEntry,
  compliancePercentage: number,
  mode: MicrocycleMode,
  todayDateKey: string,
): ProgramTimelineVariant => {
  if (mode === 'planned' && entry.hasRestMarker && entry.sessions.length === 0) {
    return 'rest';
  }

  if (entry.sessions.length === 0) {
    return 'default';
  }

  const isPastDay = compareDateKeys(entry.dateKey, todayDateKey) < 0;

  if (mode === 'planned') {
    if (entry.sessions.every((session) => session.planned_status === 'completed')) {
      return 'complete';
    }

    if (
      compliancePercentage > 0 ||
      entry.sessions.some((session) => session.planned_status === 'partial')
    ) {
      return 'partial';
    }

    if (isPastDay) {
      return 'missed';
    }

    return 'default';
  }

  if (entry.sessions.every((session) => session.actual_status === 'completed')) {
    return 'complete';
  }

  if (
    compliancePercentage > 0 ||
    entry.sessions.some(
      (session) => session.actual_status === 'in_progress' || session.actual_status === 'abandoned',
    )
  ) {
    return 'partial';
  }

  if (isPastDay) {
    return 'missed';
  }

  return 'default';
};

const comparePlannedSessions = (left: ProgramTimelineSession, right: ProgramTimelineSession) =>
  left.session_index - right.session_index ||
  left.position - right.position ||
  left.training_day_id.localeCompare(right.training_day_id);

const compareActualSessions = (left: ProgramTimelineSession, right: ProgramTimelineSession) => {
  const leftSortKey = left.completedAt ?? left.startedAt ?? left.performedDateKey ?? '';
  const rightSortKey = right.completedAt ?? right.startedAt ?? right.performedDateKey ?? '';

  return (
    leftSortKey.localeCompare(rightSortKey) ||
    left.position - right.position ||
    left.session_index - right.session_index ||
    left.training_day_id.localeCompare(right.training_day_id)
  );
};

const getDayEntryForMode = (model: ProgramTimelineModel, mode: MicrocycleMode, dateKey: string) =>
  (mode === 'planned' ? model.plannedDaysByDateKey : model.actualDaysByDateKey).get(dateKey) ?? null;

const findOverdueSession = (sessions: ProgramTimelineSession[], todayDateKey: string) =>
  sessions.find(
    (session) =>
      compareDateKeys(session.scheduledDateKey, todayDateKey) < 0 &&
      session.actual_status !== 'completed',
  ) ?? null;

const buildSessionCardState = ({
  session,
  dateKey,
  mode,
  recommendation,
  daySessions,
  showSessionPicker,
}: {
  session: ProgramTimelineSession;
  dateKey: string;
  mode: MicrocycleMode;
  recommendation: 'focused' | 'overdue';
  daySessions: ProgramTimelineSession[];
  showSessionPicker: boolean;
}): ProgramTimelineCardSessionState => ({
  kind: 'session',
  dateKey,
  dateLabel: formatLocalDate(dateKey, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }),
  trainingDay: session.trainingDay,
  session,
  sessions: daySessions,
  hasMultipleSessions: showSessionPicker && daySessions.length > 1,
  position: session.position,
  total: session.totalSessions,
  actionLabel: getSessionActionLabel(session),
  recommendation,
  sourceMode: mode,
  scheduledDateKey: session.scheduledDateKey,
});

const buildActualAdherenceMetrics = (
  sessions: ProgramTimelineSession[],
  todayDateKey: string,
): ProgramTimelineActualAdherenceMetrics =>
  sessions.reduce<ProgramTimelineActualAdherenceMetrics>(
    (metrics, session) => {
      const hasLog = session.actual_status !== 'not_started' && Boolean(session.performedDateKey);

      if (hasLog) {
        if (session.performedDateKey === session.scheduledDateKey) {
          metrics.onSchedule += 1;
        } else {
          metrics.rescheduled += 1;
        }
      }

      if (
        compareDateKeys(session.scheduledDateKey, todayDateKey) < 0 &&
        session.actual_status !== 'completed'
      ) {
        metrics.overdue += 1;
      }

      return metrics;
    },
    {
      onSchedule: 0,
      rescheduled: 0,
      overdue: 0,
    },
  );

export const buildProgramTimelineModel = (
  activeMacrocycle: Macrocycle | null,
  workoutLogs: WorkoutLog[],
): ProgramTimelineModel => {
  if (!activeMacrocycle) {
    return {
      plannedDaysByDateKey: new Map(),
      actualDaysByDateKey: new Map(),
      orderedPlannedSessions: [],
      actualAdherenceMetrics: {
        onSchedule: 0,
        rescheduled: 0,
        overdue: 0,
      },
      initialFocusedDateKey: null,
      calendarStartDateKey: null,
      calendarEndDateKey: null,
      firstWeekStartDateKey: null,
      lastWeekStartDateKey: null,
      totalSessions: 0,
      allCompleted: false,
    };
  }

  const orderedTrainingDays = flattenOrderedTrainingDays(activeMacrocycle);
  const trainingDayDateKeys = orderedTrainingDays
    .map((trainingDay) => toLocalDateKey(trainingDay.date))
    .filter((dateKey): dateKey is string => Boolean(dateKey));

  const programStartDateKey =
    toLocalDateKey(activeMacrocycle.start_date) ?? trainingDayDateKeys[0] ?? null;
  const programEndDateKey =
    toLocalDateKey(activeMacrocycle.end_date) ??
    trainingDayDateKeys[trainingDayDateKeys.length - 1] ??
    null;

  if (!programStartDateKey || !programEndDateKey || orderedTrainingDays.length === 0) {
    return {
      plannedDaysByDateKey: new Map(),
      actualDaysByDateKey: new Map(),
      orderedPlannedSessions: [],
      actualAdherenceMetrics: {
        onSchedule: 0,
        rescheduled: 0,
        overdue: 0,
      },
      initialFocusedDateKey: null,
      calendarStartDateKey: null,
      calendarEndDateKey: null,
      firstWeekStartDateKey: null,
      lastWeekStartDateKey: null,
      totalSessions: 0,
      allCompleted: false,
    };
  }

  const todayDateKey = getTodayDateKey();
  const currentWeekStartDateKey = getStartOfLocalWeekDateKey(todayDateKey) ?? todayDateKey;
  const currentWeekEndDateKey = addDaysToDateKey(currentWeekStartDateKey, 6) ?? todayDateKey;
  const firstProgramWeekStartDateKey =
    getStartOfLocalWeekDateKey(programStartDateKey) ?? programStartDateKey;
  const lastProgramWeekStartDateKey =
    getStartOfLocalWeekDateKey(programEndDateKey) ?? programEndDateKey;
  const programCalendarEndDateKey =
    addDaysToDateKey(lastProgramWeekStartDateKey, 6) ?? programEndDateKey;

  const firstWeekStartDateKey = minDateKey(firstProgramWeekStartDateKey, currentWeekStartDateKey);
  const lastWeekStartDateKey = maxDateKey(lastProgramWeekStartDateKey, currentWeekStartDateKey);
  const calendarStartDateKey = firstWeekStartDateKey;
  const calendarEndDateKey = maxDateKey(programCalendarEndDateKey, currentWeekEndDateKey);

  const plannedDaysByDateKey = createDayEntryMap(
    calendarStartDateKey,
    calendarEndDateKey,
    programStartDateKey,
    programEndDateKey,
  );
  const actualDaysByDateKey = createDayEntryMap(
    calendarStartDateKey,
    calendarEndDateKey,
    programStartDateKey,
    programEndDateKey,
  );

  const workoutLogMap = buildWorkoutLogMap(workoutLogs);
  const nonRestTrainingDays = orderedTrainingDays.filter((trainingDay) => !trainingDay.rest_day);
  const totalSessions = nonRestTrainingDays.length;
  const orderedPlannedSessions: ProgramTimelineSession[] = [];

  nonRestTrainingDays.forEach((trainingDay, index) => {
    const scheduledDateKey = toLocalDateKey(trainingDay.date);
    if (!scheduledDateKey) {
      return;
    }

    const plannedDayEntry = plannedDaysByDateKey.get(scheduledDateKey);
    if (!plannedDayEntry) {
      return;
    }

    const workoutLog = workoutLogMap.get(trainingDay.id) ?? null;
    const actualStatus = getWorkoutStatus(workoutLog?.status) as ActualSessionStatus;
    const completionPercentage = calculateSessionCompletionPercentage(trainingDay, workoutLog);
    const performedDateKey = toLocalDateKey(workoutLog?.performed_on_date ?? null);

    const timelineSession: ProgramTimelineSession = {
      training_day_id: trainingDay.id,
      workout_log_id: workoutLog?.id ?? null,
      session_index: trainingDay.session_index,
      session_label: trainingDay.session_label,
      name: trainingDay.name,
      focus: trainingDay.focus,
      planned_status: resolvePlannedStatus(actualStatus, completionPercentage),
      actual_status: actualStatus,
      completion_percentage: completionPercentage,
      performed_on_date: workoutLog?.performed_on_date ?? null,
      trainingDay,
      position: index + 1,
      totalSessions,
      scheduledDateKey,
      performedDateKey,
      startedAt: workoutLog?.started_at ?? null,
      completedAt: workoutLog?.completed_at ?? null,
    };

    plannedDayEntry.sessions.push(timelineSession);
    orderedPlannedSessions.push(timelineSession);

    if (performedDateKey) {
      const actualDayEntry = actualDaysByDateKey.get(performedDateKey);
      if (actualDayEntry) {
        actualDayEntry.sessions.push(timelineSession);
      }
    }
  });

  orderedTrainingDays
    .filter((trainingDay) => trainingDay.rest_day)
    .forEach((trainingDay) => {
      const dateKey = toLocalDateKey(trainingDay.date);
      if (!dateKey) {
        return;
      }

      const dayEntry = plannedDaysByDateKey.get(dateKey);
      if (dayEntry) {
        dayEntry.hasRestMarker = true;
      }
    });

  for (const dayEntry of plannedDaysByDateKey.values()) {
    dayEntry.sessions.sort(comparePlannedSessions);
  }

  for (const dayEntry of actualDaysByDateKey.values()) {
    dayEntry.hasRestMarker = false;
    dayEntry.sessions.sort(compareActualSessions);
  }

  const initialFocusedDateKey =
    clampDateKeyToRange(todayDateKey, calendarStartDateKey, calendarEndDateKey) ?? todayDateKey;
  const actualAdherenceMetrics = buildActualAdherenceMetrics(orderedPlannedSessions, todayDateKey);
  const allCompleted =
    totalSessions > 0 && orderedPlannedSessions.every((session) => session.actual_status === 'completed');

  return {
    plannedDaysByDateKey,
    actualDaysByDateKey,
    orderedPlannedSessions,
    actualAdherenceMetrics,
    initialFocusedDateKey,
    calendarStartDateKey,
    calendarEndDateKey,
    firstWeekStartDateKey,
    lastWeekStartDateKey,
    totalSessions,
    allCompleted,
  };
};

export const shiftProgramTimelineFocusByWeek = (
  model: ProgramTimelineModel,
  focusedDateKey: string | null,
  direction: -1 | 1,
) => {
  if (!model.calendarStartDateKey || !model.calendarEndDateKey) {
    return null;
  }

  const baseDateKey =
    clampDateKeyToRange(
      focusedDateKey ?? model.initialFocusedDateKey,
      model.calendarStartDateKey,
      model.calendarEndDateKey,
    ) ?? model.calendarStartDateKey;
  const nextDateKey = addDaysToDateKey(baseDateKey, direction * 7) ?? baseDateKey;

  return clampDateKeyToRange(nextDateKey, model.calendarStartDateKey, model.calendarEndDateKey);
};

export const buildProgramTimelineView = (
  model: ProgramTimelineModel,
  focusedDateKey: string | null,
  mode: MicrocycleMode,
): ProgramTimelineView => {
  if (
    !model.calendarStartDateKey ||
    !model.calendarEndDateKey ||
    !model.firstWeekStartDateKey ||
    !model.lastWeekStartDateKey ||
    !model.initialFocusedDateKey
  ) {
    return {
      initialFocusedDateKey: null,
      effectiveFocusedDateKey: null,
      currentWeekStartDateKey: null,
      canGoToPreviousWeek: false,
      canGoToNextWeek: false,
      days: [],
      focusedDay: null,
      cardState: buildEmptyCardState('no-program', null),
      highlightedSession: null,
      highlightedTrainingDay: null,
      workoutPosition: null,
      workoutTotal: null,
      allCompleted: false,
    };
  }

  const todayDateKey = getTodayDateKey();
  const effectiveFocusedDateKey =
    clampDateKeyToRange(
      focusedDateKey ?? model.initialFocusedDateKey,
      model.calendarStartDateKey,
      model.calendarEndDateKey,
    ) ?? model.initialFocusedDateKey;
  const currentWeekStartDateKey =
    getStartOfLocalWeekDateKey(effectiveFocusedDateKey) ?? model.firstWeekStartDateKey;
  const weekDateKeys = getLocalWeekDateKeys(currentWeekStartDateKey);

  const days = weekDateKeys.map<ProgramTimelineDay>((dateKey) => {
    const dayEntry = getDayEntryForMode(model, mode, dateKey) ?? {
      dateKey,
      isInProgramRange: false,
      hasRestMarker: false,
      sessions: [],
    };
    const compliancePercentage = getDailyCompliancePercentage(dayEntry.sessions);
    const isRestDay = mode === 'planned' && dayEntry.hasRestMarker && dayEntry.sessions.length === 0;

    return {
      dateKey,
      isInProgramRange: dayEntry.isInProgramRange,
      isRestDay,
      sessions: dayEntry.sessions,
      statusText: isRestDay ? 'Desc' : dayEntry.sessions.length > 0 ? `${compliancePercentage}%` : '',
      compliancePercentage,
      variant: getDayVariant(dayEntry, compliancePercentage, mode, todayDateKey),
      showHero: dateKey === effectiveFocusedDateKey || dayEntry.sessions.length > 0 || isRestDay,
      isSelected: dateKey === effectiveFocusedDateKey,
      isToday: dateKey === todayDateKey,
    };
  });

  const focusedDay = days.find((day) => day.dateKey === effectiveFocusedDateKey) ?? null;
  const focusedEntry = getDayEntryForMode(model, mode, effectiveFocusedDateKey);

  let cardState: ProgramTimelineCardState;
  let highlightedSession: ProgramTimelineSession | null = null;
  let highlightedTrainingDay: TrainingDay | null = null;
  let workoutPosition: number | null = null;

  if (mode === 'actual') {
    if (!focusedEntry || focusedEntry.sessions.length === 0) {
      cardState = buildEmptyCardState('no-executed', effectiveFocusedDateKey);
    } else {
      const latestExecutedSession = focusedEntry.sessions[focusedEntry.sessions.length - 1] ?? null;

      if (!latestExecutedSession) {
        cardState = buildEmptyCardState('no-executed', effectiveFocusedDateKey);
      } else {
        highlightedSession = latestExecutedSession;
        highlightedTrainingDay = latestExecutedSession.trainingDay;
        workoutPosition = latestExecutedSession.position;
        cardState = buildSessionCardState({
          session: latestExecutedSession,
          dateKey: effectiveFocusedDateKey,
          mode,
          recommendation: 'focused',
          daySessions: focusedEntry.sessions,
          showSessionPicker: true,
        });
      }
    }
  } else {
    const overdueSession = findOverdueSession(model.orderedPlannedSessions, todayDateKey);

    if (overdueSession) {
      const overdueDaySessions =
        overdueSession.scheduledDateKey === effectiveFocusedDateKey
          ? getDayEntryForMode(model, 'planned', overdueSession.scheduledDateKey)?.sessions ?? [overdueSession]
          : [overdueSession];

      highlightedSession = overdueSession;
      highlightedTrainingDay = overdueSession.trainingDay;
      workoutPosition = overdueSession.position;
      cardState = buildSessionCardState({
        session: overdueSession,
        dateKey: overdueSession.scheduledDateKey,
        mode,
        recommendation: 'overdue',
        daySessions: overdueDaySessions,
        showSessionPicker: overdueSession.scheduledDateKey === effectiveFocusedDateKey,
      });
    } else if (!focusedEntry) {
      cardState = buildEmptyCardState('no-scheduled', effectiveFocusedDateKey);
    } else if (focusedEntry.hasRestMarker && focusedEntry.sessions.length === 0) {
      cardState = buildEmptyCardState('rest', effectiveFocusedDateKey);
    } else if (focusedEntry.sessions.length === 0) {
      cardState = buildEmptyCardState('no-scheduled', effectiveFocusedDateKey);
    } else {
      const pendingSessions = focusedEntry.sessions.filter((session) => session.actual_status !== 'completed');
      const nextSession = pendingSessions[pendingSessions.length - 1] ?? null;

      if (!nextSession) {
        cardState = buildEmptyCardState('no-pending', effectiveFocusedDateKey);
      } else {
        highlightedSession = nextSession;
        highlightedTrainingDay = nextSession.trainingDay;
        workoutPosition = nextSession.position;
        cardState = buildSessionCardState({
          session: nextSession,
          dateKey: effectiveFocusedDateKey,
          mode,
          recommendation: 'focused',
          daySessions: focusedEntry.sessions,
          showSessionPicker: true,
        });
      }
    }
  }

  return {
    initialFocusedDateKey: model.initialFocusedDateKey,
    effectiveFocusedDateKey,
    currentWeekStartDateKey,
    canGoToPreviousWeek: compareDateKeys(currentWeekStartDateKey, model.firstWeekStartDateKey) > 0,
    canGoToNextWeek: compareDateKeys(currentWeekStartDateKey, model.lastWeekStartDateKey) < 0,
    days,
    focusedDay,
    cardState,
    highlightedSession,
    highlightedTrainingDay,
    workoutPosition,
    workoutTotal: model.totalSessions,
    allCompleted: model.allCompleted,
  };
};

export const getProgramTimelineWeekLabel = (weekStartDateKey: string | null) => {
  if (!weekStartDateKey) {
    return null;
  }

  const weekEndDateKey = addDaysToDateKey(weekStartDateKey, 6);
  if (!weekEndDateKey) {
    return null;
  }

  return `${formatLocalDate(weekStartDateKey, { month: 'short', day: 'numeric' })} - ${formatLocalDate(
    weekEndDateKey,
    { month: 'short', day: 'numeric' },
  )}`;
};

export const getProgramTimelineCalendarDayLabel = (dateKey: string) => ({
  dayLabel: formatLocalShortWeekday(dateKey),
  dateNumber: getLocalDayNumber(dateKey),
});

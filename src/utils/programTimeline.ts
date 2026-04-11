import type {
  DashboardTimeline,
  DashboardTimelineDay,
  DashboardTimelineSession,
  DashboardTrainingDaySummary,
  MicrocycleMode,
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
} from './date';

export type ProgramTimelineVariant = 'default' | 'partial' | 'complete' | 'rest' | 'missed';
export type ProgramTimelineSession = DashboardTimelineSession;

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
  trainingDay: DashboardTrainingDaySummary;
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
  highlightedTrainingDay: DashboardTrainingDaySummary | null;
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

const buildEmptyModel = (): ProgramTimelineModel => ({
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
});

const toDayEntry = (day: DashboardTimelineDay): ProgramTimelineDayEntry => ({
  dateKey: day.date_key,
  isInProgramRange: day.is_in_program_range,
  hasRestMarker: day.has_rest_marker,
  sessions: Array.isArray(day.sessions) ? day.sessions : [],
});

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

    return sum + Math.max(0, Math.min(100, Math.round(session.completion_percentage)));
  }, 0);

  return Math.max(0, Math.min(100, Math.round(total / sessions.length)));
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

const getDayEntryForMode = (model: ProgramTimelineModel, mode: MicrocycleMode, dateKey: string) =>
  (mode === 'planned' ? model.plannedDaysByDateKey : model.actualDaysByDateKey).get(dateKey) ?? null;

const findOverdueSession = (sessions: ProgramTimelineSession[], todayDateKey: string) =>
  sessions.find(
    (session) =>
      compareDateKeys(session.scheduled_date_key, todayDateKey) < 0 &&
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
  trainingDay: session.training_day,
  session,
  sessions: daySessions,
  hasMultipleSessions: showSessionPicker && daySessions.length > 1,
  position: session.position,
  total: session.total_sessions,
  actionLabel: getSessionActionLabel(session),
  recommendation,
  sourceMode: mode,
  scheduledDateKey: session.scheduled_date_key,
});

export const buildProgramTimelineModel = (
  timeline: DashboardTimeline | null | undefined,
): ProgramTimelineModel => {
  if (!timeline) {
    return buildEmptyModel();
  }

  const plannedDaysByDateKey = new Map(
    (timeline.planned_days ?? []).map((day) => [day.date_key, toDayEntry(day)]),
  );
  const actualDaysByDateKey = new Map(
    (timeline.actual_days ?? []).map((day) => [day.date_key, toDayEntry(day)]),
  );

  return {
    plannedDaysByDateKey,
    actualDaysByDateKey,
    orderedPlannedSessions: (timeline.planned_days ?? []).flatMap((day) => day.sessions ?? []),
    actualAdherenceMetrics: {
      onSchedule: timeline.actual_adherence_metrics?.on_schedule ?? 0,
      rescheduled: timeline.actual_adherence_metrics?.rescheduled ?? 0,
      overdue: timeline.actual_adherence_metrics?.overdue ?? 0,
    },
    initialFocusedDateKey: timeline.initial_focused_date_key ?? null,
    calendarStartDateKey: timeline.calendar_start_date_key ?? null,
    calendarEndDateKey: timeline.calendar_end_date_key ?? null,
    firstWeekStartDateKey: timeline.first_week_start_date_key ?? null,
    lastWeekStartDateKey: timeline.last_week_start_date_key ?? null,
    totalSessions: timeline.total_sessions ?? 0,
    allCompleted: timeline.all_completed ?? false,
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

  const baseDateKey = focusedDateKey ?? model.initialFocusedDateKey ?? model.calendarStartDateKey;
  const nextDateKey = addDaysToDateKey(baseDateKey, direction * 7) ?? baseDateKey;

  if (compareDateKeys(nextDateKey, model.calendarStartDateKey) < 0) {
    return model.calendarStartDateKey;
  }
  if (compareDateKeys(nextDateKey, model.calendarEndDateKey) > 0) {
    return model.calendarEndDateKey;
  }

  return nextDateKey;
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
  const unclampedFocusedDateKey = focusedDateKey ?? model.initialFocusedDateKey;
  const effectiveFocusedDateKey =
    compareDateKeys(unclampedFocusedDateKey, model.calendarStartDateKey) < 0
      ? model.calendarStartDateKey
      : compareDateKeys(unclampedFocusedDateKey, model.calendarEndDateKey) > 0
        ? model.calendarEndDateKey
        : unclampedFocusedDateKey;
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
  let highlightedTrainingDay: DashboardTrainingDaySummary | null = null;
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
        highlightedTrainingDay = latestExecutedSession.training_day;
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
        overdueSession.scheduled_date_key === effectiveFocusedDateKey
          ? getDayEntryForMode(model, 'planned', overdueSession.scheduled_date_key)?.sessions ?? [overdueSession]
          : [overdueSession];

      highlightedSession = overdueSession;
      highlightedTrainingDay = overdueSession.training_day;
      workoutPosition = overdueSession.position;
      cardState = buildSessionCardState({
        session: overdueSession,
        dateKey: overdueSession.scheduled_date_key,
        mode,
        recommendation: 'overdue',
        daySessions: overdueDaySessions,
        showSessionPicker: overdueSession.scheduled_date_key === effectiveFocusedDateKey,
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
        highlightedTrainingDay = nextSession.training_day;
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

import React, { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import {
  SharedWeeklyCalendar,
  type SharedWeeklyCalendarDay,
  type SharedWeeklyCalendarVariant,
  sharedWeeklyCalendarHeroLayoutPreset,
} from '../calendar/SharedWeeklyCalendar';
import { borderRadius, fontSize, shadows, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { MicrocycleDayProgress, MicrocycleMode, MicrocycleProgress } from '../../types';
import {
  compareDateKeys,
  formatLocalDate,
  formatLocalShortWeekday,
  getCalendarDayDiff,
  getLocalDayNumber,
  getTodayDateKey,
  toLocalDateKey,
} from '../../utils/date';

interface MicrocycleTimelineProps {
  microcycleProgress: MicrocycleProgress | null;
  mode: MicrocycleMode;
  onDayPress?: (day: MicrocycleDayProgress) => void;
  contentWidth?: number;
}

const WINDOW_SIZE = 7;
const WINDOW_CENTER_INDEX = Math.floor(WINDOW_SIZE / 2);
const SWIPE_THRESHOLD = 40;

const resolveInitialSelectedDateKey = (days: MicrocycleDayProgress[]) => {
  if (days.length === 0) {
    return null;
  }

  const todayDateKey = getTodayDateKey();
  const todayDay = days.find((day) => toLocalDateKey(day.date) === todayDateKey);
  if (todayDay) {
    return todayDateKey;
  }

  return days.reduce((closestDay, day) => {
    const currentDistance = Math.abs(getCalendarDayDiff(todayDateKey, day.date));
    const closestDistance = Math.abs(getCalendarDayDiff(todayDateKey, closestDay.date));

    if (currentDistance < closestDistance) {
      return day;
    }

    if (currentDistance === closestDistance && compareDateKeys(day.date, closestDay.date) < 0) {
      return day;
    }

    return closestDay;
  }).date;
};

const getDayStatusText = (day: MicrocycleDayProgress, mode: MicrocycleMode) => {
  if (day.is_rest_day) {
    return 'Desc';
  }

  if (mode === 'planned') {
    if (day.planned_sessions === 0) {
      return '-';
    }

    return `${day.completed_planned_sessions}/${day.planned_sessions}`;
  }

  if (day.actual_logs_count === 0) {
    return '-';
  }

  return `${day.actual_logs_count} log${day.actual_logs_count > 1 ? 's' : ''}`;
};

const getDayVariant = (
  day: MicrocycleDayProgress,
  mode: MicrocycleMode,
  todayDateKey: string,
): SharedWeeklyCalendarVariant => {
  if (day.is_rest_day) {
    return 'rest';
  }

  const isPastDay = compareDateKeys(day.date, todayDateKey) < 0;

  if (mode === 'planned') {
    if (day.planned_sessions > 0 && day.completed_planned_sessions === day.planned_sessions) {
      return 'complete';
    }

    if (day.has_partial_session) {
      return 'partial';
    }

    if (isPastDay && day.planned_sessions > 0 && day.completed_planned_sessions === 0) {
      return 'missed';
    }

    return 'default';
  }

  if (day.has_partial_session) {
    return 'partial';
  }

  if (
    day.actual_logs_count > 0 &&
    day.sessions.length > 0 &&
    day.sessions.every((session) => session.actual_status === 'completed')
  ) {
    return 'complete';
  }

  if (isPastDay && day.planned_sessions > 0 && day.actual_logs_count === 0) {
    return 'missed';
  }

  return 'default';
};

const clampWindowStart = (selectedIndex: number, totalDays: number) => {
  if (totalDays <= WINDOW_SIZE) {
    return 0;
  }

  return Math.max(0, Math.min(selectedIndex - WINDOW_CENTER_INDEX, totalDays - WINDOW_SIZE));
};

export const MicrocycleTimeline: React.FC<MicrocycleTimelineProps> = ({
  microcycleProgress,
  mode,
  onDayPress,
  contentWidth = 390,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const todayDateKey = getTodayDateKey();
  const days = useMemo(() => microcycleProgress?.days ?? [], [microcycleProgress?.days]);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  useEffect(() => {
    if (days.length === 0) {
      setSelectedDateKey(null);
      return;
    }

    const currentSelectionIsValid = selectedDateKey
      ? days.some((day) => toLocalDateKey(day.date) === selectedDateKey)
      : false;

    if (currentSelectionIsValid) {
      return;
    }

    const nextSelectedDateKey = resolveInitialSelectedDateKey(days);
    setSelectedDateKey(toLocalDateKey(nextSelectedDateKey) ?? nextSelectedDateKey);
  }, [days, selectedDateKey]);

  const selectedIndex = useMemo(() => {
    if (!selectedDateKey) {
      return 0;
    }

    const index = days.findIndex((day) => toLocalDateKey(day.date) === selectedDateKey);
    return index >= 0 ? index : 0;
  }, [days, selectedDateKey]);

  const visibleDays = useMemo(() => {
    if (days.length <= WINDOW_SIZE) {
      return days;
    }

    const startIndex = clampWindowStart(selectedIndex, days.length);
    return days.slice(startIndex, startIndex + WINDOW_SIZE);
  }, [days, selectedIndex]);

  const calendarDays = useMemo<SharedWeeklyCalendarDay[]>(() => {
    return visibleDays.map((day) => {
      const dateKey = toLocalDateKey(day.date) ?? day.date;

      return {
        id: `${dateKey}-${mode}`,
        dateKey,
        dayLabel: formatLocalShortWeekday(day.date),
        dateNumber: getLocalDayNumber(day.date),
        isSelected: dateKey === selectedDateKey,
        isToday: dateKey === todayDateKey,
        isDisabled: false,
        statusText: getDayStatusText(day, mode),
        variant: getDayVariant(day, mode, todayDateKey),
        onPress: () => {
          setSelectedDateKey(dateKey);
          if (day.sessions.length > 0) {
            void onDayPress?.(day);
          }
        },
      };
    });
  }, [mode, onDayPress, selectedDateKey, todayDateKey, visibleDays]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dx) < SWIPE_THRESHOLD || days.length <= 1) {
            return;
          }

          const direction = gestureState.dx < 0 ? 1 : -1;
          const nextIndex = Math.max(0, Math.min(days.length - 1, selectedIndex + direction));
          const nextDay = days[nextIndex];
          const nextDateKey = toLocalDateKey(nextDay?.date) ?? nextDay?.date ?? null;
          if (nextDateKey) {
            setSelectedDateKey(nextDateKey);
          }
        },
      }),
    [days, selectedIndex],
  );

  if (!days.length) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
        <View style={styles.emptyCopy}>
          <Text style={styles.emptyTitle}>Sin microciclo activo</Text>
          <Text style={styles.emptySubtitle}>
            Cuando exista una programación vigente, aparecerá aquí.
          </Text>
        </View>
      </View>
    );
  }

  const rangeLabel =
    microcycleProgress?.start_date && microcycleProgress?.end_date
      ? `${formatLocalDate(microcycleProgress.start_date, { month: 'short', day: 'numeric' })} - ${formatLocalDate(
          microcycleProgress.end_date,
          { month: 'short', day: 'numeric' },
        )}`
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>
            {microcycleProgress?.microcycle_name || 'Microciclo actual'}
          </Text>
          {rangeLabel ? <Text style={styles.subtitle}>{rangeLabel}</Text> : null}
        </View>
        <View style={styles.modePill}>
          <Text style={styles.modePillText}>
            {mode === 'planned' ? 'Vista plan' : 'Vista real'}
          </Text>
        </View>
      </View>

      <View {...panResponder.panHandlers}>
        <SharedWeeklyCalendar
          days={calendarDays}
          heroSelectionMode="selected-only"
          contentWidth={contentWidth}
          edgeInset={sharedWeeklyCalendarHeroLayoutPreset.edgeInset}
          rowOffsetX={sharedWeeklyCalendarHeroLayoutPreset.rowOffsetX}
          heroOffsetX={sharedWeeklyCalendarHeroLayoutPreset.heroOffsetX}
        />
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    headerCopy: {
      flex: 1,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      marginTop: 2,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    modePill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    modePillText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    emptyState: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      padding: spacing.lg,
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      gap: spacing.md,
      ...shadows.sm,
    },
    emptyCopy: {
      flex: 1,
    },
    emptyTitle: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    emptySubtitle: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
  });

export default MicrocycleTimeline;

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brandColors, colors, fontSize, spacing } from '../../constants/colors';
import type { WeeklyProgress, DayProgress } from '../../types';
import {
  SharedWeeklyCalendar,
  type SharedWeeklyCalendarDay,
} from '../calendar/SharedWeeklyCalendar';
import {
  formatLocalShortWeekday,
  getLocalDayNumber,
  getTodayDateKey,
  toLocalDateKey,
} from '../../utils/date';

interface WeekCalendarProps {
  weeklyProgress: WeeklyProgress | null;
  selectedDate?: string;
  onDayPress?: (day: DayProgress) => void;
  contentWidth?: number;
}

const getStatusContent = (day: DayProgress, todayDateKey: string) => {
  const dateKey = toLocalDateKey(day.date) ?? day.date;
  const isPastDay = dateKey < todayDateKey;
  const isMissed = isPastDay && day.has_workout && !day.is_rest_day && day.completion_percentage < 100;

  if (day.is_rest_day) return 'Desc';
  if (!day.has_workout) return '-';
  if (isMissed && day.completion_percentage === 0) return '!';
  return `${Math.round(day.completion_percentage)}%`;
};

const getVariant = (day: DayProgress, todayDateKey: string): SharedWeeklyCalendarDay['variant'] => {
  const dateKey = toLocalDateKey(day.date) ?? day.date;
  const isPastDay = dateKey < todayDateKey;
  const isMissed = isPastDay && day.has_workout && !day.is_rest_day && day.completion_percentage < 100;

  if (day.is_rest_day) return 'rest';
  if (isMissed) return 'missed';
  if (day.completion_percentage >= 100) return 'complete';
  if (day.completion_percentage > 0) return 'partial';
  return 'default';
};

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  weeklyProgress,
  selectedDate,
  onDayPress,
  contentWidth = 390,
}) => {
  const days: DayProgress[] = weeklyProgress?.days ?? [];
  const todayDateKey = getTodayDateKey();

  const calendarDays = useMemo<SharedWeeklyCalendarDay[]>(
    () =>
      days.map((day) => ({
        id: day.date,
        dateKey: day.date,
        dayLabel: formatLocalShortWeekday(day.date),
        dateNumber: getLocalDayNumber(day.date),
        isSelected: day.date === selectedDate,
        isToday: (toLocalDateKey(day.date) ?? day.date) === todayDateKey,
        isDisabled: !day.has_workout && !day.is_rest_day,
        statusText: getStatusContent(day, todayDateKey),
        variant: getVariant(day, todayDateKey),
        onPress: () => onDayPress?.(day),
      })),
    [days, onDayPress, selectedDate, todayDateKey],
  );

  if (days.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="barbell-outline" size={22} color={brandColors.navy} />
        </View>
        <View style={styles.emptyCopy}>
          <Text style={styles.emptyTitle}>Sin entrenamientos programados</Text>
          <Text style={styles.emptyDescription}>
            Cuando training publique tu semana, el calendario aparecerá aquí.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SharedWeeklyCalendar
      days={calendarDays}
      heroSelectionMode="selected-or-today"
      contentWidth={contentWidth}
    />
  );
};

const styles = StyleSheet.create({
  emptyState: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.lg,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${brandColors.sky}24`,
  },
  emptyCopy: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.gray[800],
  },
  emptyDescription: {
    marginTop: 2,
    fontSize: fontSize.sm,
    color: colors.gray[500],
    lineHeight: 20,
  },
});

export default WeekCalendar;

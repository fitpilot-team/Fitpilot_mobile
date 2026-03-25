import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, fontSize, nutritionTheme, shadows, spacing } from '../../constants/colors';
import type { ClientDietWeekDay } from '../../types';
import {
  SharedWeeklyCalendar,
  type SharedWeeklyCalendarDay,
} from '../calendar/SharedWeeklyCalendar';
import { formatLocalDate, formatLocalShortWeekday, getLocalDayNumber } from '../../utils/date';
import { useThemedStyles, type AppTheme } from '../../theme';

interface DietWeekCalendarProps {
  days: ClientDietWeekDay[];
  selectedDate: string;
  onSelect: (date: string) => void;
  contentWidth?: number;
}

export const DietWeekCalendar: React.FC<DietWeekCalendarProps> = ({
  days,
  selectedDate,
  onSelect,
  contentWidth = 390,
}) => {
  const styles = useThemedStyles(createStyles);
  const calendarDays = useMemo<SharedWeeklyCalendarDay[]>(
    () =>
      days.map((day) => ({
        id: day.id,
        dateKey: day.assignedDate,
        dayLabel: formatLocalShortWeekday(day.assignedDate),
        dateNumber: getLocalDayNumber(day.assignedDate),
        isSelected: day.assignedDate === selectedDate,
        isToday: day.isToday,
        isDisabled: false,
        statusText: day.isToday ? 'Hoy' : '',
        variant: 'diet',
        onPress: () => onSelect(day.assignedDate),
      })),
    [days, onSelect, selectedDate],
  );
  const subtitle = useMemo(() => {
    const firstDate = days[0]?.assignedDate;
    const lastDate = days[days.length - 1]?.assignedDate;

    if (!firstDate || !lastDate) {
      return null;
    }

    return `${formatLocalDate(firstDate, { month: 'short', day: 'numeric' })} - ${formatLocalDate(
      lastDate,
      { month: 'short', day: 'numeric' },
    )}`;
  }, [days]);

  if (calendarDays.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Nutricion</Text>
        <Text style={styles.title}>Plan semanal</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <SharedWeeklyCalendar
        days={calendarDays}
        heroSelectionMode="selected-only"
        contentWidth={contentWidth}
      />
    </View>
  );
};

export default DietWeekCalendar;

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
      paddingHorizontal: spacing.md,
    },
    eyebrow: {
      color: nutritionTheme.accentStrong,
      fontSize: fontSize.xs,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    title: {
      marginTop: spacing.xs,
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      marginTop: 2,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
  });
